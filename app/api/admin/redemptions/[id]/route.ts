import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Admin API to complete redemption (final step that deducts points)

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🎯 Admin completing redemption:', params.id)

    // Find the redemption with full details
    const redemption = await prisma.rewardRedemption.findUnique({
      where: { id: params.id },
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
        { error: 'Redemption not found' },
        { status: 404 }
      )
    }

    if (redemption.status !== 'VERIFIED') {
      return NextResponse.json(
        {
          error: 'Redemption must be verified before completing',
          currentStatus: redemption.status
        },
        { status: 400 }
      )
    }

    // Final check if user still has enough points
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

    // Start transaction to complete redemption
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update redemption status to COMPLETED
      const completedRedemption = await tx.rewardRedemption.update({
        where: { id: redemption.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
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

      // 2. Deduct points from user
      await tx.user.update({
        where: { id: redemption.user.id },
        data: {
          currentPoints: {
            decrement: redemption.pointsCost
          }
        }
      })

      // 3. Create point log for redemption
      await tx.pointLog.create({
        data: {
          userId: redemption.user.id,
          changeAmount: -redemption.pointsCost,
          actionType: 'REDEEM',
          createdAt: new Date()
        }
      })

      // 4. Get updated user info
      const updatedUser = await tx.user.findUnique({
        where: { id: redemption.user.id },
        select: {
          id: true,
          phoneNumber: true,
          currentPoints: true
        }
      })

      return {
        redemption: completedRedemption,
        updatedUser
      }
    })

    console.log('✅ Redemption completed successfully:', {
      code: redemption.code,
      reward: redemption.reward.name,
      user: redemption.user.phoneNumber,
      pointsDeducted: redemption.pointsCost,
      newPointsBalance: result.updatedUser?.currentPoints
    })

    return NextResponse.json({
      success: true,
      redemption: result.redemption,
      updatedUser: result.updatedUser,
      message: `ดำเนินการแลกของรางวัล "${redemption.reward.name}" เรียบร้อยแล้ว! ตัดคะแนน ${redemption.pointsCost} คะแนน`
    })

  } catch (error) {
    console.error('❌ Error completing redemption:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        error: 'Failed to complete redemption',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('❌ Admin canceling redemption:', params.id)

    // Find the redemption
    const redemption = await prisma.rewardRedemption.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            phoneNumber: true
          }
        },
        reward: {
          select: {
            name: true
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

    if (redemption.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot cancel completed redemption' },
        { status: 400 }
      )
    }

    // Update redemption status to CANCELLED
    const cancelledRedemption = await prisma.rewardRedemption.update({
      where: { id: params.id },
      data: {
        status: 'CANCELLED'
      }
    })

    console.log('✅ Redemption cancelled successfully:', {
      code: redemption.code,
      reward: redemption.reward.name,
      user: redemption.user.phoneNumber
    })

    return NextResponse.json({
      success: true,
      redemption: cancelledRedemption,
      message: `ยกเลิกการแลกของรางวัล "${redemption.reward.name}" เรียบร้อยแล้ว`
    })

  } catch (error) {
    console.error('❌ Error cancelling redemption:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        error: 'Failed to cancel redemption',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}