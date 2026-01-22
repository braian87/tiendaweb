/**
 * Server Actions para administración de productos
 * Contiene toda la lógica de acceso a base de datos
 * Server-side ONLY - ejecuta en servidor
 */

'use server'

import { createServerClient } from '@/lib/supabase/server'
import { allCategories } from '@/lib/categories'
import type {
  AdminProduct,
  AdminProductWithVariants,
  CreateProductDTO,
  UpdateProductDTO,
  CreateQuantityVariantDTO,
  CreateFlavorVariantDTO,
  PaginatedResponse,
} from '@/types/admin'
import { PRODUCTS_PER_PAGE } from '@/types/admin'

/**
 * Normaliza el nombre de categoría para asegurar que siempre sea el nombre correcto
 * Busca por nombre o ID en allCategories
 */
function normalizeCategoryName(categoryValue: string): string {
  if (!categoryValue) return categoryValue

  const normalized = categoryValue.toLowerCase().trim()

  // Mapeo explícito de valores antiguos
  const oldToNewMap: Record<string, string> = {
    'accesorios-celular': 'Accesorios para celular',
  }

  // Si está en el mapeo, usar el nuevo valor
  if (oldToNewMap[normalized]) {
    return oldToNewMap[normalized]
  }

  // Buscar por nombre exacto (case-insensitive)
  const byName = allCategories.find(cat => cat.name.toLowerCase() === normalized)
  if (byName) return byName.name

  // Buscar por ID (case-insensitive)
  const byId = allCategories.find(cat => cat.id.toLowerCase() === normalized)
  if (byId) return byId.name

  // Si no se encuentra, devolver el valor original (probablemente ya sea correcto)
  return categoryValue
}

// ============================================================================
// LECTURA DE PRODUCTOS
// ============================================================================

/**
 * Obtiene todos los productos con paginación
 * @param page Número de página (1-indexed)
 * @param pageSize Cantidad de productos por página
 * @param search Búsqueda por nombre o descripción
 * @param category Filtrar por categoría
 */
