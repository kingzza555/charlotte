import { jwtVerify } from 'jose'

export async function verifyAuth(request: Request) {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null
    }

    const token = authHeader.split(' ')[1]
    const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || 'default_secret_key_change_me'
    )

    try {
        const { payload } = await jwtVerify(token, secret)
        return payload as { userId: string }
    } catch (error) {
        return null
    }
}
