import jwt from 'jsonwebtoken'

export interface AdminUser {
  id: string
  username: string
  name?: string
  role: string
}

export function verifyAdminToken(token: string): AdminUser | null {
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
    const decoded = jwt.verify(token, JWT_SECRET) as any

    // Check if this is an admin token
    if (decoded.type !== 'admin') {
      return null
    }

    return {
      id: decoded.id,
      username: decoded.username,
      name: decoded.name,
      role: decoded.role
    }
  } catch (error) {
    return null
  }
}

export function getAdminFromRequest(request: Request): AdminUser | null {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  return verifyAdminToken(token)
}

export function createAdminAuthMiddleware() {
  return (request: Request) => {
    const admin = getAdminFromRequest(request)

    if (!admin) {
      return new Response(
        JSON.stringify({ error: 'Admin authentication required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    return admin
  }
}