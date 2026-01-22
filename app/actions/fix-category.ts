'use server'

import { createServerClient } from '@/lib/supabase/server'
import { allCategories } from '@/lib/categories'

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

/**
 * Migra todos los productos con categoría antigua "accesorios-celular"
 * a la categoría nueva "Accesorios para celular"
 */
export async function fixCategoryMigration() {
  const supabase = await createServerClient()

  try {
    // Actualizar todos los productos con la categoría antigua
    const { data, error } = await supabase
      .from('products')
      .update({ category: 'Accesorios para celular' })
      .eq('category', 'accesorios-celular')
      .select()

    if (error) {
      return {
        success: false,
        error: error.message,
        updated: 0,
      }
    }

    console.log(`[FIX_CATEGORY] Migrados ${data?.length || 0} productos`)

    return {
      success: true,
      message: `Se actualizaron ${data?.length || 0} productos de "accesorios-celular" a "Accesorios para celular"`,
      updated: data?.length || 0,
      products: data?.map((p: any) => ({ id: p.id, name: p.name, slug: p.slug })) || [],
    }
  } catch (error) {
    console.error('[FIX_CATEGORY] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      updated: 0,
    }
  }
}
