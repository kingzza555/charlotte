'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Button } from 'components/ui/button'
import { Input } from 'components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from 'components/ui/card'
import { Label } from 'components/ui/label'
import { Loader2, Smartphone, ArrowRight, ShieldCheck, Coffee } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function LoginPage() {
    const router = useRouter()
    const { toast } = useToast()

    const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [otpCode, setOtpCode] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    // ฟังก์ชันขอ OTP (Step 1)
    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validate เบอร์โทร (ต้อง 10 หลัก)
        if (phoneNumber.length < 10) {
            toast({
                title: "เบอร์โทรไม่ถูกต้อง",
                description: "กรุณากรอกเบอร์มือถือให้ครบ 10 หลัก",
                variant: "destructive"
            })
            return
        }

        setIsLoading(true)
        try {
            const res = await axios.post('/api/auth/send-otp', { phoneNumber })

            if (res.data.success || res.status === 200) {
                setStep('OTP')
                toast({
                    title: "ส่ง OTP สำเร็จ",
                    description: "กรุณาตรวจสอบรหัสใน SMS ของคุณ",
                })
            }
        } catch (error: any) {
            console.error('OTP Error:', error)
            toast({
                title: "เกิดข้อผิดพลาด",
                description: error.response?.data?.error || "ไม่สามารถส่ง OTP ได้",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    // ฟังก์ชันยืนยัน OTP (Step 2)
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault()

        if (otpCode.length !== 6) {
            toast({ title: "รหัสไม่ถูกต้อง", description: "OTP ต้องมี 6 หลัก", variant: "destructive" })
            return
        }

        setIsLoading(true)
        try {
            const res = await axios.post('/api/auth/verify-otp', {
                phoneNumber,
                otpCode
            })

            if (res.data.token) {
                // บันทึก Token
                localStorage.setItem('token', res.data.token)

                toast({ title: "เข้าสู่ระบบสำเร็จ!", description: "กำลังพาไปหน้าหลัก..." })

                // ตรวจสอบ Role เพื่อเปลี่ยนหน้า
                const user = res.data.user
                if (user && user.role === 'ADMIN') {
                    router.push('/admin')
                } else {
                    router.push('/dashboard')
                }
            }
        } catch (error: any) {
            console.error('Verify Error:', error)
            toast({
                title: "ยืนยันตัวตนล้มเหลว",
                description: error.response?.data?.error || "รหัส OTP ไม่ถูกต้อง",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAF9] p-4">
            {/* Background Decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-amber-100/50 blur-3xl" />
                <div className="absolute -bottom-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-stone-200/50 blur-3xl" />
            </div>

            <Card className="w-full max-w-md border-0 shadow-xl bg-white/80 backdrop-blur-sm relative z-10 animate-fade-in-up">
                <CardHeader className="text-center space-y-2 pb-8">
                    <div className="mx-auto w-16 h-16 bg-stone-900 rounded-2xl flex items-center justify-center mb-4 shadow-lg rotate-3">
                        <Coffee className="w-8 h-8 text-amber-400" />
                    </div>
                    <CardTitle className="text-2xl font-serif font-bold text-stone-900">
                        Charlotte 58Cafe
                    </CardTitle>
                    <CardDescription className="text-stone-500">
                        {step === 'PHONE'
                            ? 'กรอกเบอร์โทรศัพท์เพื่อสะสมแต้มและรับสิทธิพิเศษ'
                            : `กรอกรหัส 6 หลักที่ส่งไปยัง ${phoneNumber}`}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {step === 'PHONE' ? (
                        <form onSubmit={handleRequestOtp} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-stone-600 font-medium">เบอร์มือถือ</Label>
                                <div className="relative">
                                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="08x xxx xxxx"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').substring(0, 10))}
                                        className="pl-10 h-12 text-lg tracking-wide bg-white border-stone-200 focus:border-stone-900 focus:ring-stone-900/20 transition-all"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 text-base bg-stone-900 hover:bg-stone-800 text-white shadow-lg shadow-stone-900/20 transition-all hover:-translate-y-0.5"
                                disabled={isLoading || phoneNumber.length < 10}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังส่ง SMS...
                                    </>
                                ) : (
                                    <>
                                        รับรหัส OTP <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="otp" className="text-stone-600 font-medium">รหัส OTP</Label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                    <Input
                                        id="otp"
                                        type="text"
                                        placeholder="123456"
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                                        className="pl-10 h-12 text-lg tracking-[0.5em] text-center font-bold bg-white border-stone-200 focus:border-stone-900 focus:ring-stone-900/20"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 text-base bg-stone-900 hover:bg-stone-800 text-white shadow-lg shadow-stone-900/20 transition-all hover:-translate-y-0.5"
                                disabled={isLoading || otpCode.length < 6}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังตรวจสอบ...
                                    </>
                                ) : (
                                    'ยืนยันรหัส'
                                )}
                            </Button>

                            <button
                                type="button"
                                onClick={() => setStep('PHONE')}
                                className="w-full text-sm text-stone-500 hover:text-stone-900 transition-colors"
                            >
                                เปลี่ยนเบอร์โทรศัพท์
                            </button>
                        </form>
                    )}
                </CardContent>

                <CardFooter className="justify-center pb-8">
                    <p className="text-xs text-stone-400 text-center max-w-[200px]">
                        โดยการเข้าสู่ระบบ คุณยอมรับข้อตกลงและเงื่อนไขการให้บริการ
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}