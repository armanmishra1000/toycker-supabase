"use client"

import { Button } from "@modules/common/components/button"

import OrderCard from "../order-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Order } from "@/lib/supabase/types"

const OrderOverview = ({ orders }: { orders: Order[] }) => {
  if (orders?.length) {
    return (
      <div className="flex flex-col gap-4 w-full">
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} />
        ))}
      </div>
    )
  }

  return (
    <div
      className="w-full flex flex-col items-center gap-y-4 py-12"
      data-testid="no-orders-container"
    >
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-2">
        <svg
          className="w-10 h-10 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-900">No orders yet</h2>
      <p className="text-base text-gray-500 text-center max-w-md">
        You haven&apos;t placed any orders yet. Start shopping to see your orders here.
      </p>
      <div className="mt-4">
        <LocalizedClientLink href="/" passHref>
          <Button data-testid="continue-shopping-button">
            Start Shopping
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default OrderOverview