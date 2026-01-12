import { useMemo } from "react"
import { Package, Clock, CheckCircle2, Truck } from "lucide-react"

import Thumbnail from "@modules/products/components/thumbnail"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { Order } from "@/lib/supabase/types"
import { cn } from "@lib/util/cn"

type OrderCardProps = {
  order: Order
}

const OrderCard = ({ order }: OrderCardProps) => {
  const numberOfLines = useMemo(() => {
    return (
      order.items?.reduce((acc, item) => {
        return acc + item.quantity
      }, 0) ?? 0
    )
  }, [order])

  const numberOfProducts = useMemo(() => {
    return order.items?.length ?? 0
  }, [order])

  // Get order status
  const getStatusInfo = () => {
    const status = order.fulfillment_status || order.status || "pending"
    switch (status.toLowerCase()) {
      case "fulfilled":
      case "delivered":
        return {
          label: "Delivered",
          icon: CheckCircle2,
          bgColor: "bg-green-50",
          textColor: "text-green-700",
          iconColor: "text-green-600",
        }
      case "shipped":
        return {
          label: "Shipped",
          icon: Truck,
          bgColor: "bg-blue-50",
          textColor: "text-blue-700",
          iconColor: "text-blue-600",
        }
      case "pending":
      case "not_fulfilled":
        return {
          label: "Processing",
          icon: Clock,
          bgColor: "bg-amber-50",
          textColor: "text-amber-700",
          iconColor: "text-amber-600",
        }
      default:
        return {
          label: "Processing",
          icon: Package,
          bgColor: "bg-gray-50",
          textColor: "text-gray-700",
          iconColor: "text-gray-600",
        }
    }
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
      data-testid="order-card"
    >
      {/* Header - Order ID and Status */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Order</p>
          <p className="text-lg font-semibold text-gray-900">
            #<span data-testid="order-display-id">{order.display_id}</span>
          </p>
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
            statusInfo.bgColor,
            statusInfo.textColor
          )}
        >
          <StatusIcon className={cn("h-4 w-4", statusInfo.iconColor)} />
          <span>{statusInfo.label}</span>
        </div>
      </div>

      {/* Product Grid - Square thumbnails to prevent cutoff */}
      <div className="mb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
          {order.items?.slice(0, 4).map((i: any, _idx: number) => (
            <div
              key={i.id}
              className="flex-shrink-0 group"
              data-testid="order-item"
            >
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <Thumbnail
                  thumbnail={i.thumbnail}
                  images={[]}
                  size="square"
                  className="w-full h-full"
                />
              </div>
            </div>
          ))}
          {numberOfProducts > 4 && (
            <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
              <span className="text-sm font-semibold text-gray-600">
                +{numberOfLines - 4}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Order Details - Date, Amount, Items */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Date</p>
          <p
            className="text-sm font-medium text-gray-900"
            data-testid="order-created-at"
          >
            {new Date(order.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Total</p>
          <p
            className="text-sm font-semibold text-gray-900"
            data-testid="order-amount"
          >
            {convertToLocale({
              amount: order.total,
              currency_code: order.currency_code,
            })}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Items</p>
          <p className="text-sm font-medium text-gray-900">
            {numberOfLines} {numberOfLines === 1 ? "item" : "items"}
          </p>
        </div>
      </div>

      {/* View Details Button */}
      <div className="flex justify-end pt-4 border-t border-gray-100">
        <LocalizedClientLink href={`/account/orders/details/${order.id}`}>
          <button
            data-testid="order-details-link"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors duration-150"
          >
            View Details
          </button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default OrderCard