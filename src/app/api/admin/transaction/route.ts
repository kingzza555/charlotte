import { NextRequest, NextResponse } from 'next/server'

// Mock data for now due to Prisma configuration issues
const mockUsers = [
  {
    id: 'mock-user-id',
    phoneNumber: '0812345678',
    currentPoints: 0,
    createdAt: new Date()
  }
]

const mockSystemConfig = {
  point_conversion_rate: '100'
}

export async function POST(request: NextRequest) {
  try {
    console.log('💳 Admin Transaction API called')

    const body = await request.json()
    const { phoneNumber, amount } = body

    console.log('📞 Phone number:', phoneNumber)
    console.log('💵 Amount:', amount)

    if (!phoneNumber || !amount) {
      console.log('❌ Missing phone number or amount')
      return NextResponse.json(
        { error: 'Phone number and amount are required' },
        { status: 400 }
      )
    }

    if (typeof amount !== 'number' || amount <= 0) {
      console.log('❌ Invalid amount:', amount)
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      )
    }

    // Find User by phoneNumber (mock implementation)
    const user = mockUsers.find(u => u.phoneNumber === phoneNumber)

    if (!user) {
      console.log('❌ User not found for phone:', phoneNumber)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('👤 User found:', user.phoneNumber, 'Current points:', user.currentPoints)

    // Fetch point conversion rate from SystemConfig
    const pointConversionRate = parseInt(mockSystemConfig.point_conversion_rate, 10)

    if (isNaN(pointConversionRate) || pointConversionRate <= 0) {
      console.error('❌ Invalid point conversion rate:', mockSystemConfig.point_conversion_rate)
      return NextResponse.json(
        { error: 'Invalid point conversion rate configuration' },
        { status: 500 }
      )
    }

    console.log('🔄 Point conversion rate:', pointConversionRate)

    // Calculate points earned
    const pointsEarned = Math.floor(amount / pointConversionRate)

    console.log('🎯 Points earned calculation:', amount, '/', pointConversionRate, '=', pointsEarned)

    if (pointsEarned <= 0) {
      console.log('ℹ️ No points earned - amount too low')
      return NextResponse.json(
        { success: true, pointsEarned: 0, message: 'Amount too low to earn points' }
      )
    }

    // Mock atomic transaction operations
    // In real implementation, this would use prisma.$transaction

    // 1. Create Transaction record
    const transaction = {
      id: 'transaction-' + Date.now(),
      userId: user.id,
      amount: amount,
      transactionDate: new Date()
    }
    console.log('📝 Transaction created:', transaction.id)

    // 2. Update User (increment currentPoints)
    user.currentPoints += pointsEarned
    console.log('✅ User points updated:', user.currentPoints)

    // 3. Create PointLog (action: 'EARN', changeAmount: points)
    const pointLog = {
      id: 'pointlog-' + Date.now(),
      userId: user.id,
      changeAmount: pointsEarned,
      actionType: 'EARN',
      createdAt: new Date()
    }
    console.log('📊 Point log created:', pointLog.id)

    console.log('🎉 Transaction completed successfully!')

    const response = {
      success: true,
      pointsEarned
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Admin transaction error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}