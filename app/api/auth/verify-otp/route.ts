import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { SignJWT } from 'jose'
import { normalizeThaiPhoneNumber, isValidThaiMobileNumber } from '@/lib/phoneUtils'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { phoneNumber, otpCode } = body

        if (!phoneNumber || !otpCode) {
            return NextResponse.json(
                { error: 'Phone number and OTP are required' },
                { status: 400 }
            )
        }

        // Validate OTP format (should be 6 digits)
        if (!/^\d{6}$/.test(otpCode)) {
            return NextResponse.json(
                { error: 'Invalid OTP format. OTP must be 6 digits.' },
                { status: 400 }
            )
        }

        // Validate and normalize phone number
        if (!isValidThaiMobileNumber(phoneNumber)) {
            return NextResponse.json(
                { error: 'Invalid phone number format. Please use Thai mobile number format (e.g., 0812345678, 0912345678, 0612345678)' },
                { status: 400 }
            )
        }

        // Normalize phone number for database lookup
        const normalizedPhone = normalizeThaiPhoneNumber(phoneNumber)

        // Find valid OTP in database
        const verificationToken = await prisma.verificationToken.findFirst({
            where: {
                identifier: normalizedPhone,
                token: otpCode,
                expires: {
                    gt: new Date() // Token must not be expired
                }
            }
        })

        if (!verificationToken) {
            return NextResponse.json(
                { error: 'Invalid or expired OTP. Please request a new OTP.' },
                { status: 401 }
            )
        }

        // Delete the used OTP token
        await prisma.verificationToken.delete({
            where: { id: verificationToken.id }
        })

        console.log(`OTP verified successfully for ${normalizedPhone}`)

        // Check if User exists, if not create one
        let user = await prisma.user.findUnique({
            where: { phoneNumber: normalizedPhone },
        })

        if (!user) {
            user = await prisma.user.create({
                data: {
                    phoneNumber: normalizedPhone,
                },
            })
            console.log(`New user created for ${normalizedPhone}`)
        }

        // Generate JWT using jose
        const secret = new TextEncoder().encode(
            process.env.JWT_SECRET || 'default_secret_key_change_me'
        )

        const token = await new SignJWT({
            userId: user.id,
            phoneNumber: user.phoneNumber
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('7d') // Token valid for 7 days
            .sign(secret)

        return NextResponse.json({
            success: true,
            message: 'OTP verified successfully',
            token,
            user: {
                id: user.id,
                phoneNumber: user.phoneNumber,
                currentPoints: user.currentPoints,
                createdAt: user.createdAt
            },
        })
    } catch (error) {
        console.error('Error verifying OTP:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
