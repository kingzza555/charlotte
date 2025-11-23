'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from 'components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'components/ui/card'
import { Skeleton } from 'components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { LogOut, TrendingUp, Wallet, Calendar } from 'lucide-react'

interface UserSummary {
  currentPoints: number
  totalSpending: number
  spendingThisMonth: number
}

export default function Dashboard() {
  const [userSummary, setUserSummary] = useState<UserSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userPhone, setUserPhone] = useState<string>('')
  const router = useRouter()
  const { toast } = useToast()

  const fetchUserSummary = async () => {
    const token = localStorage.getItem('token')

    if (!token) {
      router.push('/login')
      return
    }

    try {
      const response = await fetch('/api/user/summary', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.status === 401) {
        toast({
          title: "Session Expired",
          description: "Please login again",
          variant: "destructive",
        })
        localStorage.removeItem('token')
        router.push('/login')
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch user data')
      }

      const data = await response.json()
      setUserSummary(data)

      // Extract phone number from JWT token for display
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]))
        setUserPhone(tokenPayload.phoneNumber || 'Customer')
      } catch (e) {
        setUserPhone('Customer')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUserSummary()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    })
    router.push('/login')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-24" />
          </div>

          {/* Main Points Card Skeleton */}
          <Card className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-xl">
            <CardHeader>
              <Skeleton className="h-6 w-32 bg-white/20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-48 bg-white/20" />
            </CardContent>
          </Card>

          {/* Spending Summary Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-36" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Hello, {userPhone}
            </h1>
            <p className="text-gray-600">Welcome back to Charlotte Loyalty</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Main Points Card */}
        <Card className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wallet className="h-6 w-6" />
              <CardTitle className="text-xl">Your Points</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold">
              {userSummary?.currentPoints.toLocaleString() || '0'}
            </div>
            <CardDescription className="text-amber-100 mt-2">
              Available for redemption
            </CardDescription>
          </CardContent>
        </Card>

        {/* Spending Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* This Month Card */}
          <Card className="border-2 border-amber-200 hover:border-amber-300 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-600" />
                <CardTitle className="text-lg">This Month</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">
                {formatCurrency(userSummary?.spendingThisMonth || 0)}
              </div>
              <CardDescription className="text-gray-600 mt-1">
                Spending this month
              </CardDescription>
            </CardContent>
          </Card>

          {/* Total Lifetime Card */}
          <Card className="border-2 border-amber-200 hover:border-amber-300 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-amber-600" />
                <CardTitle className="text-lg">Total Lifetime</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">
                {formatCurrency(userSummary?.totalSpending || 0)}
              </div>
              <CardDescription className="text-gray-600 mt-1">
                All-time spending
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info Card */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-amber-800 font-medium">
                🎉 Thank you for being a valued Charlotte customer!
              </p>
              <p className="text-amber-700 text-sm">
                Continue earning points with every purchase
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}