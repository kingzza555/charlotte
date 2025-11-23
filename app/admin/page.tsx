'use client'

// Admin Dashboard with Customer Management - Version 2.0
// Including Customers tab with search functionality

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'components/ui/card'
import { Input } from 'components/ui/input'
import { Button } from 'components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'components/ui/table'
import { Skeleton } from 'components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Search, Users, Settings, ShoppingCart, TrendingUp, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface UserWithSpending {
  id: string
  phoneNumber: string
  currentPoints: number
  totalSpending: number
  createdAt: string
}

interface AdminUser {
  id: string
  username: string
  name?: string
  role: string
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserWithSpending[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('customers')
  const [pointsRate, setPointsRate] = useState<number>(1)
  const [newPointsRate, setNewPointsRate] = useState<string>('')
  const [rateLoading, setRateLoading] = useState(false)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Load admin user on mount
  useEffect(() => {
    const adminUserStr = localStorage.getItem('adminUser')
    if (adminUserStr) {
      try {
        setAdminUser(JSON.parse(adminUserStr))
      } catch (error) {
        console.error('Error parsing admin user:', error)
      }
    }
  }, [])

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    toast({
      title: "ออกจากระบบ",
      description: "ออกจากระบบผู้ดูแลเรียบร้อยแล้ว",
    })
    router.push('/admin/login')
  }

  // Fetch points rate from API
  const fetchPointsRate = async () => {
    try {
      const response = await fetch('/api/admin/points-rate')
      if (response.ok) {
        const data = await response.json()
        setPointsRate(data.rate)
        setNewPointsRate(data.rate.toString())
      }
    } catch (error) {
      console.error('Error fetching points rate:', error)
    }
  }

  // Update points rate
  const updatePointsRate = async () => {
    const rate = parseInt(newPointsRate)
    if (isNaN(rate) || rate < 0) {
      toast({
        title: "ข้อผิดพลาด",
        description: "กรุณากรอกอัตราส่วนคะแนนให้ถูกต้อง",
        variant: "destructive",
      })
      return
    }

    setRateLoading(true)
    try {
      const response = await fetch('/api/admin/points-rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rate }),
      })

      if (response.ok) {
        const data = await response.json()
        setPointsRate(rate)
        toast({
          title: "สำเร็จ",
          description: data.message,
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "ข้อผิดพลาด",
          description: errorData.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating points rate:', error)
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตอัตราส่วนคะแนนได้",
        variant: "destructive",
      })
    } finally {
      setRateLoading(false)
    }
  }

