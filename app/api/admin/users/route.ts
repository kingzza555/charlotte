import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Admin API to fetch customer data with search and totalSpending from database

interface UserWithSpending {
  id: string
  phoneNumber: string
  currentPoints: number
  totalSpending: number
  createdAt: string
}

export async function GET(request: NextRequest) {
  try {
    console.log('👥 Admin Users API called - Connecting to database')

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    console.log('🔍 Search parameter:', search || 'none')

    // Build the where clause for search
    const whereClause = search
      ? {
          phoneNumber: {
            contains: search
          }
        }
      : {}

    // Fetch users from database with their transactions
    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        transactions: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('📊 Found users in database:', users.length)

    // Calculate total spending for each user and format the response
    const usersWithSpending: UserWithSpending[] = users.map(user => {
      const totalSpending = user.transactions.reduce(
        (sum, transaction) => sum + Number(transaction.amount),
        0
      )

      return {
        id: user.id,
        phoneNumber: user.phoneNumber,
        currentPoints: user.currentPoints,
        totalSpending: parseFloat(totalSpending.toFixed(2)),
        createdAt: user.createdAt.toISOString()
      }
    })

    console.log('👤 Returning', usersWithSpending.length, 'users from database')
    if (usersWithSpending.length > 0) {
      console.log('💰 Sample total spending:', usersWithSpending[0]?.totalSpending || 0)
      console.log('📱 Sample phone number:', usersWithSpending[0]?.phoneNumber || 'N/A')
    }

    return NextResponse.json(usersWithSpending)
  } catch (error) {
    console.error('❌ Error fetching users from database:', error)

    // Return detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error details:', errorMessage)

    return NextResponse.json(
      {
        error: 'Failed to fetch users from database',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}