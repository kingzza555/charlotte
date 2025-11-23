'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation' // ✅ ใช้ Router ของจริง
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'components/ui/card'
import { Button } from 'components/ui/button'
import { Badge } from 'components/ui/badge'
import { Skeleton } from 'components/ui/skeleton' // ✅ ใช้ Component จริง
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft,
  History,
  Gift,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Coins,
  Calendar,
  Filter,
  Receipt,
  ShoppingBag
} from 'lucide-react'
import axios from 'axios'

// --- Interfaces ---
interface Redemption {
  id: string
  code: string
  status: string
  pointsCost: number
  createdAt: string
  updatedAt: string
  verifiedAt?: string
  completedAt?: string
  reward: {
    id: string
    name: string
    description: string | null
    imageUrl: string | null
    pointsCost: number
  }
}

interface RedemptionHistoryResponse {
  success: boolean
  redemptions: Redemption[]
  stats: {
    totalRedemptions: number
    completedRedemptions: number
    pendingRedemptions: number
    verifiedRedemptions: number
    cancelledRedemptions: number
    totalPointsSpent: number
    currentPoints: number
  }
  user: {
    phoneNumber: string
    currentPoints: number
  }
}

type StatusFilter = 'ALL' | 'PENDING' | 'VERIFIED' | 'COMPLETED' | 'CANCELLED'

