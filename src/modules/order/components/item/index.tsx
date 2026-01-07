import { CartItem } from "@/lib/supabase/types"
import { Text } from "@modules/common/components/text"
import { convertToLocale } from "@lib/util/money"

type ItemProps = {
  item: CartItem
  currencyCode: string
}

const Item = ({ item, currencyCode }: ItemProps) => {
  return (
    <tr className="group border-b border-slate-50 last:border-0" data-testid="product-row">
      <td className="py-6 pl-6 sm:pl-10">
        <div className="flex gap-x-4 items-center">
          <div className="w-16 h-20 sm:w-20 sm:h-28 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm transition-transform group-hover:scale-105 border border-slate-100">
            {item.thumbnail ? (
              <img
                src={item.thumbnail}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                📦
              </div>
            )}
          </div>
          <div className="flex flex-col gap-y-1">
            <Text className="font-bold text-slate-900 leading-tight">
              {item.product_title || item.title}
            </Text>
            {item.variant?.title && (
              <Text className="text-xs sm:text-sm text-slate-500 font-medium">
                {item.variant.title}
              </Text>
            )}
            <Text className="text-xs sm:text-sm text-slate-400 font-bold uppercase tracking-tighter">
              Qty: {item.quantity}
            </Text>
          </div>
        </div>
      </td>
      <td className="py-6 pr-6 sm:pr-10 text-right align-middle">
        <Text className="font-black text-slate-900 text-lg">
          {convertToLocale({
            amount: item.total,
            currency_code: currencyCode,
          })}
        </Text>
      </td>
    </tr>
  )
}

export default Item