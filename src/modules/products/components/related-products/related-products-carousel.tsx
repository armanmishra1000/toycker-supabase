"use client"

import React, { ReactNode } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { Product as SupabaseProduct } from "@/lib/supabase/types"
import ProductPreview from "../product-preview"

type RelatedProductsCarouselProps = {
    products: SupabaseProduct[]
    clubDiscountPercentage?: number
}

const RelatedProductsCarousel = ({
    products,
    clubDiscountPercentage,
}: RelatedProductsCarouselProps) => {
    const [emblaRef] = useEmblaCarousel({
        align: "start",
        containScroll: "trimSnaps",
        dragFree: true,
        breakpoints: {
            "(min-width: 1024px)": { active: false },
        },
    })

    return (
        <div className="overflow-hidden md:overflow-visible" ref={emblaRef}>
            <div className="flex md:grid md:grid-cols-4 md:gap-x-6 md:gap-y-8 -ml-4 md:ml-0">
                {products.map((p) => (
                    <div
                        key={p.id}
                        className="flex-[0_0_80%] small:flex-[0_0_45%] min-w-0 pl-4 md:pl-0 md:flex-none"
                    >
                        <ProductPreview
                            product={p}
                            clubDiscountPercentage={clubDiscountPercentage}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}

export default RelatedProductsCarousel
