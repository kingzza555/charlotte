import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Admin API to manage points rate (how many points per 1 THB spent)

export async function GET() {
  try {
    console.log('📊 Getting points rate from database')

    // Get current points rate from SystemConfig
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'POINTS_RATE' }
    })

    const currentRate = config ? parseInt(config.value) : 1 // Default: 1 point per 1 THB

    console.log('🎯 Current points rate:', currentRate, 'points per 1 THB')

    return NextResponse.json({
      rate: currentRate,
      description: `${currentRate} คะแนนต่อ 1 บาท`
    })
  } catch (error) {
    console.error('❌ Error getting points rate:', error)
    return NextResponse.json(
      { error: 'Failed to get points rate' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Updating points rate')

    const body = await request.json()
    const { rate } = body

    // Validate rate
    if (typeof rate !== 'number' || rate < 0 || !Number.isInteger(rate)) {
      return NextResponse.json(
        { error: 'Rate must be a positive integer' },
        { status: 400 }
      )
    }

    if (rate > 1000) {
      return NextResponse.json(
        { error: 'Rate cannot exceed 1000 points per 1 THB' },
        { status: 400 }
      )
    }

    // Update or create points rate in SystemConfig
    await prisma.systemConfig.upsert({
      where: { key: 'POINTS_RATE' },
      update: { value: rate.toString() },
      create: {
        key: 'POINTS_RATE',
        value: rate.toString()
      }
    })

    console.log('✅ Points rate updated to:', rate, 'points per 1 THB')

    return NextResponse.json({
      success: true,
      rate: rate,
      message: `อัตราส่วนคะแนนอัปเดตเป็น ${rate} คะแนนต่อ 1 บาทเรียบร้อยแล้ว`
    })
  } catch (error) {
    console.error('❌ Error updating points rate:', error)
    return NextResponse.json(
      { error: 'Failed to update points rate' },
      { status: 500 }
    )
  }
}