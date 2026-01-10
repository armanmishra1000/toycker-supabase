"use client"

import { Text } from "@modules/common/components/text"
import React from "react"
import { ChevronDown, X } from "lucide-react"

import { useOptionalCartStore } from "@modules/cart/context/cart-store-context"
import { convertToLocale } from "@lib/util/money"
import { Cart, Promotion } from "@/lib/supabase/types"
import ErrorMessage from "../error-message"
import { SubmitButton } from "../submit-button"
import { cn } from "@lib/util/cn"

type DiscountCodeProps = {
  cart: Cart
}

const DiscountCode: React.FC<DiscountCodeProps> = ({ cart }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState("")
  const cartStore = useOptionalCartStore()

  const { promotions = [] } = cart
  const removePromotion = async (code: string) => {
    if (cartStore) {
      await cartStore.removePromotionCode(code)
    } else {
      // Fallback if store not available (e.g. static pages)
      const { applyPromotions } = await import("@lib/data/cart")
      await applyPromotions([])
      window.location.reload()
    }
  }

  const addPromotionCode = async (formData: FormData) => {
    setErrorMessage("")

    const code = formData.get("code")?.toString()
    if (!code) {
      return
    }

    const input = document.getElementById("promotion-input") as HTMLInputElement

    try {
      if (cartStore) {
        await cartStore.applyPromotionCode(code)
      } else {
        const { applyPromotions } = await import("@lib/data/cart")
        await applyPromotions([code])
        window.location.reload()
      }
      if (input) input.value = ""
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to apply promotion code"
      setErrorMessage(message)
    }
  }

  return (
    <div className="w-full">
      {/* Applied Promotions */}
      {promotions.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {promotions.map((promotion: Promotion) => {
            const discountText =
              promotion.type === "percentage"
                ? `${promotion.value}% off`
                : promotion.type === "fixed"
                  ? `${convertToLocale({
                    amount: promotion.value,
                    currency_code: "inr",
                  })} off`
                  : "Free Shipping"

            return (
              <div
                key={promotion.id}
                className="group flex items-center justify-between gap-2 px-3.5 py-2 bg-emerald-50/50 border border-emerald-100 rounded-xl transition-all duration-300 hover:bg-emerald-50 hover:border-emerald-200"
                data-testid="discount-row"
              >
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700 text-[10px] font-black uppercase tracking-wider">Applied</span>
                    <span className="text-emerald-900 text-xs font-bold leading-none">{promotion.code}</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium">
                    {discountText}
                  </span>
                </div>
                <button
                  className="p-1.5 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100/50 rounded-lg transition-all duration-200"
                  onClick={() => {
                    if (!promotion.code) return
                    removePromotion(promotion.code)
                  }}
                  data-testid="remove-discount-button"
                >
                  <X size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Promotion Code Section */}
      <form action={(a) => addPromotionCode(a)}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl transition-all duration-300 border border-dashed group",
            isOpen
              ? "border-blue-200 bg-blue-50/30 text-blue-600"
              : "border-gray-300 text-slate-500 hover:border-slate-200 hover:bg-slate-50/50 hover:text-slate-700"
          )}
          data-testid="add-discount-button"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold uppercase tracking-wider">
              {promotions.length > 0 ? "Add another promo" : "Promo Code"}
            </span>
          </div>
          <ChevronDown
            size={16}
            className={cn(
              "transition-transform duration-500 ease-out text-slate-400 group-hover:text-slate-600",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {isOpen && (
          <div className="mt-2.5 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex gap-2">
              <input
                className="flex-1 h-11 px-4 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200 placeholder:text-slate-400 font-medium"
                id="promotion-input"
                name="code"
                type="text"
                placeholder="Enter your code"
                data-testid="discount-input"
              />
              <SubmitButton
                variant="secondary"
                className="px-6 h-11 rounded-xl font-bold text-xs uppercase tracking-widest shadow-blue-500/10 active:scale-95 transition-all shadow-none"
                data-testid="discount-apply-button"
              >
                Apply
              </SubmitButton>
            </div>

            <ErrorMessage
              error={errorMessage}
              data-testid="discount-error-message"
            />
          </div>
        )}
      </form>
    </div>
  )
}

export default DiscountCode
