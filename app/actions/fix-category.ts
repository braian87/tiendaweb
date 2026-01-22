'use server'

import { createServerClient } from '@/lib/supabase/server'

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
