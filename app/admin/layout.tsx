'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface AdminUser {
  id: string
  username: string
  name?: string
  role: string
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const adminToken = localStorage.getItem('adminToken')
      const adminUser = localStorage.getItem('adminUser')

      // Skip auth check for login page
      if (window.location.pathname === '/admin/login') {
        setIsLoading(false)
        return
      }

      if (!adminToken || !adminUser) {
        router.push('/admin/login')
        return
      }

      try {
        // Validate admin user data
        const user = JSON.parse(adminUser) as AdminUser
        if (!user.id || !user.username) {
          throw new Error('Invalid admin data')
        }

        setIsLoading(false)
      } catch (error) {
        console.error('Admin auth error:', error)
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminUser')
        router.push('/admin/login')
      }
    }

    checkAuth()
  }, [router])

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-purple-200 text-lg">กำลังตรวจสอบการเข้าสู่ระบบ...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}