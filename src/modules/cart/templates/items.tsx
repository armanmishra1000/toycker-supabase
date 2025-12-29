import repeat from "@lib/util/repeat"
import { Text } from "@modules/common/components/text"
import Item from "@modules/cart/components/item"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"
import { Cart, CartItem } from "@/lib/supabase/types"
import { ShoppingBag } from "lucide-react"

type ItemsTemplateProps = {
  cart: Cart | null
}

const ItemsTemplate = ({ cart }: ItemsTemplateProps) => {
  const items = cart?.items
  const itemCount = items?.length || 0
  const currencyCode = cart?.currency_code || "INR"

  return (
    <div>
      {/* Header with item count */}
      <div className="pb-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <Text as="h1" weight="bold" className="text-xl lg:text-2xl text-slate-900">
              Your Cart
            </Text>
            <p className="text-sm text-slate-500">
              {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
            </p>
          </div>
        </div>
      </div>

      {/* Table Header - Desktop Only */}
      <div className="hidden lg:grid grid-cols-[1fr_100px_120px_100px] gap-4 py-3 mt-4 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
        <div>Product</div>
        <div className="text-center">Quantity</div>
        <div className="text-right">Price</div>
        <div className="text-right">Total</div>
      </div>

      {/* Cart Items */}
      <div className="divide-y divide-slate-100">
        {items
          ? items
            .sort((a: CartItem, b: CartItem) => {
              return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
            })
            .map((item: CartItem) => {
              return (
                <Item
                  key={item.id}
                  item={item}
                  currencyCode={currencyCode}
                />
              )
            })
          : repeat(3).map((i) => {
            return <SkeletonLineItem key={i} />
          })}
      </div>
    </div>
  )
}

export default ItemsTemplate