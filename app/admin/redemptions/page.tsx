'use client'

// Admin Redemption Management - Verify and confirm customer redemptions

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'components/ui/card'
import { Input } from 'components/ui/input'
import { Button } from 'components/ui/button'
import { Badge } from 'components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Search, Check, X, Clock, CheckCircle, XCircle, Users, Gift, Loader2 } from 'lucide-react'

interface RedemptionRequest {
  id: string
  code: string
  status: string
  pointsCost: number
  createdAt: string
  updatedAt: string
  verifiedAt?: string
  completedAt?: string
  user: {
    id: string
    phoneNumber: string
    currentPoints: number
    createdAt: string
  }
  reward: {
    id: string
    name: string
    pointsCost: number
    imageUrl?: string
  }
}

type StatusFilter = 'PENDING' | 'VERIFIED' | 'COMPLETED' | 'CANCELLED' | 'ALL'

export default function RedemptionsPage() {
  const [redemptions, setRedemptions] = useState<RedemptionRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING')
  const [verifyingId, setVerifyingId] = useState<string | null>(null)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch redemptions
  const fetchRedemptions = async () => {
    setLoading(true)
    try {
      const status = statusFilter === 'ALL' ? '' : statusFilter
      const response = await fetch(`/api/admin/redemptions${status ? `?status=${status}` : ''}`)

      if (response.ok) {
        const data = await response.json()
        setRedemptions(data)
      } else {
        toast({
          title: "ข้อผิดพลาด",
          description: "ไม่สามารถดึงข้อมูลการแลกของรางวัลได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching redemptions:', error)
      toast({
        title: "ข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการดึงข้อมูล",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Verify redemption code
  const verifyRedemption = async (code: string) => {
    setVerifyingId(code)
    try {
      const response = await fetch('/api/admin/redemptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "ยืนยันสำเร็จ",
          description: data.message,
        })
        fetchRedemptions()
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: data.error || "ไม่สามารถยืนยันได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error verifying redemption:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "กรุณาลองใหม่",
        variant: "destructive",
      })
    } finally {
      setVerifyingId(null)
    }
  }

  // Complete redemption (final confirmation)
  const completeRedemption = async (id: string) => {
    setCompletingId(id)
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการดำเนินการแลกของรางวัลนี้? คะแนนจะถูกตัดออกทันทัน')) {
      setCompletingId(null)
      return
    }

    try {
      const response = await fetch(`/api/admin/redemptions/${id}`, {
        method: 'PUT',
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "แลกของรางวัลสำเร็จ",
          description: data.message,
        })
        fetchRedemptions()
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: data.error || "ไม่สามารถดำเนินการได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error completing redemption:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "กรุณาลองใหม่",
        variant: "destructive",
      })
    } finally {
      setCompletingId(null)
    }
  }

  // Cancel redemption
  const cancelRedemption = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการแลกของรางวัลนี้?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/redemptions/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "ยกเลิกสำเร็จ",
          description: data.message,
        })
        fetchRedemptions()
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: data.error || "ไม่สามารถยกเลิกได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error cancelling redemption:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "กรุณาลองใหม่",
        variant: "destructive",
      })
    }
  }

  // Filter redemptions by search
  const filteredRedemptions = redemptions.filter(redemption =>
    redemption.code.includes(searchQuery) ||
    redemption.user.phoneNumber.includes(searchQuery) ||
    redemption.reward.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get status counts
  const statusCounts = redemptions.reduce((acc, redemption) => {
    acc[redemption.status] = (acc[redemption.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  useEffect(() => {
    fetchRedemptions()
  }, [statusFilter])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />รอยืนยัน</Badge>
      case 'VERIFIED':
        return <Badge variant="default"><Check className="h-3 w-3 mr-1" />รอดำเนินการ</Badge>
      case 'COMPLETED':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />เสร็จสิ้น</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />ยกเลิก</Badge>
      default:
        return <Badge>{status}</Badge>
    }
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
              onClick={() => window.location.href = '/admin'}
            >
              <ArrowLeft className="h-4 w-4" />
              กลับ
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">จัดการการแลกของรางวัล</h1>
              <p className="text-gray-600 mt-1">ยืนยันและดำเนินการแลกของรางวัลของลูกค้า</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">ทั้งหมด</p>
                  <p className="text-2xl font-bold">{redemptions.length}</p>
                </div>
                <div className="bg-gray-100 p-2 rounded-full">
                  <Users className="h-5 w-5 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">รอยืนยัน</p>
                  <p className="text-2xl font-bold text-orange-600">{statusCounts.PENDING || 0}</p>
                </div>
                <div className="bg-orange-100 p-2 rounded-full">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">รอดำเนินการ</p>
                  <p className="text-2xl font-bold text-blue-600">{statusCounts.VERIFIED || 0}</p>
                </div>
                <div className="bg-blue-100 p-2 rounded-full">
                  <Check className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">เสร็จสิ้น</p>
                  <p className="text-2xl font-bold text-green-600">{statusCounts.COMPLETED || 0}</p>
                </div>
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>ตัวกรองและค้นหา</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Status Filter */}
              <div className="flex-1">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="PENDING">รอยืนยัน</option>
                  <option value="VERIFIED">รอดำเนินการ</option>
                  <option value="COMPLETED">เสร็จสิ้น</option>
                  <option value="CANCELLED">ยกเลิก</option>
                  <option value="ALL">ทั้งหมด</option>
                </select>
              </div>

              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="ค้นหาตามรหัส, เบอร์โทรศัพท์ หรือชื่อของรางวัล..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Redemption Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              รายการแลกของรางวัล
            </CardTitle>
            <CardDescription>
              รายการที่ต้องการยืนยันและดำเนินการแลกของรางวัล
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">กำลังโหลด...</div>
            ) : filteredRedemptions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Gift className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>ไม่พบรายการแลกของรางวัล</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRedemptions.map((redemption) => (
                  <Card key={redemption.id} className="relative">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        {/* Left: User and Reward Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            {getStatusBadge(redemption.status)}
                            <div className="text-sm font-medium text-gray-900">
                              รหัส: <span className="font-mono text-lg">{redemption.code}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">ลูกค้า:</span>
                              <div className="font-medium">
                                {redemption.user.phoneNumber}
                                <span className="ml-2 text-gray-500">
                                  ({redemption.user.currentPoints.toLocaleString()} คะแนน)
                                </span>
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600">ของรางวัล:</span>
                              <div className="font-medium">{redemption.reward.name}</div>
                            </div>
                          </div>
                        </div>

                        {/* Right: Reward Image and Points */}
                        <div className="text-right">
                          <div className="text-lg font-bold text-purple-600 mb-1">
                            {redemption.pointsCost.toLocaleString()} คะแนน
                          </div>
                          {redemption.reward.imageUrl && (
                            <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center mx-auto">
                              <img
                                src={redemption.reward.imageUrl}
                                alt={redemption.reward.name}
                                className="max-w-full max-h-full object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Timestamps */}
                      <div className="text-xs text-gray-500 mb-4">
                        <div>สร้างเมื่อ: {new Date(redemption.createdAt).toLocaleString('th-TH')}</div>
                        {redemption.verifiedAt && (
                          <div>ยืนยันเมื่อ: {new Date(redemption.verifiedAt).toLocaleString('th-TH')}</div>
                        )}
                        {redemption.completedAt && (
                          <div>เสร็จเมื่อ: {new Date(redemption.completedAt).toLocaleString('th-TH')}</div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {redemption.status === 'PENDING' && (
                          <>
                            <Button
                              onClick={() => verifyRedemption(redemption.code)}
                              disabled={verifyingId === redemption.code}
                              className="flex-1"
                              size="sm"
                            >
                              {verifyingId === redemption.code ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  กำลังตรวจสอบ...
                                </>
                              ) : (
                                'ยืนยัน'
                              )}
                            </Button>
                            <Button
                              onClick={() => cancelRedemption(redemption.id)}
                              variant="destructive"
                              size="sm"
                            >
                              <X className="h-4 w-4" />
                              ยกเลิก
                            </Button>
                          </>
                        )}

                        {redemption.status === 'VERIFIED' && (
                          <Button
                            onClick={() => completeRedemption(redemption.id)}
                            disabled={completingId === redemption.id}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            size="sm"
                          >
                            {completingId === redemption.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                กำลังดำเนินการ...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                ยืนยันการแลก
                              </>
                            )}
                          </Button>
                        )}

                        {redemption.status === 'COMPLETED' && (
                          <Badge className="bg-green-100 text-green-800 w-full justify-center py-2">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            แลกของรางวัลแล้ว
                          </Badge>
                        )}

                        {redemption.status === 'CANCELLED' && (
                          <Badge variant="destructive" className="w-full justify-center py-2">
                            <XCircle className="h-3 w-3 mr-1" />
                            ยกเลิกแล้ว
                          </Badge>
                        )}
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