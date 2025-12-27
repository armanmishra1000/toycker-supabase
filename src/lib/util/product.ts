import { Product } from "@/lib/supabase/types"

export const isSimpleProduct = (product: Product) => {
  return (product.variants?.length || 0) <= 1 && (product.options?.length || 0) === 0
}