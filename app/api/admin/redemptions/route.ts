import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Admin API to manage redemption verifications

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Admin fetching pending redemptions')

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDING'

    // Get redemptions with full details
    const redemptions = await prisma.rewardRedemption.findMany({
      where: { status },
      include: {
        user: {
          select: {
            id: true,
            phoneNumber: true,
            currentPoints: true,
            createdAt: true
          }
        },
        reward: {
          select: {
            id: true,
            name: true,
            pointsCost: true,
            imageUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`📊 Found ${redemptions.length} redemptions with status: ${status}`)

    return NextResponse.json(redemptions)
  } catch (error) {
    console.error('❌ Error fetching redemptions:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        error: 'Failed to fetch redemptions',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('✅ Admin verifying redemption code')

    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Redemption code is required' },
        { status: 400 }
      )
    }

    // Find the redemption
    const redemption = await prisma.rewardRedemption.findFirst({
      where: { code },
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
            pointsCost: true,
            imageUrl: true
          }
        }
      }
    })

    if (!redemption) {
      return NextResponse.json(
        { error: 'Invalid redemption code' },
        { status: 404 }
      )
    }

    if (redemption.status !== 'PENDING') {
      return NextResponse.json(
        {
          error: 'Redemption has already been processed',
          currentStatus: redemption.status
        },
        { status: 400 }
      )
    }

    // Check if user still has enough points
    if (redemption.user.currentPoints < redemption.pointsCost) {
      return NextResponse.json(
        {
          error: 'User no longer has enough points',
          userPoints: redemption.user.currentPoints,
          requiredPoints: redemption.pointsCost
        },
        { status: 400 }
      )
    }

    // Start transaction to verify and complete redemption
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update redemption status to VERIFIED
      const verifiedRedemption = await tx.rewardRedemption.update({
        where: { id: redemption.id },
        data: {
          status: 'VERIFIED',
          verifiedAt: new Date()
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
              pointsCost: true,
              imageUrl: true
            }
          }
        }
      })

      return verifiedRedemption
    })

    console.log('✅ Redemption verified successfully:', {
      code: result.code,
      reward: result.reward.name,
      user: result.user.phoneNumber
    })

    return NextResponse.json({
      success: true,
      redemption: result,
      message: `ยืนยันการแลกของรางวัล "${result.reward.name}" สำเร็จแล้ว กรุณากดปุ่มยืนยันเพื่อดำเนินการตัดคะแนน`
    })

  } catch (error) {
    console.error('❌ Error verifying redemption:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        error: 'Failed to verify redemption',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}