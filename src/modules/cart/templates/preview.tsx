"use client"

import repeat from "@lib/util/repeat"
import { Cart } from "@/lib/supabase/types"
import { cn } from "@lib/util/cn"

import PreviewItem from "@modules/cart/components/preview-item"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"

type ItemsTemplateProps = {
  cart: Cart
}

const ItemsPreviewTemplate = ({ cart }: ItemsTemplateProps) => {
  const items = cart?.items
  const hasOverflow = items && items.length > 4

  return (
    <div
      className={cn({
        "overflow-y-auto no-scrollbar max-h-[420px]":
          hasOverflow,
      })}
    >
      <div className="w-full">
        <div data-testid="items-table">
          {items
            ? items
                .sort((a, b) => {
                  return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
                })
                .map((item) => {
                  return (
                    <PreviewItem
                      key={item.id}
                      item={item}
                      currencyCode={cart.currency_code}
                    />
                  )
                })
            : repeat(5).map((i) => {
                return <SkeletonLineItem key={i} />
              })}
        </div>
      </div>
    </div>
  )
}

export default ItemsPreviewTemplate