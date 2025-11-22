import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Admin API to manage rewards (GET all, POST new)

export async function GET() {
  try {
    console.log('🎁 Fetching rewards from database')

    // Fetch all rewards from database
    const rewards = await prisma.reward.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('📊 Found rewards:', rewards.length)

    return NextResponse.json(rewards)
  } catch (error) {
    console.error('❌ Error fetching rewards:', error)

    // Return detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error details:', errorMessage)

    return NextResponse.json(
      {
        error: 'Failed to fetch rewards',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎁 Creating new reward')

    const body = await request.json()
    const { name, description, imageUrl, pointsCost, isActive } = body

    // Validate required fields
    if (!name || pointsCost === undefined || pointsCost === null) {
      return NextResponse.json(
        { error: 'Name and pointsCost are required' },
        { status: 400 }
      )
    }

    // Validate pointsCost
    if (typeof pointsCost !== 'number' || pointsCost < 0) {
      return NextResponse.json(
        { error: 'Points cost must be a positive number' },
        { status: 400 }
      )
    }

    // Create new reward
    const reward = await prisma.reward.create({
      data: {
        name,
        description: description || null,
        imageUrl: imageUrl || null,
        pointsCost,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    console.log('✅ Reward created successfully:', reward.id)

    return NextResponse.json({
      success: true,
      reward,
      message: `เพิ่มของรางวัล "${name}" เรียบร้อยแล้ว`
    })
  } catch (error) {
    console.error('❌ Error creating reward:', error)

    // Return detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error details:', errorMessage)

    return NextResponse.json(
      {
        error: 'Failed to create reward',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}