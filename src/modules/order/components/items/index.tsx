import repeat from "@lib/util/repeat"
import { Order } from "@/lib/supabase/types"

import Divider from "@modules/common/components/divider"
import Item from "@modules/order/components/item"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"

type ItemsProps = {
  order: Order
}

const Items = ({ order }: ItemsProps) => {
  const items = order.items

  return (
    <div className="flex flex-col">
      <table className="w-full">
        <tbody data-testid="products-table">
          {items?.length
            ? items
              .sort((a, b) => {
                const dateA = a.created_at || ""
                const dateB = b.created_at || ""
                return dateA > dateB ? -1 : 1
              })
              .map((item, index) => {
                return (
                  <Item
                    key={item.id || `${item.product_id}-${item.variant_id}-${index}`}
                    item={item}
                    currencyCode={order.currency_code}
                  />
                )
              })
            : repeat(5).map((i) => {
              return <SkeletonLineItem key={i} />
            })}
        </tbody>
      </table>
    </div>
  )
}

export default Items