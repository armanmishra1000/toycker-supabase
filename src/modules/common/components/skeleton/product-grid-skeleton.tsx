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

export const ProductCardSkeleton = () => {
    const block = "animate-pulse bg-slate-200"

    return (
        <div className="group relative flex flex-col h-full">
            {/* Image container - matches exact styling from product card */}
            <div className="relative w-full aspect-square overflow-hidden rounded-2xl bg-gray-100">
                <div className={`${block} h-full w-full rounded-2xl`} />

                {/* Wishlist button placeholder (top right) - shows on hover */}
                <div className="absolute right-3 top-3 h-10 w-10 rounded-full bg-white/30 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block"></div>

                {/* Hover overlay placeholder */}
                <div className="absolute inset-0 rounded-2xl bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                {/* Hover action button placeholder (bottom) */}
                <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                    <div className={`${block} h-12 w-full rounded-full bg-white/80`} />
                </div>
            </div>

            {/* Product details - matches actual card spacing */}
            <div className="flex flex-col gap-1 mt-3 flex-1">
                {/* Product title */}
                <div className={`${block} h-5 w-4/5 rounded`} />

                {/* Price section - matches actual layout */}
                <div className="mt-auto space-y-1.5 pt-2">
                    {/* Current price and original price row */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Current price */}
                        <div className={`${block} h-6 w-20 rounded`} />
                        {/* Original price (strikethrough) */}
                        <div className={`${block} h-5 w-20 rounded opacity-50`} />
                        {/* Discount badge */}
                        <div className={`${block} h-5 w-16 rounded-full`} />
                    </div>

                    {/* Club price */}
                    <div className={`${block} h-5 w-32 rounded`} />
                </div>
            </div>
        </div>
    )
}

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
                <ul className="grid gap-6 lg:grid-cols-4 xl:grid-cols-5">
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
