'use client'

// Customer Rewards Page - View available rewards

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Gift, Coins, Lock, Loader2, QrCode, Copy, CheckCircle, PartyPopper, History } from 'lucide-react'

interface Reward {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  pointsCost: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  canAfford: boolean
  pointsNeeded: number
}

interface RewardsResponse {
  rewards: Reward[]
  userPoints: number
  totalRewards: number
}

export default function RewardsPage() {
  const [rewardsData, setRewardsData] = useState<RewardsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [showCodeDialog, setShowCodeDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [successData, setSuccessData] = useState({
    rewardName: '',
    pointsUsed: 0,
    remainingPoints: 0
  })
  const router = useRouter()
  const { toast } = useToast()

  // Fetch user info and rewards from API
  const fetchRewards = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setError('กรุณาเข้าสู่ระบบก่อนดูของรางวัล')
      setTimeout(() => {
        router.push('/login')
      }, 2000)
      setLoading(false)
      return
    }

    try {
      // Get user info first
      const userResponse = await axios.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (userResponse.data.id) {
        setUserId(userResponse.data.id)

        // Now fetch rewards with userId
        const response = await fetch(`/api/rewards?userId=${userResponse.data.id}`)

        if (response.ok) {
          const data = await response.json()
          setRewardsData(data)
        } else {
          setError('ไม่สามารถดึงข้อมูลของรางวัลได้ กรุณาลองใหม่')
        }
      } else {
        setError('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่')
      }
    } catch (error: any) {
      console.error('Error fetching rewards:', error)

      // Handle specific error messages
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

  const [redeemingRewardId, setRedeemingRewardId] = useState<string | null>(null)

  // Handle reward redemption
  const handleRedeem = async (reward: Reward) => {
    if (!reward.canAfford) {
      toast({
        title: "คะแนนไม่พอ",
        description: `คุณต้องการอีก ${reward.pointsNeeded} คะแนน`,
        variant: "destructive",
      })
      return
    }

    setRedeemingRewardId(reward.id)
    setSelectedReward(reward)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast({
          title: "กรุณาเข้าสู่ระบบ",
          description: "กรุณาล็อกอินก่อนแลกของรางวัล",
          variant: "destructive",
        })
        return
      }

      const response = await fetch('/api/rewards/request-redemption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          rewardId: reward.id
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setGeneratedCode(data.code)
        setShowCodeDialog(true)
        setCopiedCode(false)
        toast({
          title: "สร้างรหัสสำเร็จ!",
          description: "กรุณาแสดงรหัสนี้ให้พนักงาน",
        })

        // Refresh rewards to update status
        fetchRewards()
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: data.error || "ไม่สามารถสร้างรหัสได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error requesting redemption:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "กรุณาลองใหม่",
        variant: "destructive",
      })
    } finally {
      setRedeemingRewardId(null)
    }
  }

  // Copy code to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // Check for redemption completion (polling)
  useEffect(() => {
    if (!showCodeDialog || !generatedCode) return

    const checkRedemptionStatus = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const response = await fetch(`/api/rewards/check-redemption-status/${generatedCode}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.status === 'COMPLETED') {
            setShowCodeDialog(false)
            setSuccessData({
              rewardName: data.rewardName,
              pointsUsed: data.pointsUsed,
              remainingPoints: data.remainingPoints
            })
            setShowSuccessDialog(true)
          }
        }
      } catch (error) {
        console.error('Error checking redemption status:', error)
      }
    }

    const interval = setInterval(checkRedemptionStatus, 3000) // Check every 3 seconds
    return () => clearInterval(interval)
  }, [showCodeDialog, generatedCode])

  useEffect(() => {
    fetchRewards()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">กำลังโหลดของรางวัล...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>ลองใหม่</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard')}
              >
                <ArrowLeft className="h-4 w-4" />
                กลับ
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">ของรางวัล</h1>
                <p className="text-gray-600 mt-1">แลกคะแนนสะสมเพื่อรับของรางวัลพิเศษ</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/rewards/history')}
              className="flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              ประวัติการแลก
            </Button>
          </div>
        </div>

        {/* User Points Card */}
        {rewardsData && (
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Coins className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-purple-600">คะแนนของคุณ</div>
                    <div className="text-3xl font-bold text-purple-900">
                      {rewardsData.userPoints.toLocaleString()} คะแนน
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-purple-600 mb-1">ของรางวัลที่แลกได้</div>
                  <div className="text-2xl font-semibold text-purple-900">
                    {rewardsData.rewards.filter(r => r.canAfford).length} / {rewardsData.totalRewards}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rewards Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              ของรางวัลที่แลกได้
            </CardTitle>
            <CardDescription>
              เลือกของรางวัลที่คุณสนใจและแลกด้วยคะแนนสะสม
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">กำลังโหลด...</div>
            ) : !rewardsData || rewardsData.rewards.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Gift className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>ยังไม่มีของรางวัล</p>
                <p className="text-sm">กรุณารอสักครู่สำหรับของรางวัลพิเศษ</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rewardsData.rewards.map((reward) => (
                  <Card key={reward.id} className={`relative ${!reward.canAfford ? 'opacity-75' : ''}`}>
                    <CardContent className="p-4">
                      {/* Status Badge */}
                      {!reward.canAfford && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            คะแนนไม่พอ
                          </Badge>
                        </div>
                      )}

                      {/* Reward Image */}
                      {reward.imageUrl ? (
                        <div className="w-full h-40 bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                          <img
                            src={reward.imageUrl}
                            alt={reward.name}
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-40 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                          <Gift className="h-12 w-12 text-gray-400" />
                        </div>
                      )}

                      {/* Reward Info */}
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg">{reward.name}</h3>
                        {reward.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">{reward.description}</p>
                        )}

                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-lg font-bold text-purple-600">
                              {reward.pointsCost.toLocaleString()} คะแนน
                            </span>
                            {!reward.canAfford && (
                              <div className="text-xs text-red-600">
                                ต้องการอีก {reward.pointsNeeded} คะแนน
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Redeem Button */}
                      <Button
                        onClick={() => handleRedeem(reward)}
                        disabled={!reward.canAfford || redeemingRewardId === reward.id}
                        className="w-full mt-4"
                        variant={reward.canAfford ? "default" : "outline"}
                      >
                        {redeemingRewardId === reward.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            กำลังขอรหัส...
                          </>
                        ) : (
                          <>
                            <QrCode className="h-4 w-4 mr-2" />
                            {reward.canAfford ? 'แลกของรางวัล' : 'คะแนนไม่พอ'}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Redemption Code Dialog */}
        <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-purple-600" />
                รหัสการแลกของรางวัล
              </DialogTitle>
              <DialogDescription>
                กรุณาแสดงรหัสนี้ให้พนักงานเพื่อยืนยันการแลกของรางวัล
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {selectedReward && (
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-purple-800">ของรางวัล:</div>
                  <div className="font-semibold text-purple-900">{selectedReward.name}</div>
                  <div className="text-sm text-purple-600">ใช้คะแนน: {selectedReward.pointsCost.toLocaleString()} คะแนน</div>
                </div>
              )}

              <div className="bg-gray-100 p-6 rounded-lg text-center">
                <div className="text-sm font-medium text-gray-600 mb-2">รหัสของคุณ:</div>
                <div className="text-3xl font-bold text-gray-900 tracking-widest font-mono">
                  {generatedCode}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  className="flex-1"
                >
                  {copiedCode ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      คัดลอกแล้ว
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      คัดลอกรหัส
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowCodeDialog(false)}
                  variant="default"
                >
                  ปิด
                </Button>
              </div>

              <div className="text-center text-sm text-gray-500">
                รหัสนี้จะหมดอายุหลังจากแลกของรางวัลเสร็จสิ้น
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <PartyPopper className="h-5 w-5" />
                แลกของรางวัลสำเร็จ!
              </DialogTitle>
              <DialogDescription>
                การแลกของรางวัลของคุณได้รับการยืนยันและดำเนินการเรียบร้อยแล้ว
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <PartyPopper className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <div className="font-semibold text-green-900 mb-1">
                  {successData.rewardName}
                </div>
                <div className="text-sm text-green-700">
                  ขอแสดงความยินดีกับคุณ!
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">คะแนนที่ใช้:</div>
                    <div className="font-semibold text-red-600">
                      -{successData.pointsUsed.toLocaleString()} คะแนน
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">คะแนนคงเหลือ:</div>
                    <div className="font-semibold text-purple-600">
                      {successData.remainingPoints.toLocaleString()} คะแนน
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => {
                  setShowSuccessDialog(false)
                  fetchRewards() // Refresh rewards to update points
                }}
                className="w-full"
              >
                ตกลง
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}