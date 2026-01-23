import { type Product, featuredProducts } from "./featured-products"

// Productos en oferta - seleccionamos 10 productos manualmente
// Puedes cambiar estos IDs por los productos que quieras mostrar en ofertas
export const ofertasProducts: Product[] = [
  featuredProducts.find((p) => p.slug === "aceite-karseell-100-original"),
  featuredProducts.find((p) => p.slug === "combo-karseell"),
  featuredProducts.find((p) => p.slug === "jbl-go4-original"),
  featuredProducts.find((p) => p.slug === "apple-watch-serie-10"),
  featuredProducts.find((p) => p.slug === "natural-jade-beauty-roller"),
  featuredProducts.find((p) => p.slug === "fundas-silicone-case"),
  featuredProducts.find((p) => p.slug === "funda-silicone-case-iphone-17"),
  featuredProducts.find((p) => p.slug === "cubre-camara-con-strass"),
  featuredProducts.find((p) => p.slug === "cubre-camara-sin-strass"),
  featuredProducts.find((p) => p.slug === "cubre-camara-sin-strass-iphone-17"),
].filter(Boolean) as Product[]
