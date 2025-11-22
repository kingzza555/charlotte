'use client'

// POS Points Management - Record Sale and Award Points

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Search, Users, TrendingUp } from 'lucide-react'

interface CustomerInfo {
  id: string
  phoneNumber: string
  currentPoints: number
  totalSpending: number
}

interface PointsRate {
  rate: number
  description: string
}

export default function PointsManagement() {
  const [customerPhone, setCustomerPhone] = useState('')
  const [amount, setAmount] = useState('')
  const [pointsRate, setPointsRate] = useState<PointsRate | null>(null)
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [estimatedPoints, setEstimatedPoints] = useState(0)
  const { toast } = useToast()

  // Fetch points rate
  const fetchPointsRate = async () => {
    try {
      const response = await fetch('/api/admin/points-rate')
      if (response.ok) {
        const data = await response.json()
        setPointsRate(data)
      }
    } catch (error) {
      console.error('Error fetching points rate:', error)
    }
  }

  // Search customer
  const searchCustomer = async () => {
    if (!customerPhone.trim()) {
      toast({
        title: "กรุณากรอกเบอร์โทรศัพท์",
        description: "กรุณากรอกเบอร์โทรศัพท์ลูกค้าเพื่อค้นหา",
        variant: "destructive",
      })
      return
    }

    setSearching(true)
    try {
      const response = await fetch(`/api/admin/users?search=${encodeURIComponent(customerPhone.trim())}`)
      if (response.ok) {
        const users = await response.json()
        if (users.length > 0) {
          setCustomerInfo(users[0])
          toast({
            title: "พบลูกค้า",
            description: `เบอร์โทรศัพท์: ${users[0].phoneNumber}, คะแนนปัจจุบัน: ${users[0].currentPoints}`,
          })
        } else {
          setCustomerInfo(null)
          toast({
            title: "ไม่พบลูกค้า",
            description: "ไม่พบข้อมูลลูกค้าสำหรับเบอร์โทรศัพท์นี้",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "ข้อผิดพลาด",
          description: "ไม่สามารถค้นหาลูกค้าได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error searching customer:', error)
      toast({
        title: "ข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการค้นหาลูกค้า",
        variant: "destructive",
      })
    } finally {
      setSearching(false)
    }
  }

  // Calculate estimated points
  useEffect(() => {
    if (pointsRate && amount) {
      const amt = parseFloat(amount)
      if (!isNaN(amt) && amt > 0) {
        setEstimatedPoints(Math.floor(amt * pointsRate.rate))
      } else {
        setEstimatedPoints(0)
      }
    } else {
      setEstimatedPoints(0)
    }
  }, [amount, pointsRate])

  // Record transaction and award points
  const recordTransaction = async () => {
    const amt = parseFloat(amount)

    if (!customerInfo) {
      toast({
        title: "กรุณาค้นหาลูกค้าก่อน",
        description: "กรุณากรอกเบอร์โทรศัพท์และค้นหาลูกค้าก่อนบันทึกธุรกรรม",
        variant: "destructive",
      })
      return
    }

    if (isNaN(amt) || amt <= 0) {
      toast({
        title: "กรุณากรอกจำนวนเงินให้ถูกต้อง",
        description: "กรุณากรอกจำนวนเงินมากกว่า 0",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: customerInfo.id,
          amount: amt,
        }),
      })

      if (response.ok) {
        const data = await response.json()

        // Refresh customer info
        const updatedCustomerResponse = await fetch(`/api/admin/users?search=${encodeURIComponent(customerPhone.trim())}`)
        if (updatedCustomerResponse.ok) {
          const updatedUsers = await updatedCustomerResponse.json()
          if (updatedUsers.length > 0) {
            setCustomerInfo(updatedUsers[0])
          }
        }

        toast({
          title: "บันทึกธุรกรรมสำเร็จ",
          description: `บันทึกยอด ${amt.toLocaleString()} บาท และให้ ${estimatedPoints.toLocaleString()} คะแนน`,
        })

        // Reset form
        setAmount('')
        setCustomerPhone('')
        setCustomerInfo(null)
      } else {
        const errorData = await response.json()
        toast({
          title: "ข้อผิดพลาด",
          description: errorData.error || "ไม่สามารถบันทึกธุรกรรมได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error recording transaction:', error)
      toast({
        title: "ข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการบันทึกธุรกรรม",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPointsRate()
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
    }).format(value)
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
              <h1 className="text-3xl font-bold text-gray-900">เพิ่มคะแนนให้ลูกค้า</h1>
              <p className="text-gray-600 mt-1">บันทึกการซื้อและให้คะแนนอัตโนมัติ</p>
            </div>
          </div>
        </div>

        {/* Points Rate Display */}
        {pointsRate && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-blue-600">อัตราส่วนปัจจุบัน</div>
                    <div className="text-2xl font-bold text-blue-900">
                      {pointsRate.rate} คะแนนต่อ 1 บาท
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-blue-600 mb-1">ตัวอย่าง:</div>
                  <div className="text-lg font-semibold text-blue-900">
                    ซื้อ 100 บาท = {(pointsRate.rate * 100).toLocaleString()} คะแนน
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Search & Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                ข้อมูลลูกค้า
              </CardTitle>
              <CardDescription>
                ค้นหาและดูข้อมูลลูกค้า
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">เบอร์โทรศัพท์ลูกค้า</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="0812345678"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchCustomer()}
                  />
                  <Button
                    onClick={searchCustomer}
                    disabled={searching}
                  >
                    {searching ? '...' : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {customerInfo && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-3">ข้อมูลลูกค้า</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">เบอร์โทรศัพท์:</span>
                      <span className="font-medium">{customerInfo.phoneNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">คะแนนปัจจุบัน:</span>
                      <span className="font-medium text-green-600">
                        {customerInfo.currentPoints.toLocaleString()} คะแนน
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ยอดซื้อรวม:</span>
                      <span className="font-medium">
                        {formatCurrency(customerInfo.totalSpending)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transaction Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>บันทึกการซื้อ</CardTitle>
              <CardDescription>
                กรอกจำนวนเงินและบันทึกธุรกรรมเพื่อให้คะแนนอัตโนมัติ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">จำนวนเงิน (บาท)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Estimated Points Display */}
              {amount && estimatedPoints > 0 && (
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-amber-800">คะแนนที่จะได้รับ</div>
                      <div className="text-2xl font-bold text-amber-900">
                        {estimatedPoints.toLocaleString()} คะแนน
                      </div>
                    </div>
                    <div className="text-right text-sm text-amber-700">
                      <div>จากยอดซื้อ</div>
                      <div className="font-semibold">
                        {formatCurrency(parseFloat(amount))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={recordTransaction}
                disabled={loading || !customerInfo || !amount || parseFloat(amount) <= 0}
                className="w-full"
                size="lg"
              >
                {loading ? 'กำลังบันทึก...' : 'บันทึกการซื้อและให้คะแนน'}
              </Button>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">ข้อมูลธุรกรรม:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">ลูกค้า:</span>
                    <span className="font-medium ml-2">
                      {customerInfo ? customerInfo.phoneNumber : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">จำนวนเงิน:</span>
                    <span className="font-medium ml-2">
                      {amount ? formatCurrency(parseFloat(amount)) : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">คะแนนที่ได้:</span>
                    <span className="font-medium ml-2 text-green-600">
                      {estimatedPoints.toLocaleString()} คะแนน
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">คะแนนหลังได้รับ:</span>
                    <span className="font-medium ml-2 text-blue-600">
                      {customerInfo
                        ? (customerInfo.currentPoints + estimatedPoints).toLocaleString()
                        : '-'
                      } คะแนน
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}