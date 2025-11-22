import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Admin API to manage individual rewards (GET, PUT, DELETE)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🎁 Fetching reward:', params.id)

    const reward = await prisma.reward.findUnique({
      where: { id: params.id }
    })

    if (!reward) {
      return NextResponse.json(
        { error: 'Reward not found' },
        { status: 404 }
      )
    }

    console.log('✅ Reward found:', reward.id)

    return NextResponse.json(reward)
  } catch (error) {
    console.error('❌ Error fetching reward:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        error: 'Failed to fetch reward',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🎁 Updating reward:', params.id)

    const body = await request.json()
    const { name, description, imageUrl, pointsCost, isActive } = body

    // Check if reward exists
    const existingReward = await prisma.reward.findUnique({
      where: { id: params.id }
    })

    if (!existingReward) {
      return NextResponse.json(
        { error: 'Reward not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (pointsCost !== undefined) {
      if (typeof pointsCost !== 'number' || pointsCost < 0) {
        return NextResponse.json(
          { error: 'Points cost must be a positive number' },
          { status: 400 }
        )
      }
      updateData.pointsCost = pointsCost
    }
    if (isActive !== undefined) updateData.isActive = isActive

    // Update reward
    const reward = await prisma.reward.update({
      where: { id: params.id },
      data: updateData
    })

    console.log('✅ Reward updated successfully:', reward.id)

    return NextResponse.json({
      success: true,
      reward,
      message: `อัปเดตของรางวัล "${reward.name}" เรียบร้อยแล้ว`
    })
  } catch (error) {
    console.error('❌ Error updating reward:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        error: 'Failed to update reward',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🎁 Deleting reward:', params.id)

    // Check if reward exists
    const existingReward = await prisma.reward.findUnique({
      where: { id: params.id }
    })

    if (!existingReward) {
      return NextResponse.json(
        { error: 'Reward not found' },
        { status: 404 }
      )
    }

    // Delete reward
    await prisma.reward.delete({
      where: { id: params.id }
    })

    console.log('✅ Reward deleted successfully:', params.id)

    return NextResponse.json({
      success: true,
      message: `ลบของรางวัล "${existingReward.name}" เรียบร้อยแล้ว`
    })
  } catch (error) {
    console.error('❌ Error deleting reward:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        error: 'Failed to delete reward',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}