"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { ChevronRight, Minus, Plus, AlertCircle, PackageCheck, ShieldCheck, ArrowLeftRight, Truck } from "lucide-react"
import WhatsAppButton from "./whatsapp-button"
import { useCart } from "@/lib/cart-context"
import { getCategorySlug } from "@/lib/utils/category-slug"
import { getProductsByCategory } from "@/app/actions/product-crud"

interface ProductDetailProps {
  product: any
  relatedProducts?: any[]
}

function getStockInfo(stock?: "out" | "low" | "medium" | "high") {
  const stockConfig = {
    out: {
      label: "Sin stock",
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
      available: false,
    },
    low: {
      label: "Últimas unidades",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/20",
      available: true,
    },
    medium: {
      label: "Stock limitado",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/20",
      available: true,
    },
    high: {
      label: "En stock",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
      available: true,
    },
  }

  return stockConfig[stock || "high"]
}

export default function ProductDetail({ product, relatedProducts = [] }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedQuantityVariant, setSelectedQuantityVariant] = useState<string>("")
  const [selectedFlavorVariant, setSelectedFlavorVariant] = useState<string>("")
  const [displayPrice, setDisplayPrice] = useState(product.price)
  const { addItem } = useCart()
  const router = useRouter()
  const pathname = usePathname()

  const hasQuantityVariants = product.quantityVariants && product.quantityVariants.length > 0
  const hasFlavorVariants = product.flavorVariants && product.flavorVariants.length > 0

  useEffect(() => {
    setDisplayPrice(product.price)
    setSelectedQuantityVariant("")
    setSelectedFlavorVariant("")
    setQuantity(1)
  }, [product])

  const images = product.images || [product.image]
  const totalImages = images.length

  const categorySlug = getCategorySlug(product.category)
  const categoryUrl = `/categoria/${categorySlug}`

  const stockInfo = getStockInfo(product.stock)

  const handleQuantityDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const handleQuantityIncrease = () => {
    setQuantity(quantity + 1)
  }

  const handleQuantityVariantSelect = (variantIndex: string) => {
    setSelectedQuantityVariant(variantIndex)

    if (variantIndex && product.quantityVariants) {
      const variant = product.quantityVariants[Number.parseInt(variantIndex)]
      if (variant) {
        setDisplayPrice(variant.price)
      }
    } else {
      setDisplayPrice(product.price)
    }
  }

  const handleAddToCart = () => {
    let variantInfo = ""
    let priceToUse = product.price

    if (hasQuantityVariants && selectedQuantityVariant) {
      const variant = product.quantityVariants![Number.parseInt(selectedQuantityVariant)]
      if (variant) {
        const rangeText = variant.max_quantity ? `${variant.min_quantity} a ${variant.max_quantity} unidades` : `${variant.min_quantity}+ unidades`
        variantInfo = rangeText
        priceToUse = variant.price
      }
    }

    if (hasFlavorVariants && selectedFlavorVariant) {
      const variant = product.flavorVariants!.find((v: any) => v.id === selectedFlavorVariant)
      if (variant) {
        variantInfo = variantInfo ? `${variantInfo} - ${variant.name}` : variant.name
      }
    }

    const uniqueId = variantInfo ? `${product.id}-${variantInfo}` : product.id.toString()

    addItem({
      id: uniqueId,
      name: product.name,
      price: priceToUse,
      quantity: hasQuantityVariants ? 1 : quantity,
      image: product.image,
      slug: product.slug,
      variant: variantInfo,
    })
    router.push(`/carrito?from=${encodeURIComponent(pathname)}`)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        <nav className="flex items-center gap-2 text-sm mb-8 md:mb-12">
          <Link href="/" className="text-black/40 hover:text-black transition-colors">
            Inicio
          </Link>
          <ChevronRight className="w-3 h-3 text-black/30" />
          <Link href={categoryUrl} className="text-black/40 hover:text-black transition-colors">
            {product.category}
          </Link>
          <ChevronRight className="w-3 h-3 text-black/30" />
          <span className="text-black/60 truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Product Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          <div className="flex flex-col gap-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-black/[0.02] rounded-2xl overflow-hidden">
              {totalImages > 1 && (
                <div className="absolute top-4 right-4 bg-black/80 text-white px-3 py-1.5 rounded-full text-xs font-medium z-10">
                  {currentImageIndex + 1} / {totalImages}
                </div>
              )}
              <Image
                src={images[currentImageIndex] || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-contain p-4"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={currentImageIndex === 0}
                quality={90}
              />
            </div>

            {totalImages > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((image: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden transition-all duration-200 ${
                      currentImageIndex === index ? "ring-2 ring-black ring-offset-2" : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`${product.name} - Vista ${index + 1}`}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full w-fit mb-4 ${stockInfo.bgColor}`}>
              {stockInfo.available ? (
                <PackageCheck className={`w-4 h-4 ${stockInfo.color}`} />
              ) : (
                <AlertCircle className={`w-4 h-4 ${stockInfo.color}`} />
              )}
              <span className={`text-sm font-medium ${stockInfo.color}`}>{stockInfo.label}</span>
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-black mb-6 leading-tight">{product.name}</h1>

            <div className="mb-8">
              <p className="text-4xl md:text-5xl font-bold text-black tracking-tight">
                ${displayPrice.toLocaleString("es-AR")}
              </p>
            </div>

            {stockInfo.available ? (
              <>
                {hasFlavorVariants && (
                  <div className="mb-6">
                    <label className="block text-xs font-semibold text-black/50 uppercase tracking-wider mb-2">
                      Sabor
                    </label>
                    <select
                      value={selectedFlavorVariant}
                      onChange={(e) => setSelectedFlavorVariant(e.target.value)}
                      className="w-full border border-black/10 rounded-xl px-4 py-3 text-black bg-white focus:outline-none focus:ring-2 focus:ring-black/20 transition-all"
                    >
                      <option value="">Selecciona el sabor</option>
                      {product.flavorVariants!.map((variant: any) => {
                        const flavorStockInfo = getStockInfo(variant.stock)
                        return (
                          <option key={variant.id} value={variant.id} disabled={variant.stock === "out"}>
                            {variant.name} - {flavorStockInfo.label}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                )}

                {hasQuantityVariants && (
                  <div className="mb-6">
                    <label className="block text-xs font-semibold text-black/50 uppercase tracking-wider mb-2">
                      Cantidad
                    </label>
                    <select
                      value={selectedQuantityVariant}
                      onChange={(e) => handleQuantityVariantSelect(e.target.value)}
                      className="w-full border border-black/10 rounded-xl px-4 py-3 text-black bg-white focus:outline-none focus:ring-2 focus:ring-black/20 transition-all"
                    >
                      <option value="">Selecciona la cantidad</option>
                      {product.quantityVariants!.map((variant: any, index: number) => {
                        const rangeText = variant.max_quantity
                          ? `${variant.min_quantity} a ${variant.max_quantity} unidades`
                          : `${variant.min_quantity}+ unidades`
                        return (
                          <option key={index} value={index.toString()}>
                            {rangeText} - ${variant.price.toLocaleString("es-AR")}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                )}

                {!hasQuantityVariants && !hasFlavorVariants && (
                  <div className="mb-6">
                    <label className="block text-xs font-semibold text-black/50 uppercase tracking-wider mb-2">
                      Unidades
                    </label>
                    <div className="flex items-center gap-1 bg-black/5 rounded-xl p-1 w-fit">
                      <button
                        onClick={handleQuantityDecrease}
                        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white transition-colors text-black"
                        aria-label="Disminuir cantidad"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-lg font-semibold w-12 text-center text-black">{quantity}</span>
                      <button
                        onClick={handleQuantityIncrease}
                        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white transition-colors text-black"
                        aria-label="Aumentar cantidad"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleAddToCart}
                  className="w-full bg-black text-white py-4 rounded-xl font-semibold text-lg hover:bg-black/90 transition-all duration-200 mb-8"
                >
                  Agregar al carrito
                </button>
              </>
            ) : (
              <div className="mb-8">
                <WhatsAppButton
                  message={`Hola, estoy interesado en el producto: ${product.name}. Quisiera consultar sobre su disponibilidad.`}
                  className="w-full"
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 mb-8">
              <div className="flex items-center gap-4 p-4 bg-black/[0.02] rounded-2xl group hover:bg-black/[0.04] transition-colors">
                <div className="w-11 h-11 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-black">Compra protegida</p>
                  <p className="text-xs text-black/50">Tu compra 100% segura</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-black/[0.02] rounded-2xl group hover:bg-black/[0.04] transition-colors">
                <div className="w-11 h-11 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
                  <ArrowLeftRight className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-black">Cambios gratis</p>
                  <p className="text-xs text-black/50">Hasta 30 días después</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-black/[0.02] rounded-2xl group hover:bg-black/[0.04] transition-colors">
                <div className="w-11 h-11 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-black">Envío rápido</p>
                  <p className="text-xs text-black/50">A todo el país</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="border-t border-black/5 pt-6 mt-4">
                <h2 className="text-xs font-semibold text-black/50 uppercase tracking-wider mb-3">Descripción</h2>
                <p className="text-black/70 leading-relaxed">{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="bg-black/[0.02] py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl md:text-3xl font-bold text-black mb-8">También te puede interesar</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  href={`/categoria/${getCategorySlug(relatedProduct.category)}/${relatedProduct.slug}`}
                  prefetch={false}
                  className="group bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
                >
                  <div className="aspect-square bg-black/[0.02] overflow-hidden relative">
                    <img
                      src={relatedProduct.image || "/placeholder.svg"}
                      alt={relatedProduct.name}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-black mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {relatedProduct.name}
                    </h3>
                    <p className="text-lg font-bold text-black">
                      ${relatedProduct.price?.toLocaleString("es-AR") || "0"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <WhatsAppButton />
    </div>
  )
}
