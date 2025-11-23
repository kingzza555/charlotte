# Vercel Deployment Fix for Admin Login

## Issue: 500 Internal Server Error on `/api/admin/auth/login`

## Root Causes & Solutions:

### 1. Missing Database Schema
The `Admin` table doesn't exist in production database.

**Fixes Applied:**
- ✅ Enhanced error handling in login API to detect missing tables
- ✅ Auto-creation of admin table and default user on first login
- ✅ Production migration script (`scripts/vercel-setup.js`)

### 2. Environment Variables
Missing or incorrect environment variables.

**Required Vercel Environment Variables:**
```
DATABASE_URL=your_neon_database_url
JWT_SECRET=your_jwt_secret_key
```

### 3. Build Configuration
Prisma client not properly generated for production.

**Fixes Applied:**
- ✅ Added `postinstall: npx prisma generate`
- ✅ Added `vercel-build: npx prisma generate && next build`

## Deployment Instructions:

### Step 1: Set Environment Variables
In Vercel dashboard → Settings → Environment Variables:
```
DATABASE_URL=postgresql://neondb_owner:xxx@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=your-secure-jwt-secret-here
```

### Step 2: Deploy with Migration
The app now auto-creates the admin table and default user.

### Step 3: First Login
1. Go to `https://your-app.vercel.app/admin/login`
2. Login with: `admin` / `admin123`
3. This will auto-create the admin user if it doesn't exist

### Step 4: Change Default Password
After first login, change the default password immediately.

## Testing the Fix:

```bash
# Test the API directly
curl -X POST https://your-app.vercel.app/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Expected Response:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "...",
  "admin": {
    "id": "...",
    "username": "admin",
    "name": "Default Admin",
    "role": "admin"
  }
}
```

## Debugging:

If issues persist, check Vercel Function Logs for:
- Database connection errors
- Missing environment variables
- Table creation failures

## Security Notes:

1. **Change default password** after first deployment
2. **Use strong JWT_SECRET** (generate with: `openssl rand -base64 32`)
3. **Monitor logs** for suspicious activity

## Auto-Creation Logic:

The login API now includes smart fallback:
1. If `Admin` table doesn't exist → Create it automatically
2. If no admin user exists → Create default `admin`/`admin123` user
3. Return detailed error messages for debugging

This ensures the deployment works out-of-the-box without manual database setup.