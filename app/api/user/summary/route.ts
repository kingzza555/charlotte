import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { startOfMonth, endOfMonth } from 'date-fns'

export async function GET(request: Request) {
    const payload = await verifyAuth(request)
    if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = payload.userId

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { currentPoints: true },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Calculate total spending
        const totalSpendingAgg = await prisma.transaction.aggregate({
            where: { userId },
            _sum: { amount: true },
        })

        // Calculate spending this month
        const now = new Date()
        const spendingThisMonthAgg = await prisma.transaction.aggregate({
            where: {
                userId,
                transactionDate: {
                    gte: startOfMonth(now),
                    lte: endOfMonth(now),
                },
            },
            _sum: { amount: true },
        })

        return NextResponse.json({
            currentPoints: user.currentPoints,
            totalSpending: totalSpendingAgg._sum.amount || 0,
            spendingThisMonth: spendingThisMonthAgg._sum.amount || 0,
        })
    } catch (error) {
        console.error('Error fetching user summary:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
