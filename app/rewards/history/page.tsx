'use client'

// Customer Redemption History Page

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
  Filter
} from 'lucide-react'

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
  const { toast } = useToast()

  // Fetch redemption history
  const fetchHistory = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('กรุณาเข้าสู่ระบบก่อนดูประวัติการแลกของรางวัล')
        setTimeout(() => {
          router.push('/login')
        }, 2000)
        setLoading(false)
        return
      }

      const response = await fetch('/api/rewards/history', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setHistoryData(data)
      } else {
        setError('ไม่สามารถดึงข้อมูลประวัติการแลกของรางวัลได้ กรุณาลองใหม่')
      }
    } catch (error: any) {
      console.error('Error fetching redemption history:', error)

      if (error.response?.status === 401) {
        setError('Token หมดอายุ กรุณาเข้าสู่ระบบใหม่')
        localStorage.removeItem('token')
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        setError('เกิดข้อผิดพลาดในการดึงข้อมูล กรุณาลองใหม่')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  // Filter redemptions by status
  const filteredRedemptions = historyData?.redemptions.filter(redemption =>
    statusFilter === 'ALL' || redemption.status === statusFilter
  ) || []

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
            <Clock className="h-3 w-3" />
            รอดยืนยัน
          </Badge>
        )
      case 'VERIFIED':
        return (
          <Badge variant="default" className="flex items-center gap-1 w-fit">
            <CheckCircle className="h-3 w-3" />
            รอดำเนินการ
          </Badge>
        )
      case 'COMPLETED':
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1 w-fit">
            <CheckCircle className="h-3 w-3" />
            เสร็จสิ้น
          </Badge>
        )
      case 'CANCELLED':
        return (
          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
            <XCircle className="h-3 w-3" />
            ยกเลิก
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH').format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4 mb-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>ลองใหม่</Button>
        </div>
      </div>
    )
  }

  if (!historyData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/rewards')}
            >
              <ArrowLeft className="h-4 w-4" />
              กลับ
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ประวัติการแลกของรางวัล</h1>
              <p className="text-gray-600 mt-1">ดูประวัติการแลกของรางวัลทั้งหมดของคุณ</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">แลกทั้งหมด</p>
                  <p className="text-2xl font-bold">{historyData.stats.totalRedemptions}</p>
                </div>
                <div className="bg-blue-100 p-2 rounded-full">
                  <History className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">แลกสำเร็จ</p>
                  <p className="text-2xl font-bold text-green-600">{historyData.stats.completedRedemptions}</p>
                </div>
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">คะแนนที่ใช้ไป</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(historyData.stats.totalPointsSpent)}</p>
                </div>
                <div className="bg-purple-100 p-2 rounded-full">
                  <Coins className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">คะแนนปัจจุบัน</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(historyData.user.currentPoints)}</p>
                </div>
                <div className="bg-blue-100 p-2 rounded-full">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* History List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                รายการการแลกของรางวัล
              </CardTitle>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value="ALL">ทั้งหมด</option>
                  <option value="PENDING">รอดยืนยัน</option>
                  <option value="VERIFIED">รอดำเนินการ</option>
                  <option value="COMPLETED">เสร็จสิ้น</option>
                  <option value="CANCELLED">ยกเลิก</option>
                </select>
              </div>
            </div>
            <CardDescription>
              ประวัติการแลกของรางวัลทั้งหมด ({filteredRedemptions.length} รายการ)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredRedemptions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Gift className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>ไม่พบประวัติการแลกของรางวัล</p>
                <p className="text-sm">คุณยังไม่เคยแลกของรางวัลมาก่อน</p>
                <Button
                  onClick={() => router.push('/rewards')}
                  className="mt-4"
                >
                  ไปที่หน้าของรางวัล
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRedemptions.map((redemption) => (
                  <Card key={redemption.id} className="relative">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        {/* Left: Reward Info */}
                        <div className="flex gap-4 flex-1">
                          {/* Reward Image */}
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            {redemption.reward.imageUrl ? (
                              <img
                                src={redemption.reward.imageUrl}
                                alt={redemption.reward.name}
                                className="max-w-full max-h-full object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                                }}
                              />
                            ) : null}
                            <Gift className="h-8 w-8 text-gray-400" />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {getStatusBadge(redemption.status)}
                              <h3 className="font-semibold text-lg">{redemption.reward.name}</h3>
                            </div>

                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                แลกเมื่อ: {formatDate(redemption.createdAt)}
                              </div>

                              {redemption.verifiedAt && (
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-blue-500" />
                                  ยืนยันเมื่อ: {formatDate(redemption.verifiedAt)}
                                </div>
                              )}

                              {redemption.completedAt && (
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  แลกเสร็จเมื่อ: {formatDate(redemption.completedAt)}
                                </div>
                              )}
                            </div>

                            {redemption.reward.description && (
                              <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                                {redemption.reward.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right: Points and Code */}
                        <div className="text-right ml-4">
                          <div className="text-lg font-bold text-purple-600 mb-1">
                            {formatCurrency(redemption.pointsCost)} คะแนน
                          </div>
                          <div className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                            {redemption.code}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}