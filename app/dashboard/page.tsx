'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CreditCard, Calendar, Award, LogOut, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
            const token = localStorage.getItem('token')
            if (!token) {
                router.push('/login')
                return
            }

            try {
                const response = await axios.get('/api/user/summary', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                setSummary(response.data)
            } catch (err) {
                console.error(err)
                setError('Failed to load data. Please try again.')
                // Optional: Redirect to login on 401
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
        localStorage.removeItem('token')
        router.push('/login')
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
                <h1 className="text-xl font-bold text-primary">Charlotte 58Cafe</h1>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                    <LogOut className="h-5 w-5" />
                </Button>
            </header>

            <main className="p-4 space-y-6 max-w-md mx-auto">
                {/* Big Card: Current Points */}
                <Card className="bg-primary text-primary-foreground overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Award className="h-32 w-32" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium opacity-90">Current Points</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-5xl font-bold tracking-tight">
                            {summary?.currentPoints.toLocaleString()}
                        </div>
                        <p className="text-sm opacity-75 mt-1">Available to redeem</p>
                    </CardContent>
                </Card>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <Card>
                        <CardHeader className="pb-2 p-4">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                Total Spending
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold">
                                ฿{summary?.totalSpending.toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2 p-4">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                This Month
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold">
                                ฿{summary?.spendingThisMonth.toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Rewards Navigation Card */}
                <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/rewards')}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-semibold text-purple-900 flex items-center gap-2">
                            <Gift className="h-5 w-5 text-purple-600" />
                            ของรางวัล
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-purple-700 text-sm mb-3">
                            แลกคะแนนสะสมเพื่อรับของรางวัลพิเศษ
                        </p>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-purple-600">
                                ดูของรางวัลทั้งหมด
                            </span>
                            <span className="text-purple-600">→</span>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
