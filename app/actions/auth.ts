"use server"

import { cookies } from "next/headers"
import { randomBytes, createHmac } from "crypto"

declare global {
  var adminTokens: { [key: string]: { email: string; expiresAt: number } } | undefined
}

// Simple credentials for demo (in production, use Supabase Auth or proper auth system)
// Change these credentials to your desired admin credentials
const ADMIN_EMAIL = "usaimport@admin.com"
const ADMIN_PASSWORD = "UsaImp0rt@2025$ecure!" // Change this to a secure password

interface LoginResult {
  success: boolean
  error?: string
  token?: string
}

export async function login(email: string, password: string): Promise<LoginResult> {
  try {
    // Validate credentials
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return {
        success: false,
        error: "Email o contraseña incorrectos",
      }
    }

    // Create a signed token (HMAC) so sessions persist across serverless instances.
    // Requires `ADMIN_JWT_SECRET` to be set in Vercel environment variables.
    const secret = process.env.ADMIN_JWT_SECRET
    if (!secret) {
      console.warn('ADMIN_JWT_SECRET is not set. Falling back to in-memory tokens (not recommended on serverless).')
      const token = randomBytes(32).toString("hex")
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

      const cookieStore = await cookies()
      cookieStore.set("admin_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: expiresAt,
      })

      global.adminTokens = global.adminTokens || {}
      global.adminTokens[token] = {
        email,
        expiresAt: expiresAt.getTime(),
      }

      return {
        success: true,
        token,
      }
    }

    const expiresAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60 // seconds
    const payload = Buffer.from(JSON.stringify({ email, exp: expiresAt })).toString('base64url')
    const signature = createHmac('sha256', secret).update(payload).digest('base64url')
    const signed = `${payload}.${signature}`

    const cookieStore = await cookies()
    cookieStore.set("admin_token", signed, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      // expires expects a Date
      expires: new Date(expiresAt * 1000),
    })

    return {
      success: true,
      token: signed,
    }
  } catch (error) {
    console.error("Login error:", error)
    return {
      success: false,
      error: "Error al procesar la solicitud",
    }
  }
}

export async function logout(): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("admin_token")
  } catch (error) {
    console.error("Logout error:", error)
  }
}

export async function verifyAdminToken(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("admin_token")?.value

    if (!token) {
      return false
    }

    // If ADMIN_JWT_SECRET present, verify HMAC-signed token
    const secret = process.env.ADMIN_JWT_SECRET
    if (secret && token.includes('.')) {
      const [payloadB64, signature] = token.split('.')
      try {
        const expected = createHmac('sha256', secret).update(payloadB64).digest('base64url')
        if (signature !== expected) return false

        const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8')
        const { exp } = JSON.parse(payloadJson)
        if (!exp || typeof exp !== 'number') return false
        return exp > Math.floor(Date.now() / 1000)
      } catch (e) {
        return false
      }
    }

    // Fallback: in-memory token (not reliable on serverless)
    if (global.adminTokens && global.adminTokens[token]) {
      const tokenData = global.adminTokens[token]
      if (tokenData.expiresAt > Date.now()) {
        return true
      } else {
        delete global.adminTokens[token]
      }
    }

    return false
  } catch (error) {
    console.error("Token verification error:", error)
    return false
  }
}

export async function getAdminUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("admin_token")?.value

    if (!token) return null

    const secret = process.env.ADMIN_JWT_SECRET
    if (secret && token.includes('.')) {
      try {
        const [payloadB64, signature] = token.split('.')
        const expected = createHmac('sha256', secret).update(payloadB64).digest('base64url')
        if (signature !== expected) return null
        const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8')
        const data = JSON.parse(payloadJson)
        if (data.exp && data.exp > Math.floor(Date.now() / 1000)) {
          return { email: data.email }
        }
      } catch (e) {
        return null
      }
    }

    if (!global.adminTokens || !global.adminTokens[token]) return null

    const tokenData = global.adminTokens[token]
    if (tokenData.expiresAt > Date.now()) {
      return {
        email: tokenData.email,
      }
    }

    return null
  } catch (error) {
    console.error("Get admin user error:", error)
    return null
  }
}
