import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'

// Mock user data for testing
const mockUser = {
  id: 'mock-user-id',
  phoneNumber: '0812345678',
  currentPoints: 0,
  createdAt: new Date().toISOString()
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Verify OTP endpoint called')

    const body = await request.json()
    const { phoneNumber, otpCode } = body

    console.log('📞 Phone number:', phoneNumber)
    console.log('🔢 OTP code:', otpCode)

    if (!phoneNumber || !otpCode) {
      console.log('❌ Missing phone number or OTP code')
      return NextResponse.json(
        { error: 'Phone number and OTP code are required' },
        { status: 400 }
      )
    }

    // Verify OTP (mock - always 1234)
    if (otpCode !== '1234') {
      console.log('❌ Invalid OTP code')
      return NextResponse.json(
        { error: 'Invalid OTP code' },
        { status: 401 }
      )
    }

    // Check if the phone number matches our seeded user
    if (phoneNumber !== mockUser.phoneNumber) {
      console.log('❌ User not found for phone:', phoneNumber)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('✅ User authenticated:', mockUser.phoneNumber)

    // Sign JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)

    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET environment variable is not set')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    console.log('🔑 Signing JWT token...')

    const token = await new SignJWT({
      userId: mockUser.id,
      phoneNumber: mockUser.phoneNumber
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret)

    console.log('✅ JWT token signed successfully')

    const response = {
      success: true,
      token,
      user: {
        id: mockUser.id,
        phoneNumber: mockUser.phoneNumber,
        currentPoints: mockUser.currentPoints,
        createdAt: mockUser.createdAt
      }
    }

    console.log('🎉 Authentication successful!')

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Verify OTP error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}