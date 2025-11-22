const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Seed SystemConfig with point conversion rate
    const systemConfig = await prisma.systemConfig.upsert({
        where: { key: 'point_conversion_rate' },
        update: {}, // Do nothing if exists
        create: {
            key: 'point_conversion_rate',
            value: '100'
        }
    });

    const user = await prisma.user.upsert({
        where: { phoneNumber: '0812345678' },
        update: {},
        create: {
            phoneNumber: '0812345678',
            currentPoints: 0,
        },
    });

    console.log('✅ Seed completed successfully!');
    console.log({ systemConfig, user });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
