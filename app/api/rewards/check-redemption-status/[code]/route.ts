import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

// Customer API to check redemption status
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    console.log('🔍 Checking redemption status for code:', params.code)

    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]

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

    if (!decoded || typeof decoded !== 'object' || !('userId' in decoded)) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const userId = decoded.userId as string

    // Find the redemption with full details
    const redemption = await prisma.rewardRedemption.findFirst({
      where: {
        code: params.code,
        userId: userId // Ensure user can only check their own redemptions
      },
      include: {
        user: {
          select: {
            id: true,
            phoneNumber: true,
            currentPoints: true
          }
        },
        reward: {
          select: {
            id: true,
            name: true,
            pointsCost: true
          }
        }
      }
    })

    if (!redemption) {
      return NextResponse.json(
        { error: 'Redemption not found' },
        { status: 404 }
      )
    }

    console.log('📊 Redemption status:', {
      code: redemption.code,
      status: redemption.status,
      reward: redemption.reward.name,
      user: redemption.user.phoneNumber
    })

    // If redemption is completed, return detailed info
    if (redemption.status === 'COMPLETED') {
      return NextResponse.json({
        status: 'COMPLETED',
        rewardName: redemption.reward.name,
        pointsUsed: redemption.pointsCost,
        remainingPoints: redemption.user.currentPoints,
        completedAt: redemption.completedAt
      })
    }

    // Return current status for pending/verified redemptions
    return NextResponse.json({
      status: redemption.status,
      rewardName: redemption.reward.name,
      pointsUsed: redemption.pointsCost,
      remainingPoints: redemption.user.currentPoints
    })

  } catch (error) {
    console.error('❌ Error checking redemption status:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        error: 'Failed to check redemption status',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}