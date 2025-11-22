import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { SignJWT } from 'jose'

// Customer API to request a redemption code for a reward

export async function POST(request: NextRequest) {
  try {
    console.log('🎁 Customer requesting redemption code')

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    // Verify JWT token
    let decoded: any
    try {
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { rewardId } = body

    if (!rewardId) {
      return NextResponse.json(
        { error: 'Reward ID is required' },
        { status: 400 }
      )
    }

    // Get user and reward info
    const user = await prisma.user.findUnique({
      where: { phoneNumber: decoded.phoneNumber },
      select: { id: true, currentPoints: true, phoneNumber: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const reward = await prisma.reward.findUnique({
      where: { id: rewardId }
    })

    if (!reward) {
      return NextResponse.json(
        { error: 'Reward not found' },
        { status: 404 }
      )
    }

    if (!reward.isActive) {
      return NextResponse.json(
        { error: 'Reward is not available' },
        { status: 400 }
      )
    }

    // Check if user has enough points
    if (user.currentPoints < reward.pointsCost) {
      return NextResponse.json(
        {
          error: 'Insufficient points',
          userPoints: user.currentPoints,
          requiredPoints: reward.pointsCost
        },
        { status: 400 }
      )
    }

    // Check if user already has a pending redemption for this reward
    const existingRedemption = await prisma.rewardRedemption.findFirst({
      where: {
        userId: user.id,
        rewardId: rewardId,
        status: 'PENDING'
      }
    })

    if (existingRedemption) {
      return NextResponse.json(
        {
          error: 'You already have a pending redemption request for this reward',
          existingCode: existingRedemption.code
        },
        { status: 400 }
      )
    }

    // Generate unique 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Create redemption record
    const redemption = await prisma.rewardRedemption.create({
      data: {
        userId: user.id,
        rewardId: rewardId,
        code: code,
        status: 'PENDING',
        pointsCost: reward.pointsCost
      },
      include: {
        user: {
          select: {
            phoneNumber: true,
            currentPoints: true
          }
        },
        reward: {
          select: {
            name: true,
            pointsCost: true
          }
        }
      }
    })

    console.log('✅ Redemption code created:', {
      code: redemption.code,
      reward: redemption.reward.name,
      user: redemption.user.phoneNumber
    })

    return NextResponse.json({
      success: true,
      code: redemption.code,
      redemption: {
        code: redemption.code,
        rewardName: redemption.reward.name,
        rewardCost: redemption.reward.pointsCost,
        userPoints: redemption.user.currentPoints,
        createdAt: redemption.createdAt
      },
      message: `กรุณาแสดงรหัส ${code} ให้พนักงานเพื่อยืนยันการแลกของรางวัล "${reward.name}"`
    })

  } catch (error) {
    console.error('❌ Error requesting redemption:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        error: 'Failed to request redemption',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}