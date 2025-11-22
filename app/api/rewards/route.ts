import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Customer API to view available rewards

export async function GET(request: NextRequest) {
  try {
    console.log('🎁 Fetching available rewards for customers')

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Fetch only active rewards
    const rewards = await prisma.reward.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // If userId provided, get user's current points
    let userPoints = 0
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { currentPoints: true }
      })
      if (user) {
        userPoints = user.currentPoints
      }
    }

    // Transform rewards to include eligibility information
    const rewardsWithEligibility = rewards.map(reward => ({
      ...reward,
      canAfford: userPoints >= reward.pointsCost,
      pointsNeeded: Math.max(0, reward.pointsCost - userPoints)
    }))

    console.log('📊 Found active rewards:', rewards.length, 'User points:', userPoints)

    return NextResponse.json({
      rewards: rewardsWithEligibility,
      userPoints,
      totalRewards: rewards.length
    })
  } catch (error) {
    console.error('❌ Error fetching rewards:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        error: 'Failed to fetch rewards',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}