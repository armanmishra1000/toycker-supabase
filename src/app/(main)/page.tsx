import { Metadata } from "next"
import Hero from "@modules/home/components/hero"
import ShopByAge from "@modules/home/components/shop-by-age"
import ReviewMediaHub from "@modules/home/components/review-media-hub"
import WhyChooseUs from "@modules/home/components/why-choose-us"
import CategoryMarquee from "@modules/home/components/category-marquee"
import { listProducts } from "@lib/data/products"
import { Product } from "@/lib/supabase/types"

export const metadata: Metadata = {
  title: "Toycker | Premium Toys for Kids",
  description: "Discover a wide range of premium toys for kids of all ages.",
}

export default async function Home() {
  const products: Product[] = await listProducts()

  return (
    <>
      <Hero banners={[]} />
      <CategoryMarquee />
      <div className="py-12 px-6">
        <h2 className="text-3xl font-bold mb-8 text-center">New Arrivals</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.slice(0, 4).map((product: Product) => (
            <div key={product.id} className="group">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                <img 
                  src={product.image_url || "/placeholder.png"} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <h3 className="font-medium">{product.name}</h3>
              <p className="text-gray-600">₹{product.price}</p>
            </div>
          ))}
        </div>
      </div>
      <ShopByAge />
      <ReviewMediaHub />
      <WhyChooseUs />
    </>
  )
}