import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Admin API to record transaction and award points automatically

export async function POST(request: NextRequest) {
  try {
    console.log('💳 Recording transaction and awarding points')

    const body = await request.json()
    const { userId, amount } = body

    // Validate input
    if (!userId || !amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid input: userId and amount are required' },
        { status: 400 }
      )
    }

    // Get points rate from SystemConfig
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'POINTS_RATE' }
    })

    const pointsRate = config ? parseInt(config.value) : 1 // Default: 1 point per 1 THB
    const pointsToAward = Math.floor(amount * pointsRate)

    console.log('📊 Transaction details:', {
      userId,
      amount,
      pointsRate,
      pointsToAward
    })

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId: userId,
          amount: amount,
          transactionDate: new Date(),
        },
      })

      // 2. Add points to user
      await tx.user.update({
        where: { id: userId },
        data: {
          currentPoints: {
            increment: pointsToAward,
          },
        },
      })

      // 3. Create point log
      await tx.pointLog.create({
        data: {
          userId: userId,
          changeAmount: pointsToAward,
          actionType: 'EARN',
          createdAt: new Date(),
        },
      })

      return {
        transaction,
        pointsAwarded: pointsToAward,
        pointsRate,
      }
    })

    console.log('✅ Transaction recorded successfully:', {
      transactionId: result.transaction.id,
      pointsAwarded: result.pointsAwarded,
      pointsRate: result.pointsRate
    })

    return NextResponse.json({
      success: true,
      message: `บันทึกธุรกรรม ${amount} บาท และให้ ${result.pointsAwarded} คะแนนเรียบร้อยแล้ว`,
      transaction: {
        id: result.transaction.id,
        amount: result.transaction.amount,
        transactionDate: result.transaction.transactionDate,
      },
      pointsAwarded: result.pointsAwarded,
      pointsRate: result.pointsRate,
    })
  } catch (error) {
    console.error('❌ Error recording transaction:', error)

    // Return detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error details:', errorMessage)

    return NextResponse.json(
      {
        error: 'Failed to record transaction',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}