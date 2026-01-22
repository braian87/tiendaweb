import { slugify } from "./slugify"
import { allCategories } from "@/lib/categories"

export function getCategorySlug(categoryName: string): string {
  // Try to find the category by name (case-insensitive)
  let category = allCategories.find(
    cat => cat.name.toLowerCase() === categoryName.toLowerCase()
  )
  
  // If not found by name, try by ID (para compatibilidad con datos viejos)
  if (!category) {
    category = allCategories.find(
      cat => cat.id.toLowerCase() === categoryName.toLowerCase()
    )
  }
  
  // If found, use the ID (which is already a slug)
  if (category) {
    return category.id
  }
  
  // Fallback: slugify the name if not found
  return slugify(categoryName)
}
