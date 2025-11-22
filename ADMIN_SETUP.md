# Charlotte Admin Login Setup

## ภาพรวม (Overview)

ระบบนี้ได้สร้างฟีเจอร์การเข้าสู่ระบบสำหรับผู้ดูแลระบบ (Admin Login) ที่แยกจากการเข้าสู่ระบบของลูกค้า (Customer Login) โดยมีระบบความปลอดภัยและ UI ที่ทันสมัย

## ฟีเจอร์ใหม่ที่เพิ่มเข้ามา

### 1. Database Model - Admin
```prisma
model Admin {
  id        String   @id @default(uuid())
  username  String   @unique
  password  String   // Hashed password
  name      String?  // Display name
  role      String   @default("admin") // admin, manager
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 2. API Routes
- `POST /api/admin/auth/login` - เข้าสู่ระบบผู้ดูแล
- `GET /api/admin/auth/verify` - ตรวจสอบ token

### 3. Admin Login UI
- หน้า login: `/admin/login`
- ดีไซน์ Modern ด้วย gradient background และ glassmorphism effect
- มีระบบ show/hide password
- Form validation และ error handling

### 4. Authentication System
- JWT token-based authentication
- แยก token ระหว่าง admin และ customer
- Middleware สำหรับตรวจสอบสิทธิ์ผู้ดูแลระบบ

## การติดตั้งและตั้งค่า (Setup Instructions)

### 1. Install Dependencies
```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

### 2. Update Database
```bash
# Generate Prisma migration
npx prisma generate
npx prisma db push

# Run seed to create default admin
npm run prisma:seed
# หรือ
npx prisma db seed
```

### 3. Default Admin Account
หลังจากรัน seed จะมี admin account ดังนี้:
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: `admin`
- **Name**: `Default Admin`

### 4. เข้าใช้งานระบบ
1. ไปที่ `http://localhost:3000/admin/login`
2. กรอก username: `admin`
3. กรอก password: `admin123`
4. คลิก "เข้าสู่ระบบ"

## การใช้งาน (Usage)

### การเข้าสู่ระบบ
1. Admin เข้าไปที่ `/admin/login`
2. กรอก username และ password
3. ระบบจะ generate JWT token และเก็บไว้ใน localStorage
4. Redirect ไปที่ `/admin` (dashboard)

### การออกจากระบบ
- มีปุ่ม "ออกจากระบบ" ที่หน้า dashboard
- ลบ token ออกจาก localStorage
- Redirect กลับไปหน้า login

### การป้องกันการเข้าถึง
- หน้า admin ทั้งหมดมีการตรวจสอบ token
- ถ้าไม่มี token หรือ token ไม่ถูกต้อง จะ redirect ไปหน้า login
- แยกสิทธิ์ระหว่าง admin และ customer token

## ความปลอดภัย (Security Features)

1. **Password Hashing**: ใช้ bcrypt ในการ hash password
2. **JWT Tokens**: มี expiration time 24 ชั่วโมง
3. **Token Type Separation**: แยก token ระหว่าง admin และ customer
4. **Input Validation**: ตรวจสอบข้อมูล input ทั้งฝั่ง client และ server
5. **Account Status**: ตรวจสอบสถานะ active/inactive ของ admin account

## โครงสร้างไฟล์ที่เพิ่ม

```
app/
├── admin/
│   ├── layout.tsx          # Admin layout with auth check
│   ├── login/
│   │   └── page.tsx       # Modern admin login UI
│   └── page.tsx           # Updated dashboard with logout
├── api/
│   └── admin/
│       └── auth/
│           ├── login/
│           │   └── route.ts    # Admin login API
│           └── verify/
│               └── route.ts    # Token verification API
lib/
└── admin-auth.ts          # Admin authentication utilities
prisma/
├── schema.prisma          # Updated with Admin model
└── seed.ts               # Updated with admin seed
```

## การปรับแต่งเพิ่มเติม (Customization)

### การเปลี่ยน Admin Password
```sql
UPDATE "Admin" SET password = 'hashed_password_here' WHERE username = 'admin';
```

### การเพิ่ม Admin User ใหม่
1. ใช้ Prisma Studio:
```bash
npx prisma studio
```

2. หรือสร้างผ่าน seed file
3. หรือสร้าง API route สำหรับจัดการ admin

### การปรับ UI
- แก้ไขไฟล์ `app/admin/login/page.tsx`
- เปลี่ยนสี theme ใน Tailwind CSS
- ปรับการทำงานของ animations

## ข้อควรระวัง (Important Notes)

1. **Environment Variables**: ต้องตั้งค่า `JWT_SECRET` ใน `.env`
2. **Default Password**: ควรเปลี่ยน default password หลังจาก setup เสร็จ
3. **Security**: อย่าใช้ default credentials ใน production
4. **Backup**: สำรองข้อมูลก่อนทำการ migration

## การทดสอบ (Testing)

1. **Test Login**:
   - URL: `/admin/login`
   - Credentials: `admin` / `admin123`

2. **Test Auth**:
   - พยายามเข้า `/admin` โดยตรง (ไม่ได้ login)
   - ควร redirect ไปหน้า login

3. **Test Logout**:
   - login เข้าระบบแล้วคลิก logout
   - ควร redirect ไปหน้า login และลบ token

ระบบพร้อมใช้งานแล้ว! 🎉