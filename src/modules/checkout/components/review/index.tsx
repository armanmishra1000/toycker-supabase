"use client"

import { Cart } from "@/lib/supabase/types"
import { Text } from "@modules/common/components/text"
import { cn } from "@lib/util/cn"

import PaymentButton from "../payment-button"
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"

// Extended cart type with gift_cards property
type CartWithGiftCards = Cart & {
  gift_cards?: Array<{ id: string }>
}

const Review = ({ cart }: { cart: CartWithGiftCards }) => {
  const searchParams = useSearchParams()

  const isOpen = searchParams.get("step") === "review"

  // Scroll to top when review step opens
  useEffect(() => {
    if (isOpen) {
      // Use requestAnimationFrame to ensure DOM has updated before scrolling
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({ top: 0, behavior: "smooth" })
        })
      })
    }
  }, [isOpen])

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && (cart?.total ?? 0) === 0

  const previousStepsCompleted =
    cart.shipping_address &&
    (cart.payment_collection || paidByGiftcard)

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <h2
          className={cn(
            "flex flex-row text-3xl font-bold gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none": !isOpen,
            }
          )}
        >
          Review
        </h2>
      </div>
      {isOpen && previousStepsCompleted ? (
        <>
          <div className="flex items-start gap-x-1 w-full mb-6">
            <div className="w-full">
              <Text className="text-base font-medium text-ui-fg-base mb-1">
                By clicking the Place Order button, you confirm that you have
                read, understand and accept our Terms of Use, Terms of Sale and
                Returns Policy and acknowledge that you have read Toycker&apos;s Privacy Policy.
              </Text>
            </div>
          </div>
          <PaymentButton cart={cart} data-testid="submit-order-button" />
        </>
      ) : null}
    </div>
  )
}

export default Review