import { Metadata } from "next"
import Hero from "@modules/home/components/hero"
import ShopByAge from "@modules/home/components/shop-by-age"
import ReviewMediaHub from "@modules/home/components/review-media-hub"
import WhyChooseUs from "@modules/home/components/why-choose-us"
import CategoryMarquee from "@modules/home/components/category-marquee"
import { listProducts } from "@lib/data/products"
import { listHomeBanners } from "@lib/data/home-banners"
import { Product } from "@/lib/supabase/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Toycker | Premium Toys for Kids",
  description: "Discover a wide range of premium toys for kids of all ages.",
}

export default async function Home() {
  const [products, banners] = await Promise.all([
    listProducts(),
    listHomeBanners()
  ])

  return (
    <>
      <Hero banners={banners} />
      <CategoryMarquee />
      <div className="py-12 px-6 max-w-[1440px] mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center text-slate-900">New Arrivals</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.slice(0, 4).map((product: Product) => (
            <LocalizedClientLink 
              key={product.id} 
              href={`/products/${product.handle}`}
              className="group block"
            >
              <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-4 relative">
                <img 
                  src={product.image_url || "/placeholder.png"} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h3 className="font-medium text-slate-900 group-hover:text-primary transition-colors">{product.name}</h3>
              <p className="text-slate-600 font-semibold mt-1">₹{product.price}</p>
            </LocalizedClientLink>
          ))}
        </div>
      </div>
      <ShopByAge />
      <ReviewMediaHub />
      <WhyChooseUs />
    </>
  )
}