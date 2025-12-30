"use client"

import { Text } from "@modules/common/components/text"
import React from "react"
import { ChevronDown, X } from "lucide-react"

import { applyPromotions } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { Cart } from "@/lib/supabase/types"
import ErrorMessage from "../error-message"
import { SubmitButton } from "../submit-button"
import { cn } from "@lib/util/cn"

type DiscountCodeProps = {
  cart: Cart
}

const DiscountCode: React.FC<DiscountCodeProps> = ({ cart }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState("")

  const { promotions = [] } = cart
  const removePromotionCode = async (code: string) => {
    const validPromotions = promotions.filter(
      (promotion) => promotion.code !== code
    )

    await applyPromotions(
      validPromotions.filter((p) => p.code !== undefined).map((p) => p.code!)
    )
  }

  const addPromotionCode = async (formData: FormData) => {
    setErrorMessage("")

    const code = formData.get("code")
    if (!code) {
      return
    }
    const input = document.getElementById("promotion-input") as HTMLInputElement
    const codes = promotions
      .filter((p) => p.code !== undefined)
      .map((p) => p.code!)
    codes.push(code.toString())

    try {
      await applyPromotions(codes)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to apply promotion code"
      setErrorMessage(message)
    }

    if (input) {
      input.value = ""
    }
  }

  return (
    <div className="w-full">
      {/* Applied Promotions */}
      {promotions.length > 0 && (
        <div className="flex flex-col gap-2 mb-3">
          {promotions.map((promotion) => {
            // Compute discount text separately to avoid JSX parsing issues
            const discountText =
              promotion.application_method?.value !== undefined &&
              promotion.application_method.currency_code !== undefined
                ? promotion.application_method.type === "percentage"
                  ? `${promotion.application_method.value}% off`
                  : `${convertToLocale({
                      amount: Number(promotion.application_method.value),
                      currency_code: promotion.application_method.currency_code,
                    })} off`
                : ""

            return (
              <div
                key={promotion.id}
                className="flex items-center justify-between gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg"
                data-testid="discount-row"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-green-600 text-sm font-semibold" data-testid="discount-code">
                    {promotion.code}
                  </span>
                  {discountText && (
                    <span className="text-green-700 text-xs">
                      {discountText}
                    </span>
                  )}
                </div>
                {!promotion.is_automatic && (
                  <button
                    className="flex-shrink-0 p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
                    onClick={() => {
                      if (!promotion.code) {
                        return
                      }
                      removePromotionCode(promotion.code)
                    }}
                    data-testid="remove-discount-button"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add Promotion Code Toggle */}
      <form action={(a) => addPromotionCode(a)}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between gap-2 px-4 py-3 border-2 border-dashed rounded-xl transition-all duration-200",
            isOpen
              ? "border-blue-400 bg-blue-50/50 text-blue-700"
              : "border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50"
          )}
          data-testid="add-discount-button"
        >
          <span className="text-sm font-medium">
            {promotions.length > 0 ? "Add another promotion code" : "Add promotion code"}
          </span>
          <ChevronDown
            size={18}
            className={cn(
              "transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {isOpen && (
          <div className="mt-3 space-y-3">
            <div className="flex gap-2">
              <input
                className="flex-1 h-10 px-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                id="promotion-input"
                name="code"
                type="text"
                placeholder="Enter code"
                data-testid="discount-input"
              />
              <SubmitButton
                variant="secondary"
                className="px-5 h-10 rounded-lg"
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
