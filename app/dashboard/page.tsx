'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle } from 'components/ui/card'
import { Loader2, CreditCard, Calendar, Award, LogOut, Gift, Coffee, ChevronRight, Sparkles } from 'lucide-react'
import { Button } from 'components/ui/button'

// กำหนด Type ให้ตรงกับข้อมูลที่ API ส่งมา
interface UserSummary {
    currentPoints: number
    totalSpending: number
    spendingThisMonth: number
}

export default function DashboardPage() {
    const [summary, setSummary] = useState<UserSummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const router = useRouter()

    useEffect(() => {
        const fetchSummary = async () => {
            // 1. ตรวจสอบ Token ใน LocalStorage
            const token = localStorage.getItem('token')

            // ถ้าไม่มี Token ให้ดีดกลับไปหน้า Login
            if (!token) {
                router.push('/login')
                return
            }

            try {
                // 2. ดึงข้อมูลจาก API จริง (/api/user/summary)
                const response = await axios.get('/api/user/summary', {
                    headers: {
                        Authorization: `Bearer ${token}`, // แนบ Token ไปยืนยันตัวตน
                    },
                })
                setSummary(response.data)
            } catch (err) {
                console.error(err)
                setError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง')

                // 3. กรณี Token หมดอายุหรือผิดพลาด (401) ให้เคลียร์ทิ้งแล้วไป Login ใหม่
                if (axios.isAxiosError(err) && err.response?.status === 401) {
                    localStorage.removeItem('token')
                    router.push('/login')
                }
            } finally {
                setLoading(false)
            }
        }

        fetchSummary()
    }, [router])

    const handleLogout = () => {
        // ลบ Token และกลับไปหน้า Login
        localStorage.removeItem('token')
        router.push('/login')
    }

    // --- ส่วนแสดงผล: กำลังโหลด (Loading State) ---
    if (loading) {
        return (
            <div className="min-h-screen bg-[#FAFAF9] flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-stone-200 rounded-full animate-ping opacity-25"></div>
                    <div className="bg-white p-4 rounded-full shadow-lg relative z-10">
                        <Coffee className="h-8 w-8 text-stone-800 animate-pulse" />
                    </div>
                </div>
                <p className="text-stone-500 font-serif text-sm tracking-wide animate-pulse">กำลังเตรียมข้อมูลแดชบอร์ดของคุณ...</p>
            </div>
        )
    }

    // --- ส่วนแสดงผล: เมื่อเกิดข้อผิดพลาด (Error State) ---
    if (error) {
        return (
            <div className="min-h-screen bg-[#FAFAF9] flex flex-col items-center justify-center p-6">
                <Card className="max-w-xs w-full border-0 shadow-xl shadow-stone-200/50 text-center p-6 animate-scale-in">
                    <CardHeader className="flex flex-col items-center space-y-4 pb-2">
                        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                            <LogOut className="h-5 w-5 text-red-500 ml-0.5" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg text-stone-900">เกิดข้อผิดพลาด</CardTitle>
                            <p className="text-stone-500 text-sm">{error}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <Button onClick={() => window.location.reload()} className="w-full bg-stone-900 hover:bg-stone-800">
                            ลองใหม่อีกครั้ง
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // --- ส่วนแสดงผลหลัก: Dashboard UI ---
    return (
        <div className="min-h-screen bg-[#FAFAF9] text-stone-900 font-sans selection:bg-amber-100 selection:text-amber-900">
            {/* Header: ส่วนหัวเว็บไซต์ */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100/50 supports-[backdrop-filter]:bg-white/60">
                <div className="max-w-md mx-auto px-6 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-stone-900 p-1.5 rounded-lg shadow-sm">
                            <Coffee className="h-4 w-4 text-[#FAFAF9]" strokeWidth={2.5} />
                        </div>
                        <h1 className="text-lg font-serif font-bold text-stone-900 tracking-tight">Charlotte 58Cafe</h1>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                        className="text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors rounded-full -mr-2"
                    >
                        <LogOut className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            <main className="p-6 pb-24 space-y-8 max-w-md mx-auto pt-8">
                {/* Greeting Section: คำทักทาย */}
                <div className="space-y-1 animate-fade-in-up">
                    <h2 className="text-2xl font-light text-stone-800 font-serif">สวัสดี, ลูกค้าคนพิเศษ</h2>
                    <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">ภาพรวมสมาชิก</p>
                </div>

                {/* Hero Card: คะแนนสะสม (Current Points) */}
                <div className="animate-fade-in-up [animation-delay:100ms]">
                    <Card className="border-0 bg-[#2A2725] text-[#FAFAF9] overflow-hidden relative shadow-2xl shadow-stone-900/20 rounded-[24px] group h-[220px] flex flex-col justify-between transition-transform duration-500 hover:scale-[1.02]">
                        {/* ตกแต่งพื้นหลัง */}
                        <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700 ease-in-out">
                            <Award className="h-48 w-48 rotate-12" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20 pointer-events-none" />

                        <CardHeader className="pb-0 relative z-10 pt-7 px-7">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1 px-2 bg-white/10 rounded-full backdrop-blur-sm border border-white/5">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200">Gold Member</span>
                                        </div>
                                    </div>
                                    <CardTitle className="text-xs font-medium uppercase tracking-widest text-stone-400">คะแนนสะสม</CardTitle>
                                </div>
                                <div className="p-2 bg-white/5 rounded-full backdrop-blur-md border border-white/5">
                                    <Sparkles className="h-5 w-5 text-amber-200 animate-pulse-slow" />
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="relative z-10 px-7 pb-7">
                            <div className="flex flex-col space-y-2">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-6xl font-serif font-medium tracking-tighter text-[#E8D4B9] tabular-nums">
                                        {summary?.currentPoints.toLocaleString()}
                                    </span>
                                    <span className="text-lg font-medium text-stone-500 mb-1">แต้ม</span>
                                </div>
                                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                                    <div className="bg-gradient-to-r from-amber-200 to-amber-500 h-full w-[75%] rounded-full shadow-[0_0_10px_rgba(251,191,36,0.5)]"></div>
                                </div>
                                <p className="text-[10px] text-stone-400 pt-1 text-right">ใช้ได้ถึง: 31 ธ.ค. 2025</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Stats Grid: ยอดเงินรวม และ เดือนนี้ */}
                <div className="grid grid-cols-2 gap-4 animate-fade-in-up [animation-delay:200ms]">
                    <Card className="border-0 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] bg-white rounded-2xl group hover:shadow-lg transition-all duration-300">
                        <CardHeader className="pb-3 p-5 space-y-0">
                            <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center mb-4 group-hover:bg-stone-900 transition-colors duration-300">
                                <CreditCard className="h-5 w-5 text-stone-400 group-hover:text-[#FAFAF9] transition-colors duration-300" />
                            </div>
                            <CardTitle className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                                ยอดซื้อรวม
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-0">
                            <div className="text-xl font-bold text-stone-800 tabular-nums font-serif">
                                ฿{summary?.totalSpending.toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] bg-white rounded-2xl group hover:shadow-lg transition-all duration-300">
                        <CardHeader className="pb-3 p-5 space-y-0">
                            <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center mb-4 group-hover:bg-stone-900 transition-colors duration-300">
                                <Calendar className="h-5 w-5 text-stone-400 group-hover:text-[#FAFAF9] transition-colors duration-300" />
                            </div>
                            <CardTitle className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                                เดือนนี้
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-0">
                            <div className="text-xl font-bold text-stone-800 tabular-nums font-serif">
                                ฿{summary?.spendingThisMonth.toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Rewards Navigation Card: ปุ่มไปหน้าแลกรางวัล */}
                <div
                    className="animate-fade-in-up [animation-delay:300ms]"
                    onClick={() => router.push('/rewards')} // สั่งให้คลิกได้จริง
                >
                    <Card className="group relative overflow-hidden border-0 bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-xl shadow-orange-500/20 cursor-pointer rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/30 hover:-translate-y-1">
                        <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 transition-transform duration-700 group-hover:rotate-12">
                            <Gift className="h-32 w-32" />
                        </div>

                        <CardContent className="p-6 relative z-10 flex items-center justify-between">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="bg-white/20 p-1.5 rounded-md backdrop-blur-md">
                                        <Gift className="h-4 w-4 text-white" />
                                    </div>
                                    <h3 className="font-bold text-lg tracking-tight">แลกของรางวัล</h3>
                                </div>
                                <p className="text-orange-50 text-sm font-medium leading-relaxed opacity-90 max-w-[180px]">
                                    นำคะแนนสะสมไปแลกรับสิทธิพิเศษ
                                </p>
                            </div>

                            <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-lg text-orange-500 group-hover:scale-110 transition-transform duration-300">
                                <ChevronRight className="h-5 w-5 ml-0.5" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}