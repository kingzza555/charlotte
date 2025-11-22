'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2, AlertCircle } from 'lucide-react'
import { isValidThaiMobileNumber, formatPhoneForDisplay } from '@/lib/phoneUtils'

export default function LoginPage() {
    const [phoneNumber, setPhoneNumber] = useState('')
    const [otp, setOtp] = useState('')
    const [step, setStep] = useState<1 | 2>(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [phoneError, setPhoneError] = useState('')
    const router = useRouter()

    // Validate phone number in real-time
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setPhoneNumber(value)

        if (value && !isValidThaiMobileNumber(value)) {
            setPhoneError('Please enter a valid Thai mobile number (e.g., 0812345678, 0912345678, 0612345678)')
        } else {
            setPhoneError('')
        }
    }

    const handleSendOtp = async () => {
        if (!phoneNumber) {
            setError('Please enter your phone number')
            return
        }
        if (!isValidThaiMobileNumber(phoneNumber)) {
            setError('Please enter a valid Thai mobile number (e.g., 0812345678, 0912345678, 0612345678)')
            return
        }
        setError('')
        setLoading(true)
        try {
            await axios.post('/api/auth/send-otp', { phoneNumber })
            setStep(2)
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || 'Failed to send OTP. Please try again.'
            setError(errorMessage)
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyOtp = async () => {
        if (!otp) {
            setError('Please enter the OTP')
            return
        }
        setError('')
        setLoading(true)
        try {
            const response = await axios.post('/api/auth/verify-otp', {
                phoneNumber,
                otpCode: otp,
            })
            const { token } = response.data
            localStorage.setItem('token', token)
            router.push('/dashboard')
        } catch (err) {
            setError('Invalid OTP. Please try again.')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
                    <CardDescription className="text-center">
                        Enter your phone number to access your rewards
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                            {error}
                        </div>
                    )}

                    {step === 1 ? (
                        <div className="space-y-2">
                            <Label htmlFor="phone">Thai Mobile Number</Label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <span className="text-gray-500 text-sm font-medium">+66</span>
                                </div>
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="812345678"
                                    value={phoneNumber}
                                    onChange={handlePhoneChange}
                                    disabled={loading}
                                    className="pl-12"
                                />
                            </div>
                            {phoneError && (
                                <div className="flex items-center gap-2 text-sm text-red-500">
                                    <AlertCircle className="h-4 w-4" />
                                    {phoneError}
                                </div>
                            )}
                            <p className="text-xs text-gray-500">
                                Enter your 9-digit number after +66 (e.g., 812345678 for +66 81 234 5678)
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label htmlFor="otp">One-Time Password</Label>
                            <Input
                                id="otp"
                                type="text"
                                placeholder="123456"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                disabled={loading}
                                maxLength={6}
                            />
                            <p className="text-xs text-muted-foreground">
                                Sent to +66 {formatPhoneForDisplay(phoneNumber).replace(/^0/, '')}
                            </p>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    {step === 1 ? (
                        <Button
                            className="w-full"
                            onClick={handleSendOtp}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Get OTP
                        </Button>
                    ) : (
                        <Button
                            className="w-full"
                            onClick={handleVerifyOtp}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Verify & Login
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}
