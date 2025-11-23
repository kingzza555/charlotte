'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'components/ui/card'
import { Button } from 'components/ui/button'
import { Badge } from 'components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from 'components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Gift, Coins, Lock, Loader2, QrCode, Copy, CheckCircle, PartyPopper, History, Sparkles, AlertCircle } from 'lucide-react'
import confetti from 'canvas-confetti' // ✅ ใช้ Library พลุของจริง

// --- Interfaces ---
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

// --- Helper Component: Animated Counter ---
const AnimatedCounter = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(0)
  const startTimeRef = useRef<number | null>(null)
  const startValueRef = useRef(0)

  useEffect(() => {
    if (displayValue === value) {
      startValueRef.current = value
      return
    }

    const start = startValueRef.current
    const end = value
    const duration = 1000

    startTimeRef.current = null
    let animationFrameId: number

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const progress = timestamp - startTimeRef.current
      const percentage = Math.min(progress / duration, 1)
      const ease = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage)
      const current = Math.floor(start + (end - start) * ease)
      setDisplayValue(current)
      if (percentage < 1) {
        animationFrameId = requestAnimationFrame(animate)
      } else {
        startValueRef.current = end
      }
    }
    animationFrameId = requestAnimationFrame(animate)
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [value])

  return <>{displayValue.toLocaleString()}</>
}

