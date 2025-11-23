'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'components/ui/card'
import { Button } from 'components/ui/button'
import { Input } from 'components/ui/input'
import { Label } from 'components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Shield, Lock, User, Eye, EyeOff, Coffee, AlertCircle } from 'lucide-react'

export default function AdminLoginPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await axios.post('/api/admin/auth/login', formData)

      if (response.data.success) {
        // Store admin token
        localStorage.setItem('adminToken', response.data.token)
        localStorage.setItem('adminUser', JSON.stringify(response.data.admin))

        toast({
          title: "เข้าสู่ระบบสำเร็จ",
          description: `ยินดีต้อนรับคุณ ${response.data.admin.name || response.data.admin.username}`,
        })

        // Redirect to admin dashboard
        router.push('/admin')
      } else {
        setError(response.data.error || 'เข้าสู่ระบบไม่สำเร็จ')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      const errorMessage = error.response?.data?.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
      setError(errorMessage)

      toast({
        title: "เข้าสู่ระบบล้มเหลว",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent animate-pulse" />
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mb-4 shadow-2xl">
            <Coffee className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Charlotte Admin</h1>
          <p className="text-purple-200 text-sm">ระบบจัดการร้าน Charlotte 58Cafe</p>
        </div>

        {/* Login Card */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center mb-3">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">เข้าสู่ระบบผู้ดูแล</CardTitle>
            <CardDescription className="text-purple-200">
              กรุณกรอกข้อมูลสำหรับเข้าสู่ระบบผู้ดูแลระบบ
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-purple-200 text-sm font-medium">
                  ชื่อผู้ใช้
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-400" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="กรอกชื่อผู้ใช้"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder-purple-300 focus:border-purple-400 focus:ring-purple-400/20"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-purple-200 text-sm font-medium">
                  รหัสผ่าน
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="กรอกรหัสผ่าน"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder-purple-300 focus:border-purple-400 focus:ring-purple-400/20"
                    required
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-300 hover:bg-white/10"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3 shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    เข้าสู่ระบบ
                  </>
                )}
              </Button>
            </form>

            {/* Footer Info */}
            <div className="text-center pt-4 border-t border-white/10">
              <p className="text-purple-300 text-xs">
                หน้านี้สำหรับผู้ดูแลระบบเท่านั้น • การใช้งานโดยไม่ได้รับอนุญาตถือเป็นความผิด
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Note */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
            <Shield className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 text-sm">การเข้าสู่ระบบปลอดภัย</span>
          </div>
        </div>
      </div>
    </div>
  )
}