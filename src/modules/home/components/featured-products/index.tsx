import { Collection, Region } from "@/lib/supabase/types"
import ProductRail from "@modules/home/components/featured-products/product-rail"

export default async function FeaturedProducts({
  collections,
  region,
  clubDiscountPercentage,
}: {
  collections: Collection[]
  region: Region
  clubDiscountPercentage?: number
}) {
  return collections.map((collection) => (
    <li key={collection.id}>
      <ProductRail
        collection={collection}
        region={region}
        clubDiscountPercentage={clubDiscountPercentage}
      />
    </li>
  ))
}