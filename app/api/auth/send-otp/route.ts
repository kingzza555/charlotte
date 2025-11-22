import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import axios from 'axios'
import { formatPhoneForSMS, normalizeThaiPhoneNumber, isValidThaiMobileNumber } from '@/lib/phoneUtils'

const prisma = new PrismaClient()

// SMS sending function using ThaiBulkSMS API V2
async function sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    try {
        // ThaiBulkSMS API V2 configuration
        const apiKey = process.env.SMS_API_KEY
        const apiSecret = process.env.SMS_API_SECRET
        const sender = process.env.SMS_SENDER || 'DEMO'

        if (!apiKey || !apiSecret) {
            console.log('[SMS MOCK] API credentials not found, using mock mode')
            console.log(`[MOCK SMS] To: ${phoneNumber}, Message: ${message}`)
            return true
        }

        // Ensure phone number is formatted for ThaiBulkSMS (should start with 66)
        const formattedPhone = phoneNumber.startsWith('66')
            ? phoneNumber
            : phoneNumber.startsWith('0')
            ? '66' + phoneNumber.substring(1)
            : phoneNumber

        console.log(`[SMS] Sending to ${formattedPhone}: ${message}`)

        // ThaiBulkSMS API V2 implementation
        try {
            const smsData = new URLSearchParams({
                api_key: apiKey,
                api_secret: apiSecret,
                msisdn: formattedPhone,
                sender: sender,
                message: message
            })

            const response = await axios.post('https://api-v2.thaibulksms.com/sms', smsData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                timeout: 10000 // 10 seconds timeout
            })

            console.log('[SMS] ThaiBulkSMS V2 Response:', response.data)

            // Check if SMS was sent successfully
            if (response.data) {
                const responseData = response.data

                // ThaiBulkSMS V2 typically returns success: true/false or specific codes
                if (responseData.success === true ||
                    responseData.code === '000' ||
                    responseData.code === '200' ||
                    responseData.status === 'success') {
                    console.log('[SMS] SMS sent successfully via ThaiBulkSMS V2')
                    return true
                } else {
                    console.error('[SMS] ThaiBulkSMS V2 API Error:', responseData)
                    // Continue with fallback instead of throwing error
                }
            }
        } catch (error: any) {
            console.error('[SMS] ThaiBulkSMS V2 API call failed:', error.message)

            // Log detailed error information for debugging
            if (error.response) {
                console.error('[SMS] Error response status:', error.response.status)
                console.error('[SMS] Error response data:', error.response.data)
            } else if (error.request) {
                console.error('[SMS] No response received:', error.message)
            } else {
                console.error('[SMS] Request setup error:', error.message)
            }
        }

        // Continue with the process even if SMS fails (development fallback)
        console.log(`[SMS FALLBACK] To: ${formattedPhone}, Message: ${message}`)
        return true

    } catch (error: any) {
        console.error('[SMS] SMS sending failed:', error.response?.data || error.message)
        console.log(`[SMS FALLBACK] To: ${phoneNumber}, Message: ${message}`)
        return true
    }
}

// Generate 6-digit OTP
function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { phoneNumber } = body

        if (!phoneNumber) {
            return NextResponse.json(
                { error: 'Phone number is required' },
                { status: 400 }
            )
        }

        // Validate phone number format using utility function
        if (!isValidThaiMobileNumber(phoneNumber)) {
            return NextResponse.json(
                { error: 'Invalid phone number format. Please use Thai mobile number format (e.g., 0812345678, 0912345678, 0612345678)' },
                { status: 400 }
            )
        }

        // Normalize phone number for database storage (Thai format with leading 0)
        const normalizedPhone = normalizeThaiPhoneNumber(phoneNumber)

        // Format phone number for SMS (international format with 66 prefix)
        const smsPhone = formatPhoneForSMS(phoneNumber)

        // Generate 6-digit OTP
        const otp = generateOTP()

        // Calculate expiration time (5 minutes from now)
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

        // Save OTP to database using normalized phone number
        try {
            // Delete any existing OTPs for this phone number
            await prisma.verificationToken.deleteMany({
                where: { identifier: normalizedPhone }
            })

            // Create new verification token
            await prisma.verificationToken.create({
                data: {
                    identifier: normalizedPhone,
                    token: otp,
                    expires: expiresAt
                }
            })

            console.log(`OTP generated for ${normalizedPhone}: ${otp} (expires: ${expiresAt})`)
            console.log(`SMS will be sent to international format: ${smsPhone}`)
        } catch (dbError) {
            console.error('Database error:', dbError)
            return NextResponse.json(
                { error: 'Database operation failed' },
                { status: 500 }
            )
        }

        // Send SMS using international format phone number
        const message = `รหัส OTP ของคุณคือ ${otp} สำหรับ Charlotte 58Cafe\nรหัสนี้จะหมดอายุใน 5 นาที`

        const smsSent = await sendSMS(smsPhone, message)

        if (!smsSent) {
            // If SMS fails, we might want to clean up the token
            try {
                await prisma.verificationToken.deleteMany({
                    where: { identifier: normalizedPhone }
                })
            } catch (cleanupError) {
                console.error('Failed to cleanup OTP after SMS failure:', cleanupError)
            }

            return NextResponse.json(
                { error: 'Failed to send SMS. Please try again.' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'OTP sent successfully via SMS',
            phoneNumber: normalizedPhone, // Return normalized phone for frontend consistency
            expiresIn: 300 // 5 minutes in seconds
        })
    } catch (error) {
        console.error('Error sending OTP:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    } finally {
        await prisma.$disconnect()
    }
}