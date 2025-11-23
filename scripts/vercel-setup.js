const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupAdmin() {
  try {
    console.log('🔧 Setting up admin user for production...');

    // Check if admin table exists
    try {
      await prisma.$queryRaw`SELECT COUNT(*) FROM "Admin"`;
      console.log('✅ Admin table exists');
    } catch (error) {
      console.log('❌ Admin table does not exist, creating...');

      // Create the table manually if migration doesn't work
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Admin" (
          "id" TEXT NOT NULL,
          "username" TEXT NOT NULL,
          "password" TEXT NOT NULL,
          "name" TEXT,
          "role" TEXT NOT NULL DEFAULT 'admin',
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
        );
      `;

      await prisma.$executeRaw`
        CREATE UNIQUE INDEX IF NOT EXISTS "Admin_username_key" ON "Admin"("username");
      `;

      console.log('✅ Admin table created');
    }

    // Check if admin user exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { username: 'admin' }
    });

    if (!existingAdmin) {
      console.log('🔧 Creating default admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 12);

      await prisma.admin.create({
        data: {
          username: 'admin',
          password: hashedPassword,
          name: 'Default Admin',
          role: 'admin',
          isActive: true
        }
      });

      console.log('✅ Default admin user created successfully');
      console.log('📋 Login credentials:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Only run if called directly
if (require.main === module) {
  setupAdmin();
}

module.exports = { setupAdmin };