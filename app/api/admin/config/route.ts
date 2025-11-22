import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const config = await prisma.systemConfig.findUnique({
            where: { key: 'pointConversionRate' },
        });
        return NextResponse.json({ rate: config ? parseInt(config.value) : 100 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { rate } = body;

        if (rate === undefined || rate === null) {
            return NextResponse.json({ error: 'Missing rate' }, { status: 400 });
        }

        await prisma.systemConfig.upsert({
            where: { key: 'pointConversionRate' },
            update: { value: String(rate) },
            create: { key: 'pointConversionRate', value: String(rate) },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
