/**
 * Tipos para el módulo de administración
 * Separación clara entre entidades de BD, DTOs y respuestas de API
 */

// ============================================================================
// TIPOS BASE (entidades de base de datos)
// ============================================================================

export interface QuantityVariant {
  id: number
  product_id: number
  min_quantity: number
  max_quantity?: number | null
  price: number
  created_at?: string
  updated_at?: string
}

export interface FlavorVariant {
  id: number
  product_id: number
  name: string
  stock?: 'out' | 'low' | 'medium' | 'high'
  created_at?: string
  updated_at?: string
}

export interface AdminProduct {
  id: number
  name: string
  description?: string
  full_description?: string
  price: number
  category: string
  slug: string
  image?: string | null
  images?: string[] | null
  features?: string[] | null
  stock?: 'out' | 'low' | 'medium' | 'high'
  has_quantity_variants?: boolean
  has_flavor_variants?: boolean
  created_at?: string
  updated_at?: string
}

export interface AdminProductWithVariants extends AdminProduct {
  quantity_variants?: QuantityVariant[]
  flavor_variants?: FlavorVariant[]
}

// ============================================================================
// DTOs (Data Transfer Objects) para creación y actualización
// ============================================================================

export interface CreateProductDTO {
  name: string
  description?: string
  full_description?: string
  price: number
  category: string
  slug: string
  image?: string
  images?: string[]
  features?: string[]
  stock?: 'out' | 'low' | 'medium' | 'high'
  has_quantity_variants?: boolean
  has_flavor_variants?: boolean
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> {
  id: number
}

export interface CreateQuantityVariantDTO {
  product_id: number
  min_quantity: number
  max_quantity?: number | null
  price: number
}

export interface CreateFlavorVariantDTO {
  product_id: number
  name: string
  stock?: 'out' | 'low' | 'medium' | 'high'
}

// ============================================================================
// RESPUESTAS DE API
// ============================================================================

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasMore: boolean
}

export interface AdminProductsResponse extends ApiResponse<PaginatedResponse<AdminProductWithVariants>> {}

// ============================================================================
// CONSTANTES
// ============================================================================

export const ADMIN_STOCK_OPTIONS = [
  { value: 'out', label: 'Sin Stock' },
  { value: 'low', label: 'Stock Bajo' },
  { value: 'medium', label: 'Stock Medio' },
  { value: 'high', label: 'Stock Alto' },
] as const

export const ADMIN_CATEGORIES = [
  'Celulares',
  'TV y Audio',
  'Tecnología',
  'Accesorios para celular',
  'Electrodomésticos',
  'Hogar',
  'Seguridad',
  'Scooter y Motos',
  'Belleza y Cuidado Personal',
  'Perfumería',
  'Vapers',
  'Maquillaje',
] as const

export const PRODUCTS_PER_PAGE = 20
