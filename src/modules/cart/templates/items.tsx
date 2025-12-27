import repeat from "@lib/util/repeat"
import { Text } from "@modules/common/components/text"

import Item from "@modules/cart/components/item"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"

type ItemsTemplateProps = {
  cart?: any
}

const ItemsTemplate = ({ cart }: ItemsTemplateProps) => {
  const items = cart?.items
  return (
    <div>
      <div className="pb-3 flex items-center">
        <Text as="h1" weight="bold" className="text-[2rem] leading-[2.75rem]">Cart</Text>
      </div>
      <div className="w-full">
        <div className="border-t-0 grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 py-2 text-gray-500 font-semibold text-sm">
          <div className="!pl-0">Item</div>
          <div></div>
          <div>Quantity</div>
          <div className="hidden small:block">
            Price
          </div>
          <div className="!pr-0 text-right">
            Total
          </div>
        </div>
        <div>
          {items
            ? items
                .sort((a: any, b: any) => {
                  return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
                })
                .map((item: any) => {
                  return (
                    <Item
                      key={item.id}
                      item={item}
                      currencyCode={cart?.currency_code}
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

export default ItemsTemplate