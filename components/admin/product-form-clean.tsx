'use client'

import type React from 'react'
import { useState, useCallback, memo } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, X, Trash2, Save, Plus, Upload, Image as ImageIcon } from 'lucide-react'
import type { AdminProductWithVariants, QuantityVariant, FlavorVariant } from '@/types/admin'
import { ADMIN_CATEGORIES, ADMIN_STOCK_OPTIONS } from '@/types/admin'

interface ProductFormProps {
  product: AdminProductWithVariants
  isNew: boolean
  isLoading?: boolean
  error?: string | null
  onClose: () => void
  onSave: (
    product: AdminProductWithVariants,
    quantityVariants?: QuantityVariant[],
    flavorVariants?: FlavorVariant[]
  ) => Promise<void> | void
  onDelete?: (productId: number) => Promise<void> | void
}

/**
 * Formulario de producto completamente presentacional
 * - Solo renderiza UI
 * - Maneja estado local del formulario
 * - Llama a callbacks para operaciones
 * - Sin dependencias de datos externos
 */
const ProductForm = memo(function ProductForm({
  product,
  isNew,
  isLoading,
  error,
  onClose,
  onSave,
  onDelete,
}: ProductFormProps) {
  const [formData, setFormData] = useState<AdminProductWithVariants>(product)
  const [quantityVariants, setQuantityVariants] = useState<QuantityVariant[]>(
    product.quantity_variants || []
  )
  const [flavorVariants, setFlavorVariants] = useState<FlavorVariant[]>(
    product.flavor_variants || []
  )
  const [images, setImages] = useState<string[]>(product.images || [])
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  // Validación básica del formulario
  const validateForm = useCallback(() => {
    if (!formData.name?.trim()) {
      setLocalError('El nombre es requerido')
      return false
    }
    if (!formData.slug?.trim()) {
      setLocalError('El slug es requerido')
      return false
    }
    if (!formData.price || formData.price <= 0) {
      setLocalError('El precio debe ser mayor a 0')
      return false
    }
    if (!formData.category) {
      setLocalError('Debe seleccionar una categoría')
      return false
    }
    setLocalError(null)
    return true
  }, [formData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      // Si hay imágenes y no hay imagen principal, usar la primera
      const dataToSave = {
        ...formData,
        images,
        image: formData.image || images[0] || null,
      }
      await onSave(dataToSave, quantityVariants, flavorVariants)
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !files.length) return

    // Validar que el producto tenga ID
    if (!product.id || product.id === 0) {
      setUploadError('El producto debe ser guardado primero antes de subir imágenes')
      return
    }

    setIsUploadingImages(true)
    setUploadError(null)

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('productId', String(product.id))

        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (!data || typeof data !== 'object') {
          throw new Error('Invalid response from server')
        }

        if (data.error) {
          throw new Error(data.error)
        }

        if (!data.url) {
          throw new Error('No URL returned from server')
        }

        return data.url
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      setImages((prev: string[]) => [...prev, ...uploadedUrls])

      // Limpiar input
      e.target.value = ''
    } catch (err) {
      console.error('Upload error:', err)
      setUploadError(err instanceof Error ? err.message : 'Error subiendo imágenes')
    } finally {
      setIsUploadingImages(false)
    }
  }, [product.id])

  const handleRemoveImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleAddQuantityVariant = useCallback(() => {
    const newVariant: QuantityVariant = {
      id: Date.now(),
      product_id: product.id,
      min_quantity: 1,
      max_quantity: undefined,
      price: formData.price || 0,
    }
    setQuantityVariants((prev) => [...prev, newVariant])
  }, [formData.price, product.id])

  const handleRemoveQuantityVariant = useCallback((index: number) => {
    setQuantityVariants((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleAddFlavorVariant = useCallback(() => {
    const newVariant: FlavorVariant = {
      id: Date.now(),
      product_id: product.id,
      name: '',
      stock: 'high',
    }
    setFlavorVariants((prev) => [...prev, newVariant])
  }, [product.id])

  const handleRemoveFlavorVariant = useCallback((index: number) => {
    setFlavorVariants((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleQuantityVariantChange = useCallback(
    (index: number, field: keyof QuantityVariant, value: any) => {
      setQuantityVariants((prev) => {
        const updated = [...prev]
        updated[index] = { ...updated[index], [field]: value }
        return updated
      })
    },
    []
  )

  const handleFlavorVariantChange = useCallback(
    (index: number, field: keyof FlavorVariant, value: any) => {
      setFlavorVariants((prev) => {
        const updated = [...prev]
        updated[index] = { ...updated[index], [field]: value }
        return updated
      })
    },
    []
  )

  return (
    <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto p-4">
      <div className="mx-auto max-w-4xl py-8">
        <Card className="relative">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute right-4 top-4 rounded-md p-1 hover:bg-muted disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>

          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            {/* Title */}
            <div>
              <h2 className="text-xl font-bold">
                {isNew ? 'Nuevo Producto' : `Editar: ${product.name}`}
              </h2>
            </div>

            {/* Error Message */}
            {(error || localError) && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                {error || localError}
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-semibold">Información Básica</h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, name: e.target.value }))
                    }
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, slug: e.target.value }))
                    }
                    disabled={isLoading}
                    placeholder="producto-slug"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Precio *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        price: parseFloat(e.target.value) || 0,
                      }))
                    }
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoría *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData((p) => ({ ...p, category: value }))
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ADMIN_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Select
                    value={formData.stock || 'high'}
                    onValueChange={(value) =>
                      setFormData((p) => ({
                        ...p,
                        stock: value as any,
                      }))
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger id="stock">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ADMIN_STOCK_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, description: e.target.value }))
                  }
                  disabled={isLoading}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_description">Descripción Completa</Label>
                <Textarea
                  id="full_description"
                  value={formData.full_description || ''}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      full_description: e.target.value,
                    }))
                  }
                  disabled={isLoading}
                  rows={4}
                />
              </div>

              {/* Image Preview */}
              {formData.image && (
                <div className="space-y-2">
                  <Label>Imagen Principal</Label>
                  <div className="relative h-40 w-40 overflow-hidden rounded-md bg-muted">
                    <Image
                      src={formData.image}
                      alt="preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData((p) => ({ ...p, image: null }))}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Quitar imagen principal
                  </Button>
                </div>
              )}

              {/* Multiple Images Upload */}
              <div className="space-y-2 border-t pt-4">
                <Label>Imágenes del Producto</Label>
                <p className="text-sm text-muted-foreground">
                  Sube múltiples imágenes para mostrar diferentes vistas del producto
                </p>

                {/* Upload Error */}
                {uploadError && (
                  <div className="rounded-md bg-red-50 p-2 text-sm text-red-800">
                    {uploadError}
                  </div>
                )}

                {/* File Input */}
                <div className="relative">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isLoading || isUploadingImages || !formData.id}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isLoading || isUploadingImages || !formData.id}
                      className="w-full cursor-pointer gap-2"
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      {isUploadingImages ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Seleccionar Imágenes
                        </>
                      )}
                    </Button>
                  </label>
                </div>

                {!formData.id && (
                  <p className="text-xs text-amber-600">
                    💡 Primero debes crear o cargar un producto para subir imágenes
                  </p>
                )}

                {/* Images Grid */}
                {images.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Imágenes subidas</p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {images.map((imageUrl, index) => (
                        <div
                          key={index}
                          className="group relative aspect-square overflow-hidden rounded-lg border border-muted bg-muted"
                        >
                          <Image
                            src={imageUrl}
                            alt={`Imagen ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                            {formData.image !== imageUrl && (
                              <button
                                type="button"
                                onClick={() => setFormData((p) => ({ ...p, image: imageUrl }))}
                                title="Establecer como imagen principal"
                                className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                              >
                                Principal
                              </button>
                            )}
                            {formData.image === imageUrl && (
                              <span className="bg-green-500 text-white px-2 py-1 rounded text-xs">
                                ✓ Principal
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              disabled={isLoading || isUploadingImages}
                              title="Eliminar imagen"
                              className="bg-red-500 hover:bg-red-600 text-white p-1 rounded"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quantity Variants */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Variantes de Cantidad</h3>
                  <p className="text-sm text-muted-foreground">
                    Define precios por rango de cantidad
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddQuantityVariant}
                  disabled={isLoading}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Agregar
                </Button>
              </div>

              <div className="space-y-3">
                {quantityVariants.map((variant, idx) => (
                  <div
                    key={variant.id}
                    className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-end"
                  >
                    <div className="flex-1 space-y-2">
                      <Label htmlFor={`qty_min_${idx}`} className="text-xs">
                        Cantidad Mínima
                      </Label>
                      <Input
                        id={`qty_min_${idx}`}
                        type="number"
                        min="1"
                        value={variant.min_quantity}
                        onChange={(e) =>
                          handleQuantityVariantChange(
                            idx,
                            'min_quantity',
                            parseInt(e.target.value) || 1
                          )
                        }
                        disabled={isLoading}
                      />
                    </div>

                    <div className="flex-1 space-y-2">
                      <Label htmlFor={`qty_max_${idx}`} className="text-xs">
                        Cantidad Máxima (opcional)
                      </Label>
                      <Input
                        id={`qty_max_${idx}`}
                        type="number"
                        min="1"
                        value={variant.max_quantity || ''}
                        onChange={(e) =>
                          handleQuantityVariantChange(
                            idx,
                            'max_quantity',
                            e.target.value ? parseInt(e.target.value) : null
                          )
                        }
                        disabled={isLoading}
                        placeholder="Sin límite"
                      />
                    </div>

                    <div className="flex-1 space-y-2">
                      <Label htmlFor={`qty_price_${idx}`} className="text-xs">
                        Precio
                      </Label>
                      <Input
                        id={`qty_price_${idx}`}
                        type="number"
                        step="0.01"
                        min="0"
                        value={variant.price}
                        onChange={(e) =>
                          handleQuantityVariantChange(
                            idx,
                            'price',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        disabled={isLoading}
                      />
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveQuantityVariant(idx)}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Flavor Variants */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Variantes de Sabor</h3>
                  <p className="text-sm text-muted-foreground">
                    Define diferentes sabores/opciones disponibles
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddFlavorVariant}
                  disabled={isLoading}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Agregar
                </Button>
              </div>

              <div className="space-y-3">
                {flavorVariants.map((variant, idx) => (
                  <div
                    key={variant.id}
                    className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-end"
                  >
                    <div className="flex-1 space-y-2">
                      <Label htmlFor={`flavor_name_${idx}`} className="text-xs">
                        Nombre del Sabor
                      </Label>
                      <Input
                        id={`flavor_name_${idx}`}
                        value={variant.name}
                        onChange={(e) =>
                          handleFlavorVariantChange(idx, 'name', e.target.value)
                        }
                        disabled={isLoading}
                        placeholder="Ej: Chocolate"
                      />
                    </div>

                    <div className="flex-1 space-y-2">
                      <Label htmlFor={`flavor_stock_${idx}`} className="text-xs">
                        Stock
                      </Label>
                      <Select
                        value={variant.stock || 'high'}
                        onValueChange={(value) =>
                          handleFlavorVariantChange(idx, 'stock', value)
                        }
                        disabled={isLoading}
                      >
                        <SelectTrigger id={`flavor_stock_${idx}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ADMIN_STOCK_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveFlavorVariant(idx)}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:justify-between">
              <div className="flex gap-2">
                {!isNew && onDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      if (confirm('¿Está seguro que desea eliminar este producto?')) {
                        onDelete(product.id)
                      }
                    }}
                    disabled={isLoading}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="gap-2"
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isNew ? 'Crear' : 'Guardar'}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
})

export { ProductForm }
