import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Seed SystemConfig with point conversion rate
  await prisma.systemConfig.upsert({
    where: { key: 'POINTS_RATE' },
    update: {}, // Do nothing if exists
    create: {
      key: 'POINTS_RATE',
      value: '1'
    }
  })

  // Create default admin user
  const adminUsername = 'admin'
  const adminPassword = 'admin123'
  const hashedPassword = await bcrypt.hash(adminPassword, 12)

  const existingAdmin = await prisma.admin.findUnique({
    where: { username: adminUsername }
  })

  if (!existingAdmin) {
    await prisma.admin.create({
      data: {
        username: adminUsername,
        password: hashedPassword,
        name: 'Default Admin',
        role: 'admin',
        isActive: true
      }
    })
    console.log(`✅ Admin user created: ${adminUsername} / ${adminPassword}`)
  } else {
    console.log(`ℹ️  Admin user already exists: ${adminUsername}`)
  }

  console.log('✅ Seed completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