  // Fetch users from API
  const fetchUsers = async (query: string = '') => {
    setLoading(true)
    try {
      const url = query
        ? `/api/admin/users?search=${encodeURIComponent(query)}`
        : '/api/admin/users'

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      setUsers(data)
      console.log('✅ API Success - Found', data.length, 'users')
    } catch (error) {
      console.error('❌ Error fetching users:', error)
      toast({
        title: "API Error",
        description: "Using mock data instead",
        variant: "destructive",
      })
      // Use mock data as fallback with realistic search functionality
      const allMockData: UserWithSpending[] = [
        {
          id: '1',
          phoneNumber: '0812345678',
          currentPoints: 150,
          totalSpending: 1000.75,
          createdAt: '2025-11-21T14:13:23.869Z'
        },
        {
          id: '2',
          phoneNumber: '0987654321',
          currentPoints: 75,
          totalSpending: 900.75,
          createdAt: '2025-11-15T10:30:00.000Z'
        },
        {
          id: '3',
          phoneNumber: '0912388334',
          currentPoints: 220,
          totalSpending: 2125.50,
          createdAt: '2025-11-10T08:45:00.000Z'
        },
        {
          id: '4',
          phoneNumber: '0821122334',
          currentPoints: 95,
          totalSpending: 1500.00,
          createdAt: '2025-11-05T14:20:00.000Z'
        },
        {
          id: '5',
          phoneNumber: '0899988776',
          currentPoints: 310,
          totalSpending: 3100.25,
          createdAt: '2025-10-28T11:15:00.000Z'
        }
      ]

      // Apply search filter to mock data
      const mockData = query
        ? allMockData.filter(user =>
          user.phoneNumber.includes(query)
        )
        : allMockData

      console.log('📊 Mock data search results:', {
        query: query || 'none',
        totalCustomers: allMockData.length,
        filteredCustomers: mockData.length,
        customers: mockData.map(u => u.phoneNumber)
      })
      setUsers(mockData)

      // Show search result notification
      if (query && mockData.length > 0) {
        toast({
          title: "Search Results",
          description: `Found ${mockData.length} customer(s) matching "${query}"`,
        })
      } else if (query && mockData.length === 0) {
        toast({
          title: "No Results",
          description: `No customers found matching "${query}"`,
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  // Fetch data when component mounts or search query changes
  useEffect(() => {
    if (activeTab === 'customers') {
      const timeoutId = setTimeout(() => {
        console.log('🔍 Searching for:', searchQuery || 'all users')
        fetchUsers(searchQuery)
      }, 500) // 500ms debounce

      return () => clearTimeout(timeoutId)
    }
  }, [activeTab, searchQuery])

  // Fetch points rate when component mounts or settings tab is active
  useEffect(() => {
    if (activeTab === 'settings') {
      fetchPointsRate()
    }
  }, [activeTab])

  // Format currency to THB
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  console.log('🎯 Admin Dashboard Render - Active Tab:', activeTab, 'Users Count:', users.length)

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-2">Manage your Charlotte loyalty program</p>
              {adminUser && (
                <p className="text-sm text-purple-600 mt-1">
                  ยินดีต้อนรับ {adminUser.name || adminUser.username} ({adminUser.role})
                </p>
              )}
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              ออกจากระบบ
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pos" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              POS
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* POS Tab */}
          <TabsContent value="pos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Point of Sale
                </CardTitle>
                <CardDescription>
                  Record transactions and award points to customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  {/* Navigation Buttons */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">การจัดการคะแนน</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        className="flex items-center justify-start gap-2 h-16"
                        onClick={() => window.location.href = '/admin/points'}
                      >
                        <div className="text-left">
                          <div className="font-medium">เพิ่มคะแนนให้ลูกค้า</div>
                          <div className="text-sm text-gray-500">บันทึกการซื้อและให้คะแนน</div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        className="flex items-center justify-start gap-2 h-16"
                        onClick={() => window.location.href = '/admin/rewards'}
                      >
                        <div className="text-left">
                          <div className="font-medium">จัดการของรางวัล</div>
                          <div className="text-sm text-gray-500">ตั้งค่าของแลกคะแนน</div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        className="flex items-center justify-start gap-2 h-16"
                        onClick={() => window.location.href = '/admin/redemptions'}
                      >
                        <div className="text-left">
                          <div className="font-medium">ตรวจสอบการแลก</div>
                          <div className="text-sm text-gray-500">ยืนยันและดำเนินการ</div>
                        </div>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Customer Management
                </CardTitle>
                <CardDescription>
                  View and search customer data and spending information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search Bar */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by phone number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    onClick={() => fetchUsers(searchQuery)}
                    disabled={loading}
                  >
                    Search
                  </Button>
                </div>

                {/* Customer Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-600">
                      <Users className="h-5 w-5" />
                      <span className="font-medium">Total Customers</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                      {loading ? '...' : users.length}
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-green-600">
                      <TrendingUp className="h-5 w-5" />
                      <span className="font-medium">Total Spending</span>
                    </div>
                    <div className="text-2xl font-bold text-green-900">
                      {loading ? '...' : formatCurrency(users.reduce((sum, user) => sum + user.totalSpending, 0))}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-purple-600">
                      <Users className="h-5 w-5" />
                      <span className="font-medium">Total Points</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-900">
                      {loading ? '...' : users.reduce((sum, user) => sum + user.currentPoints, 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Data Table */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Phone Number</TableHead>
                        <TableHead className="font-semibold">Current Points</TableHead>
                        <TableHead className="font-semibold">Total Spending</TableHead>
                        <TableHead className="font-semibold">Join Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        // Loading skeleton
                        Array.from({ length: 5 }).map((_, index) => (
                          <TableRow key={index}>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          </TableRow>
                        ))
                      ) : users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                            No customers found
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user) => (
                          <TableRow key={user.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{user.phoneNumber}</TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {user.currentPoints.toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell className="font-medium text-green-600">
                              {formatCurrency(user.totalSpending)}
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {formatDate(user.createdAt)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Empty state when no search results */}
                {!loading && users.length === 0 && searchQuery && (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No customers found for "{searchQuery}"</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setSearchQuery('')}
                    >
                      Clear Search
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  การตั้งค่าระบบ
                </CardTitle>
                <CardDescription>
                  จัดการการตั้งค่าและอัตราส่วนการสะสมแต้ม
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Points Rate Setting */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">อัตราส่วนการสะสมแต้ม</h3>
                    <p className="text-gray-600 mb-4">
                      กำหนดอัตราส่วนที่ลูกค้าจะได้รับคะแนนเมื่อซื้อสินค้า
                    </p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-blue-900">
                          {pointsRate} คะแนน
                        </div>
                        <div className="text-blue-600">
                          ต่อ 1 บาท
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-blue-600 mb-1">
                          ตัวอย่าง:
                        </div>
                        <div className="text-lg font-semibold text-blue-900">
                          ซื้อ 100 บาท = {pointsRate * 100} คะแนน
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      ตั้งค่าอัตราส่วนคะแนน (คะแนนต่อ 1 บาท)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="1000"
                        value={newPointsRate}
                        onChange={(e) => setNewPointsRate(e.target.value)}
                        placeholder="กรอกจำนวนคะแนนต่อ 1 บาท"
                        className="flex-1"
                      />
                      <Button
                        onClick={updatePointsRate}
                        disabled={rateLoading || !newPointsRate}
                      >
                        {rateLoading ? 'กำลังบันทึก...' : 'บันทึก'}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      อัตราส่วนที่แนะนำ: 1-5 คะแนนต่อ 1 บาท (สูงสุด 1000 คะแนนต่อ 1 บาท)
                    </p>
                  </div>
                </div>

                Navigation Buttons
                {/* <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">การจัดการคะแนน</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="flex items-center justify-start gap-2 h-16"
                      onClick={() => window.location.href = '/admin/points'}
                    >
                      <div className="text-left">
                        <div className="font-medium">เพิ่มคะแนนให้ลูกค้า</div>
                        <div className="text-sm text-gray-500">บันทึกการซื้อและให้คะแนน</div>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="flex items-center justify-start gap-2 h-16"
                      onClick={() => window.location.href = '/admin/rewards'}
                    >
                      <div className="text-left">
                        <div className="font-medium">จัดการของรางวัล</div>
                        <div className="text-sm text-gray-500">ตั้งค่าของแลกคะแนน</div>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="flex items-center justify-start gap-2 h-16"
                      onClick={() => window.location.href = '/admin/redemptions'}
                    >
                      <div className="text-left">
                        <div className="font-medium">ตรวจสอบการแลก</div>
                        <div className="text-sm text-gray-500">ยืนยันและดำเนินการ</div>
                      </div>
                    </Button>
                  </div>
                </div> */}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}