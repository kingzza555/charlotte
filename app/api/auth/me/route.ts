import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

// API to get current user info from JWT token

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Auth me API called')

    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    // Verify JWT token
    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
      console.log('🎯 Token verified for user:', decoded.phoneNumber)
    } catch (error) {
      console.error('❌ Invalid token:', error)
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get user from database
    if (!decoded.phoneNumber) {
      console.error('❌ No phoneNumber in decoded token')
      return NextResponse.json(
        { error: 'Invalid token: missing phoneNumber' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { phoneNumber: decoded.phoneNumber },
      select: {
        id: true,
        phoneNumber: true,
        currentPoints: true,
        createdAt: true,
      },
    })

    if (!user) {
      console.error('❌ User not found:', decoded.phoneNumber)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('✅ User found:', user.phoneNumber, 'Points:', user.currentPoints)

    return NextResponse.json(user)
  } catch (error) {
    console.error('❌ Error in auth me:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        error: 'Failed to get user info',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}