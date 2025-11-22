import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

// Mock data for now due to Prisma configuration issues
const mockUser = {
  id: 'mock-user-id',
  phoneNumber: '0812345678',
  currentPoints: 0,
  createdAt: new Date()
}

const mockTransactions = [
  {
    id: '1',
    userId: 'mock-user-id',
    amount: 500.00,
    transactionDate: new Date()
  },
  {
    id: '2',
    userId: 'mock-user-id',
    amount: 300.50,
    transactionDate: new Date(new Date().setMonth(new Date().getMonth() - 1))
  }
]

export async function GET(request: NextRequest) {
  try {
    console.log('📊 User Summary API called')

    // Extract JWT from Authorization header
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Missing or invalid Authorization header')
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    console.log('🔑 Extracted token:', token.substring(0, 20) + '...')

    // Verify JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)

    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET environment variable is not set')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const { payload } = await jwtVerify(token, secret)
    console.log('✅ JWT verified for user:', payload.userId)

    // Mock user data retrieval (using our seeded user)
    const user = mockUser

    if (!user) {
      console.log('❌ User not found')
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('👤 User found:', user.phoneNumber)

    // Calculate total spending from mock transactions
    const userTransactions = mockTransactions.filter(t => t.userId === user.id)
    const totalSpending = userTransactions.reduce((sum, t) => sum + Number(t.amount), 0)

    // Calculate spending this month
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    const spendingThisMonth = userTransactions
      .filter(t => {
        const transactionDate = new Date(t.transactionDate)
        return transactionDate.getMonth() === currentMonth &&
               transactionDate.getFullYear() === currentYear
      })
      .reduce((sum, t) => sum + Number(t.amount), 0)

    console.log('💰 Total spending:', totalSpending)
    console.log('📅 Spending this month:', spendingThisMonth)

    const response = {
      currentPoints: user.currentPoints,
      totalSpending,
      spendingThisMonth
    }

    console.log('📊 User summary calculated successfully')

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ User summary error:', error)

    if (error instanceof Error && error.name === 'JWTExpired') {
      return NextResponse.json(
        { error: 'Token expired' },
        { status: 401 }
      )
    }

    if (error instanceof Error && error.name === 'JWTInvalid') {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}