export default function RedemptionHistoryPage() {
  const [historyData, setHistoryData] = useState<RedemptionHistoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')

  const router = useRouter()
  // const { toast } = useToast() // เก็บไว้เผื่อใช้

  // 1. Fetch Logic (จากโค้ดเก่า)
  const fetchHistory = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('กรุณาเข้าสู่ระบบก่อนดูประวัติ')
        setTimeout(() => {
          router.push('/login')
        }, 2000)
        return
      }

      // ใช้ axios เพื่อความสะดวกและจัดการ Error ได้ดีกว่า
      const response = await axios.get('/api/rewards/history', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.data) {
        setHistoryData(response.data)
      }
    } catch (error: any) {
      console.error('Error fetching history:', error)

      if (error.response?.status === 401) {
        setError('เซสชั่นหมดอายุ กรุณาเข้าสู่ระบบใหม่')
        localStorage.removeItem('token')
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        setError('ไม่สามารถดึงข้อมูลประวัติได้ กรุณาลองใหม่อีกครั้ง')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  // 2. Filters
  const filteredRedemptions = historyData?.redemptions.filter(redemption =>
    statusFilter === 'ALL' || redemption.status === statusFilter
  ) || []

  // 3. Helper Functions (Formatters & Badges)
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-0 flex items-center gap-1.5 px-2.5 py-0.5 shadow-none w-fit">
            <Clock className="h-3.5 w-3.5" />
            <span className="font-medium text-xs">รอตรวจสอบ</span>
          </Badge>
        )
      case 'VERIFIED':
        return (
          <Badge variant="default" className="bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1.5 px-2.5 py-0.5 shadow-none hover:bg-blue-100 w-fit">
            <CheckCircle className="h-3.5 w-3.5" />
            <span className="font-medium text-xs">ยืนยันแล้ว</span>
          </Badge>
        )
      case 'COMPLETED':
        return (
          <Badge className="bg-green-50 text-green-700 border border-green-100 flex items-center gap-1.5 px-2.5 py-0.5 shadow-none hover:bg-green-100 w-fit">
            <ShoppingBag className="h-3.5 w-3.5" />
            <span className="font-medium text-xs">รับของแล้ว</span>
          </Badge>
        )
      case 'CANCELLED':
        return (
          <Badge variant="destructive" className="bg-stone-100 text-stone-500 border border-stone-200 flex items-center gap-1.5 px-2.5 py-0.5 shadow-none hover:bg-stone-200 w-fit">
            <XCircle className="h-3.5 w-3.5" />
            <span className="font-medium text-xs">ยกเลิก</span>
          </Badge>
        )
      default:
        return <Badge className="bg-stone-100 text-stone-600">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH').format(amount)
  }

  // --- UI Section ---

  // Loading State (UI ใหม่)
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-24 rounded-full" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>

          <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-stone-100 flex justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-32 rounded-lg" />
            </div>
            <div className="p-6 space-y-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex gap-4">
                  <Skeleton className="h-20 w-20 rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error State (UI ใหม่)
  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-red-500/5 text-center max-w-sm w-full border border-red-50">
          <div className="bg-red-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-stone-900 font-serif text-xl font-bold mb-2">เกิดข้อผิดพลาด</h3>
          <p className="text-stone-500 mb-6 text-sm leading-relaxed">{error}</p>
          <Button onClick={() => window.location.reload()} className="w-full bg-stone-900 rounded-xl h-10">ลองใหม่</Button>
        </div>
      </div>
    )
  }

  if (!historyData) return null

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-stone-900 font-sans selection:bg-amber-100 selection:text-amber-900 pb-12">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#FAFAF9]/80 backdrop-blur-xl border-b border-stone-200/50 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/rewards')}
                className="h-9 w-9 -ml-2 rounded-full hover:bg-stone-200/50 text-stone-500 hover:text-stone-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-serif font-bold text-stone-900 tracking-tight">ประวัติการแลก</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">คะแนนคงเหลือ</p>
                <p className="text-sm font-bold text-amber-600">{formatCurrency(historyData.user.currentPoints)} pts</p>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 space-y-8">
          {/* Stats Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'แลกทั้งหมด', value: historyData.stats.totalRedemptions, icon: History, color: 'text-stone-900', bg: 'bg-stone-100' },
              { label: 'แลกสำเร็จ', value: historyData.stats.completedRedemptions, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
              { label: 'คะแนนที่ใช้', value: formatCurrency(historyData.stats.totalPointsSpent), icon: Coins, color: 'text-amber-600', bg: 'bg-amber-100' },
              { label: 'คะแนนปัจจุบัน', value: formatCurrency(historyData.user.currentPoints), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-100' },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-serif font-bold text-stone-900">{stat.value}</p>
                  <p className="text-xs font-medium text-stone-500 mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* History List Section */}
          <Card className="border-none shadow-none bg-transparent">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-stone-400" />
                  รายการธุรกรรม
                </h2>
                <p className="text-sm text-stone-500 mt-1">
                  แสดง {filteredRedemptions.length} รายการ
                </p>
              </div>

              {/* Styled Filter Dropdown */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="pl-9 pr-8 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-medium text-stone-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 appearance-none cursor-pointer hover:border-stone-300 transition-colors w-full sm:w-auto"
                >
                  <option value="ALL">สถานะทั้งหมด</option>
                  <option value="PENDING">รอตรวจสอบ</option>
                  <option value="VERIFIED">ยืนยันแล้ว</option>
                  <option value="COMPLETED">สำเร็จ</option>
                  <option value="CANCELLED">ยกเลิก</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <CardContent className="p-0 space-y-4">
              {filteredRedemptions.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-stone-200 rounded-3xl p-12 text-center">
                  <div className="bg-stone-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <History className="h-8 w-8 text-stone-300" />
                  </div>
                  <h3 className="text-stone-900 font-bold text-lg mb-2">ไม่พบประวัติการแลก</h3>
                  <p className="text-stone-500 text-sm mb-6">คุณยังไม่เคยทำการแลกของรางวัล</p>
                  <Button
                    onClick={() => router.push('/rewards')}
                    className="bg-stone-900 text-white rounded-xl h-10 px-6 shadow-lg shadow-stone-900/10 hover:shadow-xl hover:bg-stone-800"
                  >
                    ดูของรางวัล
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRedemptions.map((redemption) => (
                    <div
                      key={redemption.id}
                      className="group bg-white rounded-2xl p-4 border border-stone-100 shadow-sm hover:shadow-md hover:border-stone-200 transition-all duration-300 relative overflow-hidden"
                    >
                      {/* Status Line Indicator */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${redemption.status === 'COMPLETED' ? 'bg-green-500' :
                          redemption.status === 'CANCELLED' ? 'bg-stone-300' :
                            redemption.status === 'VERIFIED' ? 'bg-blue-500' : 'bg-amber-500'
                        }`} />

                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pl-2">
                        {/* Reward Image */}
                        <div className="relative w-full sm:w-20 h-32 sm:h-20 bg-stone-50 rounded-xl overflow-hidden shrink-0 border border-stone-100">
                          {redemption.reward.imageUrl ? (
                            <img
                              src={redemption.reward.imageUrl}
                              alt={redemption.reward.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                e.currentTarget.nextElementSibling?.classList.remove('hidden')
                              }}
                            />
                          ) : null}
                          <div className={`absolute inset-0 flex items-center justify-center ${redemption.reward.imageUrl ? 'hidden' : ''}`}>
                            <Gift className="h-8 w-8 text-stone-300" />
                          </div>
                        </div>

                        {/* Content Info */}
                        <div className="flex-1 flex flex-col justify-between py-0.5">
                          <div className="flex justify-between items-start gap-4 mb-2 sm:mb-0">
                            <div className="space-y-1">
                              <h3 className="font-serif font-bold text-lg text-stone-900 leading-tight">
                                {redemption.reward.name}
                              </h3>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(redemption.status)}
                                <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wide bg-stone-50 px-1.5 py-0.5 rounded">
                                  ID: {redemption.code}
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="block text-lg font-bold text-stone-900">
                                {formatCurrency(redemption.pointsCost)}
                              </span>
                              <span className="text-xs font-medium text-stone-400">แต้ม</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 pt-3 border-t border-stone-100 border-dashed mt-auto">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-stone-400" />
                              <span>แลกเมื่อ: {formatDate(redemption.createdAt)}</span>
                            </div>

                            {redemption.verifiedAt && (
                              <div className="flex items-center gap-1.5 text-blue-600/80">
                                <CheckCircle className="h-3.5 w-3.5" />
                                <span>ยืนยัน: {formatDate(redemption.verifiedAt)}</span>
                              </div>
                            )}

                            {redemption.completedAt && (
                              <div className="flex items-center gap-1.5 text-green-600/80">
                                <ShoppingBag className="h-3.5 w-3.5" />
                                <span>รับของ: {formatDate(redemption.completedAt)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}