export default function RewardsPage() {
  const [rewardsData, setRewardsData] = useState<RewardsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  // Redemption States
  const [showCodeDialog, setShowCodeDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [redeemingRewardId, setRedeemingRewardId] = useState<string | null>(null)

  const [successData, setSuccessData] = useState({
    rewardName: '',
    pointsUsed: 0,
    remainingPoints: 0
  })

  // Animation trigger
  const [triggerPointsAnim, setTriggerPointsAnim] = useState(false)
  const prevPointsRef = useRef<number | null>(null)

  const router = useRouter()
  const { toast } = useToast()

  // 1. Fetch Rewards Data
  const fetchRewards = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setError('กรุณาเข้าสู่ระบบเพื่อดูของรางวัล')
      setTimeout(() => router.push('/login'), 2000)
      setLoading(false)
      return
    }

    try {
      const userResponse = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (userResponse.data.id) {
        setUserId(userResponse.data.id)
        const response = await axios.get(`/api/rewards?userId=${userResponse.data.id}`)
        setRewardsData(response.data)
      } else {
        throw new Error('User ID not found')
      }
    } catch (error: any) {
      console.error('Error fetching rewards:', error)
      if (error.response?.status === 401) {
        setError('เซสชั่นหมดอายุ กรุณาเข้าสู่ระบบใหม่')
        localStorage.removeItem('token')
        router.push('/login')
      } else {
        setError('ไม่สามารถโหลดข้อมูลของรางวัลได้ กรุณาลองใหม่อีกครั้ง')
      }
    } finally {
      setLoading(false)
    }
  }

  // 2. Handle Redemption
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
    setSelectedReward(reward) // บันทึกของรางวัลที่เลือกไว้ใช้ตอนโชว์รูป

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await axios.post('/api/rewards/request-redemption',
        { rewardId: reward.id },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data) {
        setGeneratedCode(response.data.code)
        setShowCodeDialog(true)
        setCopiedCode(false)
        toast({
          title: "สร้างรหัสสำเร็จ!",
          description: "กรุณาแสดงรหัสนี้ให้พนักงาน",
        })
        fetchRewards()
      }
    } catch (error: any) {
      console.error('Redemption error:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.response?.data?.error || "ไม่สามารถสร้างรหัสได้",
        variant: "destructive",
      })
    } finally {
      setRedeemingRewardId(null)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // 3. Polling for Redemption Status
  useEffect(() => {
    if (!showCodeDialog || !generatedCode) return

    const checkStatus = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const response = await axios.get(`/api/rewards/check-redemption-status/${generatedCode}`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (response.data.status === 'COMPLETED') {
          setShowCodeDialog(false)
          setSuccessData({
            rewardName: response.data.rewardName,
            pointsUsed: response.data.pointsUsed,
            remainingPoints: response.data.remainingPoints
          })
          setShowSuccessDialog(true)

          // 🎉 จุดระเบิดพลุตรงนี้!
          triggerConfetti()
        }
      } catch (error) {
        console.error('Check status error:', error)
      }
    }

    const interval = setInterval(checkStatus, 3000)
    return () => clearInterval(interval)
  }, [showCodeDialog, generatedCode])

  // ฟังก์ชันยิงพลุสวยๆ
  const triggerConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 }
    };

    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }

  useEffect(() => { fetchRewards() }, [])

  useEffect(() => {
    if (rewardsData?.userPoints !== undefined) {
      if (prevPointsRef.current !== null && prevPointsRef.current !== rewardsData.userPoints) {
        setTriggerPointsAnim(true)
        const timer = setTimeout(() => setTriggerPointsAnim(false), 600)
        return () => clearTimeout(timer)
      }
      prevPointsRef.current = rewardsData.userPoints
    }
  }, [rewardsData?.userPoints])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="absolute inset-0 bg-stone-200 rounded-full animate-ping opacity-25"></div>
          <div className="bg-white p-4 rounded-full shadow-lg relative z-10">
            <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          </div>
        </div>
        <p className="text-stone-500 font-serif tracking-wide animate-pulse">กำลังโหลดของรางวัล...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex flex-col items-center justify-center p-6">
        <Card className="max-w-xs w-full border-0 shadow-xl shadow-red-500/5 text-center p-6 animate-scale-in">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-stone-900 mb-2">เกิดข้อผิดพลาด</h3>
          <p className="text-stone-500 text-sm mb-6">{error}</p>
          <Button onClick={() => window.location.reload()} className="w-full bg-stone-900">ลองใหม่</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-stone-900 pb-12 font-sans selection:bg-amber-100 selection:text-amber-900">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#FAFAF9]/80 backdrop-blur-md border-b border-stone-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/dashboard')}
              className="h-10 w-10 -ml-2 rounded-full hover:bg-white hover:shadow-sm transition-all"
            >
              <ArrowLeft className="h-5 w-5 text-stone-600" />
            </Button>
            <h1 className="text-xl font-serif font-bold text-stone-900">ของรางวัล</h1>
          </div>

          <Button
            variant="ghost"
            onClick={() => router.push('/rewards/history')}
            className="text-xs font-medium text-stone-500 hover:text-stone-900 hover:bg-white hover:shadow-sm rounded-full h-9 px-3 transition-all"
          >
            <History className="h-3.5 w-3.5 mr-1.5" />
            ประวัติ
          </Button>
        </header>

        <main className="px-6 space-y-8">
          {/* User Points Card */}
          {rewardsData && (
            <div className="relative overflow-hidden rounded-[28px] bg-[#1C1917] p-8 shadow-2xl shadow-stone-900/20 animate-fade-in-up">
              <div className="absolute top-0 right-0 p-10 opacity-[0.05]">
                <Coins className="h-40 w-40 text-white rotate-12" />
              </div>
              <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-amber-900/20 blur-3xl" />

              <div className="relative z-10 flex flex-col items-center text-center space-y-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse-slow" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">คะแนนคงเหลือ</span>
                </div>

                <div className="flex items-baseline justify-center gap-1.5">
                  <span className={`text-5xl font-serif font-medium tracking-tight transition-all duration-300 ${triggerPointsAnim ? 'scale-110 text-amber-100' : 'scale-100 text-[#FAFAF9]'}`}>
                    <AnimatedCounter value={rewardsData.userPoints} />
                  </span>
                  <span className={`text-sm font-medium transition-colors duration-500 ${triggerPointsAnim ? 'text-amber-400 animate-pulse-once' : 'text-stone-400'}`}>
                    แต้ม
                  </span>
                </div>

                <div className="mt-6 w-full bg-white/5 rounded-2xl p-3 backdrop-blur-sm border border-white/5 flex justify-between items-center">
                  <span className="text-xs text-stone-400 ml-1">แลกได้ตอนนี้</span>
                  <Badge variant="secondary" className="bg-amber-500 text-white border-0">
                    {rewardsData.rewards.filter(r => r.canAfford).length} / {rewardsData.totalRewards} รายการ
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Rewards Grid */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1 animate-fade-in-up [animation-delay:100ms]">
              <Gift className="h-4 w-4 text-amber-600" />
              <h2 className="font-serif text-lg font-semibold text-stone-900">รายการของรางวัล</h2>
            </div>

            {loading ? (
              <div className="text-center py-12 text-stone-400">กำลังโหลด...</div>
            ) : !rewardsData || rewardsData.rewards.length === 0 ? (
              <div className="text-center py-16 px-4 border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/50 animate-scale-in">
                <div className="bg-white p-4 rounded-full inline-block shadow-sm mb-4">
                  <Gift className="h-8 w-8 text-stone-300" />
                </div>
                <p className="text-stone-600 font-medium">ยังไม่มีของรางวัล</p>
                <p className="text-xs text-stone-400 mt-1">โปรดกลับมาตรวจสอบใหม่ภายหลัง</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {rewardsData.rewards.map((reward, index) => (
                  <Card
                    key={reward.id}
                    className={`group overflow-hidden border-0 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] hover:shadow-xl hover:shadow-stone-900/5 transition-all duration-300 rounded-2xl bg-white animate-fade-in-up opacity-0 fill-mode-forwards ${!reward.canAfford ? 'opacity-70 grayscale-[0.3]' : ''}`}
                    style={{ animationDelay: `${(index + 2) * 100}ms` }}
                  >
                    <CardContent className="p-0">
                      <div className="flex flex-row h-full">
                        {/* Image Section */}
                        <div className="relative w-32 sm:w-40 bg-stone-100 shrink-0">
                          {reward.imageUrl ? (
                            <img
                              src={reward.imageUrl}
                              alt={reward.name}
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-stone-200">
                              <Gift className="h-8 w-8 text-stone-400" />
                            </div>
                          )}
                          {!reward.canAfford && (
                            <div className="absolute inset-0 bg-stone-900/10 backdrop-blur-[1px] flex items-center justify-center">
                              <div className="bg-black/60 p-1.5 rounded-full text-white backdrop-blur-md">
                                <Lock className="h-4 w-4" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Content Section */}
                        <div className="p-4 flex flex-col justify-between flex-grow min-w-0">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="font-bold text-stone-900 leading-tight text-base line-clamp-1">{reward.name}</h3>
                            </div>
                            {reward.description && (
                              <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">{reward.description}</p>
                            )}
                          </div>

                          <div className="mt-4 pt-3 border-t border-stone-100 flex items-end justify-between">
                            <div>
                              <div className="text-sm font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md inline-block">
                                {reward.pointsCost.toLocaleString()} แต้ม
                              </div>
                              {!reward.canAfford && (
                                <div className="text-[10px] text-red-500 font-medium mt-1">
                                  ขาดอีก {reward.pointsNeeded}
                                </div>
                              )}
                            </div>

                            <Button
                              onClick={() => handleRedeem(reward)}
                              disabled={!reward.canAfford || redeemingRewardId === reward.id}
                              size="sm"
                              className={`rounded-lg px-4 h-8 text-xs font-medium transition-all ${reward.canAfford
                                ? 'bg-stone-900 hover:bg-stone-800 text-white shadow-md hover:shadow-lg'
                                : 'bg-stone-100 text-stone-400 hover:bg-stone-200'
                                }`}
                            >
                              {redeemingRewardId === reward.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : reward.canAfford ? (
                                'แลกเลย'
                              ) : (
                                'ล็อก'
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Redemption Code Dialog */}
        <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
          <DialogContent className="sm:max-w-sm bg-[#FAFAF9] p-0 overflow-hidden rounded-[32px] border-0">
            <div className="bg-stone-900 p-6 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
              <DialogTitle className="text-white flex flex-col items-center gap-3 relative z-10">
                <div className="h-12 w-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md animate-scale-in">
                  <QrCode className="h-6 w-6 text-amber-400" />
                </div>
                <span className="font-serif text-xl">รหัสแลกของรางวัล</span>
              </DialogTitle>
              <DialogDescription className="text-stone-400 mt-2 relative z-10">
                แสดงรหัสนี้ให้พนักงานเพื่อรับสิทธิ์
              </DialogDescription>
            </div>

            <div className="p-6 space-y-6">
              {selectedReward && (
                <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-stone-100 animate-fade-in-up">
                  <div className="h-12 w-12 bg-stone-100 rounded-lg overflow-hidden shrink-0">
                    {selectedReward.imageUrl ? (
                      <img src={selectedReward.imageUrl} className="h-full w-full object-cover" />
                    ) : (
                      <Gift className="h-full w-full p-3 text-stone-300" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-stone-900">{selectedReward.name}</div>
                    <div className="text-xs text-amber-600 font-bold">{selectedReward.pointsCost.toLocaleString()} แต้ม</div>
                  </div>
                </div>
              )}

              <div className="bg-white border-2 border-dashed border-stone-300 p-6 rounded-2xl text-center relative group cursor-pointer transition-colors hover:border-stone-400 animate-fade-in-up [animation-delay:100ms]" onClick={copyToClipboard}>
                <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-2">รหัสของคุณ</p>
                <div className="text-4xl font-mono font-bold text-stone-900 tracking-wider">
                  {generatedCode}
                </div>
                {copiedCode && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-[14px] animate-in fade-in zoom-in">
                    <div className="flex items-center gap-2 text-green-600 font-bold">
                      <CheckCircle className="h-5 w-5" /> คัดลอกแล้ว!
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 animate-fade-in-up [animation-delay:200ms]">
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  className="flex-1 h-12 rounded-xl border-stone-200 hover:bg-stone-50 text-stone-600"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  คัดลอก
                </Button>
                <Button
                  onClick={() => setShowCodeDialog(false)}
                  className="flex-1 h-12 rounded-xl bg-stone-900 hover:bg-stone-800 text-white shadow-lg shadow-stone-900/20"
                >
                  ปิดหน้าต่าง
                </Button>
              </div>

              <p className="text-center text-[10px] text-stone-400">
                รหัสจะหมดอายุอัตโนมัติหลังการใช้งาน
              </p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Success Dialog (with Confetti & Product Image) */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="sm:max-w-sm text-center p-0 overflow-hidden rounded-[32px] border-0 bg-white">
            {/* 🎆 Background Animation & Image Header */}
            <div className="relative pt-12 pb-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-50 via-stone-50 to-white overflow-hidden">
              {/* Confetti Effect Layer */}
              <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-0 left-1/4 w-2 h-2 bg-red-400 rounded-full animate-[confetti_2s_ease-in-out_infinite]" style={{ animationDelay: '0.1s' }}></div>
                <div className="absolute top-0 left-3/4 w-2 h-2 bg-blue-400 rounded-full animate-[confetti_2.5s_ease-in-out_infinite]" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute top-0 left-1/2 w-2 h-2 bg-yellow-400 rounded-full animate-[confetti_1.5s_ease-in-out_infinite]" style={{ animationDelay: '0.3s' }}></div>
              </div>

              {/* Product Image Container (Floating) */}
              <div className="relative h-48 w-48 mx-auto animate-float z-10">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-amber-400 rounded-full blur-3xl opacity-20 animate-pulse-slow"></div>

                {/* Image Frame */}
                <div className="relative h-full w-full rounded-2xl overflow-hidden shadow-2xl shadow-stone-900/10 border-4 border-white transform rotate-3 transition-transform hover:rotate-0 duration-500">
                  {selectedReward?.imageUrl ? (
                    <img
                      src={selectedReward.imageUrl}
                      alt={successData.rewardName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-stone-100 flex items-center justify-center">
                      <Gift className="h-20 w-20 text-amber-300" />
                    </div>
                  )}
                </div>

                {/* Success Checkmark Badge */}
                <div className="absolute -bottom-3 -right-3 bg-green-500 text-white p-3 rounded-full border-4 border-white shadow-lg animate-scale-in [animation-delay:400ms]">
                  <CheckCircle className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-8 pt-2 space-y-6 relative z-10">
              <div className="space-y-2 animate-fade-in-up">
                <DialogTitle className="text-3xl font-serif text-stone-900 tracking-tight">แลกสำเร็จ!</DialogTitle>
                <DialogDescription className="text-stone-500 font-medium text-base">
                  คุณได้รับสิทธิ์ <br />
                  <span className="font-bold text-stone-900 text-xl bg-amber-50 px-2 rounded-md mt-1 inline-block">{successData.rewardName}</span>
                </DialogDescription>
              </div>

              {/* Stats Summary */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 animate-fade-in-up [animation-delay:100ms] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center border-r border-stone-200 pr-2">
                    <div className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mb-1">ใช้คะแนน</div>
                    <div className="font-bold text-red-500 text-lg">
                      -{successData.pointsUsed.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-center pl-2">
                    <div className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mb-1">คงเหลือ</div>
                    <div className="font-bold text-stone-900 text-lg">
                      {successData.remainingPoints.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => {
                  setShowSuccessDialog(false)
                  fetchRewards()
                }}
                className="w-full h-12 rounded-xl bg-stone-900 hover:bg-stone-800 text-white shadow-xl shadow-stone-900/20 animate-fade-in-up [animation-delay:200ms] text-sm font-semibold tracking-wide transition-all hover:scale-[1.02]"
              >
                รับทราบ
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}