export async function getProducts(
  page: number = 1,
  pageSize: number = PRODUCTS_PER_PAGE,
  search?: string,
  category?: string
): Promise<PaginatedResponse<AdminProductWithVariants>> {
  const supabase = await createServerClient()

  const offset = (page - 1) * pageSize

  // Contamos primero para saber el total
  let countQuery = supabase
    .from('products')
    .select('id', { count: 'exact', head: true })

  if (search) {
    countQuery = countQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
  }

  if (category) {
    countQuery = countQuery.ilike('category', category)
  }

  const { count, error: countError } = await countQuery

  if (countError) {
    throw new Error(`Error contando productos: ${countError.message}`)
  }

  // Obtenemos los datos
  let dataQuery = supabase
    .from('products')
    .select(
      `
      *,
      quantity_variants(*),
      flavor_variants(*)
      `
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (search) {
    dataQuery = dataQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
  }

  if (category) {
    dataQuery = dataQuery.ilike('category', category)
  }

  const { data, error: dataError } = await dataQuery

  if (dataError) {
    throw new Error(`Error obteniendo productos: ${dataError.message}`)
  }

  const products = (data || []) as AdminProductWithVariants[]
  
  console.log('[GET_PRODUCTS] Productos traídos:', {
    count: products.length,
    sampleProduct: products[0] ? {
      id: products[0].id,
      name: products[0].name,
      quantityVariants: products[0].quantity_variants?.length || 0,
      flavorVariants: products[0].flavor_variants?.length || 0,
    } : null,
  })

  const total = count || 0
  const totalPages = Math.ceil(total / pageSize)

  return {
    items: products,
    total,
    page,
    pageSize,
    totalPages,
    hasMore: page < totalPages,
  }
}

/**
 * Obtiene un producto por ID con sus variantes
 */
export async function getProductById(id: number): Promise<AdminProductWithVariants | null> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      quantity_variants(*),
      flavor_variants(*)
      `
    )
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // No encontrado
    }
    throw new Error(`Error obteniendo producto: ${error.message}`)
  }

  return data as AdminProductWithVariants
}

/**
 * Verifica si un slug ya existe (para evitar duplicados)
 */
export async function slugExists(slug: string, excludeId?: number): Promise<boolean> {
  const supabase = await createServerClient()

  let query = supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('slug', slug)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { count, error } = await query

  if (error) {
    throw new Error(`Error verificando slug: ${error.message}`)
  }

  return (count || 0) > 0
}

// ============================================================================
// CREACIÓN DE PRODUCTOS
// ============================================================================

/**
 * Crea un nuevo producto con variantes opcionales
 */
export async function createProduct(
  productData: CreateProductDTO,
  quantityVariants?: CreateQuantityVariantDTO[],
  flavorVariants?: CreateFlavorVariantDTO[]
): Promise<AdminProductWithVariants> {
  const supabase = await createServerClient()

  console.log('[CREATE_PRODUCT] Recibido:', {
    product: productData.name,
    quantityVariantsCount: quantityVariants?.length || 0,
    flavorVariantsCount: flavorVariants?.length || 0,
    quantityVariants: quantityVariants,
    flavorVariants: flavorVariants,
  })

  // Validar slug único
  const exists = await slugExists(productData.slug)
  if (exists) {
    throw new Error('Ya existe un producto con este slug')
  }

  // Normalizar categoría usando la nueva función
  const normalizedCategory = normalizeCategoryName(productData.category)

  const dataToInsert = {
    ...productData,
    category: normalizedCategory,
  }

  // Crear producto
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert([dataToInsert])
    .select()
    .single()

  if (productError) {
    throw new Error(`Error creando producto: ${productError.message}`)
  }

  const productId = product.id

  // Crear variantes de cantidad si existen
  let createdQtyVariants: any[] = []
  if (quantityVariants && quantityVariants.length > 0) {
    console.log('[CREATE_PRODUCT] Insertando variantes de cantidad:', quantityVariants)
    const { data, error } = await supabase
      .from('quantity_variants')
      .insert(quantityVariants.map((v) => ({ ...v, product_id: productId })))
      .select()

    if (error) {
      // Limpiar el producto si falla la creación de variantes
      await supabase.from('products').delete().eq('id', productId)
      throw new Error(`Error creando variantes de cantidad: ${error.message}`)
    }

    createdQtyVariants = data || []
    console.log('[CREATE_PRODUCT] Variantes de cantidad creadas:', createdQtyVariants)
  }

  // Crear variantes de sabor si existen
  let createdFlavorVariants: any[] = []
  if (flavorVariants && flavorVariants.length > 0) {
    console.log('[CREATE_PRODUCT] Insertando variantes de sabor:', flavorVariants)
    const { data, error } = await supabase
      .from('flavor_variants')
      .insert(flavorVariants.map((v) => ({ ...v, product_id: productId })))
      .select()

    if (error) {
      // Limpiar el producto si falla la creación de variantes
      await supabase.from('products').delete().eq('id', productId)
      throw new Error(`Error creando variantes de sabor: ${error.message}`)
    }

    createdFlavorVariants = data || []
    console.log('[CREATE_PRODUCT] Variantes de sabor creadas:', createdFlavorVariants)
  }

  return {
    ...product,
    quantity_variants: createdQtyVariants,
    flavor_variants: createdFlavorVariants,
  } as AdminProductWithVariants
}

// ============================================================================
// ACTUALIZACIÓN DE PRODUCTOS
// ============================================================================

/**
 * Actualiza un producto existente
 */
export async function updateProduct(data: UpdateProductDTO): Promise<AdminProductWithVariants> {
  const supabase = await createServerClient()

  const { id, ...updates } = data

  // Si se cambió el slug, validar unicidad
  if (updates.slug) {
    const exists = await slugExists(updates.slug, id)
    if (exists) {
      throw new Error('Ya existe un producto con este slug')
    }
  }

  // Normalizar categoría si está presente
  const normalizedUpdates = {
    ...updates,
    ...(updates.category && {
      category: normalizeCategoryName(updates.category),
    }),
  }

  const { data: updated, error } = await supabase
    .from('products')
    .update(normalizedUpdates)
    .eq('id', id)
    .select(
      `
      *,
      quantity_variants(*),
      flavor_variants(*)
      `
    )
    .single()

  if (error) {
    throw new Error(`Error actualizando producto: ${error.message}`)
  }

  return updated as AdminProductWithVariants
}

/**
 * Actualiza variantes de cantidad
 */
export async function updateQuantityVariants(
  productId: number,
  variants: Array<{
    id?: number
    min_quantity: number
    max_quantity?: number | null
    price: number
  }>
): Promise<void> {
  const supabase = await createServerClient()

  // Eliminar todas las variantes existentes
  const { error: deleteError } = await supabase
    .from('quantity_variants')
    .delete()
    .eq('product_id', productId)

  if (deleteError) {
    throw new Error(`Error eliminando variantes: ${deleteError.message}`)
  }

  // Insertar nuevas
  if (variants.length > 0) {
    const { error: insertError } = await supabase
      .from('quantity_variants')
      .insert(
        variants.map((v) => ({
          product_id: productId,
          min_quantity: v.min_quantity,
          max_quantity: v.max_quantity,
          price: v.price,
        }))
      )

    if (insertError) {
      throw new Error(`Error creando variantes: ${insertError.message}`)
    }
  }
}

/**
 * Actualiza variantes de sabor
 */
export async function updateFlavorVariants(
  productId: number,
  variants: Array<{
    id?: number
    name: string
    stock?: 'out' | 'low' | 'medium' | 'high'
  }>
): Promise<void> {
  const supabase = await createServerClient()

  // Eliminar todas las variantes existentes
  const { error: deleteError } = await supabase
    .from('flavor_variants')
    .delete()
    .eq('product_id', productId)

  if (deleteError) {
    throw new Error(`Error eliminando variantes: ${deleteError.message}`)
  }

  // Insertar nuevas
  if (variants.length > 0) {
    const { error: insertError } = await supabase
      .from('flavor_variants')
      .insert(
        variants.map((v) => ({
          product_id: productId,
          name: v.name,
          stock: v.stock,
        }))
      )

    if (insertError) {
      throw new Error(`Error creando variantes: ${insertError.message}`)
    }
  }
}

// ============================================================================
// ELIMINACIÓN DE PRODUCTOS
// ============================================================================

/**
 * Elimina un producto y todas sus variantes en cascada
 */
export async function deleteProduct(id: number): Promise<void> {
  const supabase = await createServerClient()

  // Las variantes se eliminan automáticamente por FK CASCADE
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Error eliminando producto: ${error.message}`)
  }
}

/**
 * Elimina una variante de cantidad
 */
export async function deleteQuantityVariant(id: number): Promise<void> {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('quantity_variants')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Error eliminando variante: ${error.message}`)
  }
}

/**
 * Elimina una variante de sabor
 */
export async function deleteFlavorVariant(id: number): Promise<void> {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('flavor_variants')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Error eliminando variante: ${error.message}`)
  }
}
// ============================================================================
// MANEJO DE IMÁGENES
// ============================================================================

/**
 * Sube una imagen de producto a Supabase Storage
 */
export async function uploadProductImageAction(
  file: File,
  productId: number
): Promise<string> {
  const supabase = await createServerClient()

  // Generar nombre de archivo único
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  const extension = file.name.split('.').pop()
  const filename = `product-${productId}-${timestamp}-${random}.${extension}`
  const filepath = `products/${productId}/${filename}`

  // Subir archivo
  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(filepath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    throw new Error(`Error subiendo imagen: ${error.message}`)
  }

  // Obtener URL pública
  const { data: publicUrlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(filepath)

  return publicUrlData.publicUrl
}
