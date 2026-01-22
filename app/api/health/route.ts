import { NextResponse } from 'next/server'

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  supabaseConnection: boolean
  supabaseUrl: string
  tablesExist: {
    products: boolean
    quantityVariants: boolean
    flavorVariants: boolean
  }
  tableCounts?: {
    products: number
    quantityVariants: number
    flavorVariants: number
  }
  realtimeEnabled: boolean
  rlsEnabled: boolean
  productsCount: number
  checks: {
    name: string
    status: boolean
    message?: string
  }[]
  errors: string[]
  message: string
}
