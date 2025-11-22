import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { SignJWT } from 'jose'

// Customer API to get their redemption history

export async function GET(request: NextRequest) {
  try {
    console.log('📜 Customer requesting redemption history')

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

    // Get user info
    const user = await prisma.user.findUnique({
      where: { phoneNumber: decoded.phoneNumber },
      select: { id: true, phoneNumber: true, currentPoints: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get all redemptions for this user
    const redemptions = await prisma.rewardRedemption.findMany({
      where: {
        userId: user.id
      },
      include: {
        reward: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            pointsCost: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('📊 Found redemption history:', {
      user: user.phoneNumber,
      totalRedemptions: redemptions.length
    })

    // Calculate statistics
    const stats = {
      totalRedemptions: redemptions.length,
      completedRedemptions: redemptions.filter(r => r.status === 'COMPLETED').length,
      pendingRedemptions: redemptions.filter(r => r.status === 'PENDING').length,
      verifiedRedemptions: redemptions.filter(r => r.status === 'VERIFIED').length,
      cancelledRedemptions: redemptions.filter(r => r.status === 'CANCELLED').length,
      totalPointsSpent: redemptions
        .filter(r => r.status === 'COMPLETED')
        .reduce((sum, r) => sum + r.pointsCost, 0),
      currentPoints: user.currentPoints
    }

    return NextResponse.json({
      success: true,
      redemptions: redemptions,
      stats: stats,
      user: {
        phoneNumber: user.phoneNumber,
        currentPoints: user.currentPoints
      }
    })

  } catch (error) {
    console.error('❌ Error fetching redemption history:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        error: 'Failed to fetch redemption history',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}