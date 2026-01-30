import React from "react"

type CatalogGridSkeletonProps = {
    count?: number
}

const CatalogGridSkeleton = ({ count = 12 }: CatalogGridSkeletonProps) => {
    const items = Array.from({ length: count }, (_, index) => index)
    const block = "animate-pulse bg-slate-200"

    return (
        <div className="flex flex-wrap -mx-3">
            {items.map((item) => (
                <div key={`catalog-skeleton-${item}`} className="w-full sm:w-1/2 lg:w-1/3 xl:w-1/4 px-3 mb-6">
                    <div className="flex flex-col h-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        {/* Image skeleton - 4:3 aspect ratio */}
                        <div className="aspect-[4/3] w-full bg-slate-100">
                            <div className={`${block} h-full w-full`} />
                        </div>

                        {/* Content skeleton */}
                        <div className="flex flex-1 flex-col p-4 gap-3">
                            {/* Title */}
                            <div className={`${block} h-7 w-3/4 rounded-md`} />

                            {/* Button/Link placeholder */}
                            <div className="mt-auto pt-2">
                                <div className={`${block} h-5 w-32 rounded`} />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default CatalogGridSkeleton
