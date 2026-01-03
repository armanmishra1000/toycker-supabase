/**
 * ProductGridSkeleton - Loading placeholder for product grid sections
 * Displays animated skeleton cards that match the ProductPreview layout
 */

type ProductGridSkeletonProps = {
    title?: string
    subtitle?: string
    count?: number
    className?: string
}

const ProductCardSkeleton = () => (
    <div className="flex flex-col">
        {/* Image placeholder */}
        <div className="relative w-full aspect-square bg-gray-200 rounded-lg overflow-hidden">
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />
        </div>
        {/* Title placeholder */}
        <div className="mt-3 h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        {/* Price placeholder */}
        <div className="mt-2 h-5 bg-gray-200 rounded animate-pulse w-1/3" />
    </div>
)

export default function ProductGridSkeleton({
    title,
    subtitle,
    count = 10,
    className = "",
}: ProductGridSkeletonProps) {
    return (
        <section className={`w-full ${className}`}>
            <div className="mx-auto max-w-screen-2xl px-4 py-10 md:py-16">
                {/* Header skeleton */}
                {(title || subtitle) && (
                    <header className="mx-auto max-w-3xl text-center mb-10">
                        {title ? (
                            <>
                                <div className="h-4 bg-gray-200 rounded animate-pulse w-20 mx-auto" />
                                <div className="mt-3 h-8 bg-gray-200 rounded animate-pulse w-64 mx-auto" />
                            </>
                        ) : (
                            <div className="h-8 bg-gray-200 rounded animate-pulse w-48 mx-auto" />
                        )}
                        {subtitle && (
                            <div className="mt-3 h-4 bg-gray-200 rounded animate-pulse w-96 mx-auto max-w-full" />
                        )}
                    </header>
                )}

                {/* Product grid skeleton */}
                <ul className="grid gap-6 grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                    {Array.from({ length: count }).map((_, index) => (
                        <li key={index}>
                            <ProductCardSkeleton />
                        </li>
                    ))}
                </ul>

                {/* Load more button skeleton */}
                <div className="mt-10 text-center">
                    <div className="inline-block h-10 w-32 bg-gray-200 rounded-full animate-pulse" />
                </div>
            </div>
        </section>
    )
}
