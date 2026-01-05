import HeroSkeleton from "@modules/common/components/skeleton/hero-skeleton"
import CategoryMarqueeSkeleton from "@modules/common/components/skeleton/category-marquee-skeleton"
import ProductGridSkeleton from "@modules/common/components/skeleton/product-grid-skeleton"

/**
 * Homepage Loading State
 * Displays skeleton UI that matches the homepage structure
 * Provides immediate visual feedback while content loads
 */
export default function Loading() {
    return (
        <>
            {/* Hero section skeleton */}
            <HeroSkeleton />

            {/* Category marquee skeleton */}
            <CategoryMarqueeSkeleton />

            {/* Popular Toy Set section skeleton */}
            <ProductGridSkeleton
                title="Explore"
                subtitle="Explore Popular Toy Set"
                count={10}
                className="bg-primary/10"
            />

            {/* Shop by Age section skeleton */}
            <section className="w-full py-10 md:py-16">
                <div className="mx-auto max-w-screen-2xl px-4">
                    <div className="text-center mb-8">
                        <div className="h-8 bg-gray-200 rounded animate-pulse w-48 mx-auto" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
                        ))}
                    </div>
                </div>
            </section>

            {/* Exclusive Collections section skeleton */}
            <section className="w-full py-10 md:py-16 bg-gray-50">
                <div className="mx-auto max-w-screen-2xl px-4">
                    <div className="text-center mb-8">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-20 mx-auto" />
                        <div className="mt-3 h-8 bg-gray-200 rounded animate-pulse w-64 mx-auto" />
                    </div>
                    <div className="flex gap-4 overflow-hidden">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex-shrink-0 w-64 aspect-[3/4] bg-gray-200 rounded-lg animate-pulse" />
                        ))}
                    </div>
                </div>
            </section>

            {/* Best Selling section skeleton */}
            <ProductGridSkeleton
                title="Curated"
                subtitle="Best Selling Picks"
                count={10}
                className="bg-white"
            />

            {/* Review section skeleton */}
            <section className="w-full py-10 md:py-16 bg-gray-50">
                <div className="mx-auto max-w-screen-2xl px-4">
                    <div className="text-center mb-8">
                        <div className="h-8 bg-gray-200 rounded animate-pulse w-48 mx-auto" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="aspect-video bg-gray-200 rounded-lg animate-pulse" />
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Choose Us section skeleton */}
            <section className="w-full py-10 md:py-16">
                <div className="mx-auto max-w-screen-2xl px-4">
                    <div className="text-center mb-8">
                        <div className="h-8 bg-gray-200 rounded animate-pulse w-48 mx-auto" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex flex-col items-center gap-4">
                                <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse" />
                                <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    )
}
