'use client'

// Admin Rewards Management - Add, Edit, Delete Rewards

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Plus, Edit2, Trash2, Save, X, Image as ImageIcon } from 'lucide-react'

interface Reward {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  pointsCost: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function RewardsManagement() {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingReward, setEditingReward] = useState<string | null>(null)
  const { toast } = useToast()

  // Form state for adding/editing rewards
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    pointsCost: '',
    isActive: true
  })

  // Fetch rewards from API
  const fetchRewards = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/rewards')
      if (response.ok) {
        const data = await response.json()
        setRewards(data)
      } else {
        toast({
          title: "ข้อผิดพลาด",
          description: "ไม่สามารถดึงข้อมูลของรางวัลได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching rewards:', error)
      toast({
        title: "ข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการดึงข้อมูลของรางวัล",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      imageUrl: '',
      pointsCost: '',
      isActive: true
    })
    setShowAddForm(false)
    setEditingReward(null)
  }

  // Save reward (add or update)
  const saveReward = async () => {
    if (!formData.name || !formData.pointsCost) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบ",
        description: "ชื่อและคะแนนที่ต้องการเป็นข้อมูลจำเป็น",
        variant: "destructive",
      })
      return
    }

    const pointsCost = parseInt(formData.pointsCost)
    if (isNaN(pointsCost) || pointsCost < 0) {
      toast({
        title: "คะแนนไม่ถูกต้อง",
        description: "กรุณากรอกคะแนนเป็นตัวเลขที่มากกว่า 0",
        variant: "destructive",
      })
      return
    }

    try {
      const url = editingReward ? `/api/admin/rewards/${editingReward}` : '/api/admin/rewards'
      const method = editingReward ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          imageUrl: formData.imageUrl || null,
          pointsCost,
          isActive: formData.isActive,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: editingReward ? "อัปเดตสำเร็จ" : "เพิ่มสำเร็จ",
          description: data.message,
        })
        resetForm()
        fetchRewards() // Refresh list
      } else {
        const errorData = await response.json()
        toast({
          title: "ข้อผิดพลาด",
          description: errorData.error || "ไม่สามารถบันทึกข้อมูลได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error saving reward:', error)
      toast({
        title: "ข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
        variant: "destructive",
      })
    }
  }

  // Delete reward
  const deleteReward = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบของรางวัลนี้?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/rewards/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: "ลบสำเร็จ",
          description: "ลบของรางวัลเรียบร้อยแล้ว",
        })
        fetchRewards() // Refresh list
      } else {
        const errorData = await response.json()
        toast({
          title: "ข้อผิดพลาด",
          description: errorData.error || "ไม่สามารถลบข้อมูลได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting reward:', error)
      toast({
        title: "ข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการลบข้อมูล",
        variant: "destructive",
      })
    }
  }

  // Start editing reward
  const startEdit = (reward: Reward) => {
    setFormData({
      name: reward.name,
      description: reward.description || '',
      imageUrl: reward.imageUrl || '',
      pointsCost: reward.pointsCost.toString(),
      isActive: reward.isActive,
    })
    setEditingReward(reward.id)
    setShowAddForm(true)
  }

  // Toggle reward active status
  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/rewards/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      })

      if (response.ok) {
        toast({
          title: "อัปเดตสำเร็จ",
          description: `ของรางวัลถูก${!currentStatus ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}แล้ว`,
        })
        fetchRewards() // Refresh list
      } else {
        const errorData = await response.json()
        toast({
          title: "ข้อผิดพลาด",
          description: errorData.error || "ไม่สามารถอัปเดตสถานะได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error toggling reward status:', error)
      toast({
        title: "ข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการอัปเดตสถานะ",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchRewards()
  }, [])

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
                onClick={() => window.location.href = '/admin'}
              >
                <ArrowLeft className="h-4 w-4" />
                กลับ
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">จัดการของรางวัล</h1>
                <p className="text-gray-600 mt-1">เพิ่ม แก้ไข และจัดการของที่แลกได้ด้วยคะแนน</p>
              </div>
            </div>
            <Button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              เพิ่มของรางวัล
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">ของรางวัลทั้งหมด</p>
                  <p className="text-2xl font-bold">{rewards.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <ImageIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">กำลังใช้งาน</p>
                  <p className="text-2xl font-bold text-green-600">
                    {rewards.filter(r => r.isActive).length}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <Plus className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">ปิดใช้งาน</p>
                  <p className="text-2xl font-bold text-red-600">
                    {rewards.filter(r => !r.isActive).length}
                  </p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <X className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {editingReward ? 'แก้ไขของรางวัล' : 'เพิ่มของรางวัลใหม่'}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetForm}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">ชื่อของรางวัล *</label>
                  <Input
                    placeholder="กรอกชื่อของรางวัล"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">คะแนนที่ต้องการ *</label>
                  <Input
                    type="number"
                    placeholder="กรอกคะแนนที่ต้องการ"
                    value={formData.pointsCost}
                    onChange={(e) => setFormData({ ...formData, pointsCost: e.target.value })}
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">รายละเอียด</label>
                <Textarea
                  placeholder="กรอกรายละเอียดของรางวัล"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium">URL รูปภาพ</label>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <label htmlFor="active" className="text-sm font-medium">
                  เปิดใช้งานของรางวัล
                </label>
              </div>

              <div className="flex gap-2">
                <Button onClick={saveReward} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {editingReward ? 'อัปเดต' : 'บันทึก'}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  ยกเลิก
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rewards List */}
        <Card>
          <CardHeader>
            <CardTitle>รายการของรางวัล</CardTitle>
            <CardDescription>
              จัดการของรางวัลที่ลูกค้าสามารถแลกได้ด้วยคะแนน
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">กำลังโหลด...</div>
            ) : rewards.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>ยังไม่มีของรางวัล</p>
                <p className="text-sm">คลิกปุ่ม "เพิ่มของรางวัล" เพื่อเริ่มต้น</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rewards.map((reward) => (
                  <Card key={reward.id} className={`relative ${!reward.isActive ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4">
                      {/* Status Badge */}
                      <div className="absolute top-2 right-2">
                        <Badge variant={reward.isActive ? 'default' : 'secondary'}>
                          {reward.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                        </Badge>
                      </div>

                      {/* Reward Image */}
                      {reward.imageUrl ? (
                        <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
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
                        <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}

                      {/* Reward Info */}
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg">{reward.name}</h3>
                        {reward.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">{reward.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-purple-600">
                            {reward.pointsCost.toLocaleString()} คะแนน
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(reward)}
                          className="flex-1"
                        >
                          <Edit2 className="h-3 w-3" />
                          แก้ไข
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleActive(reward.id, reward.isActive)}
                          className="flex-1"
                        >
                          {reward.isActive ? 'ปิด' : 'เปิด'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteReward(reward.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
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