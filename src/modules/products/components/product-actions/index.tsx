"use client"

import { DEFAULT_COUNTRY_CODE } from "@lib/constants/region"
import { createBuyNowCart } from "@lib/data/cart"
import { getProductPrice } from "@lib/util/get-product-price"
import { buildDisplayPrice } from "@lib/util/display-price"
import getShortDescription from "@modules/products/utils/get-short-description"
import { Button } from "@modules/common/components/button"
import Modal from "@modules/common/components/modal"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import QuantitySelector from "@modules/common/components/quantity-selector"
import { useOptionalWishlist } from "@modules/products/context/wishlist"
import { isEqual } from "lodash"
import {
  FormEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  useTransition,
} from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  Check,
  Gift,
  Heart,
  Loader2,
  MessageCircleQuestion,
  Share2,
} from "lucide-react"
import { useCartSidebar } from "@modules/layout/context/cart-sidebar-context"
import { useCartStore } from "@modules/cart/context/cart-store-context"
import { Product } from "@/lib/supabase/types"
import { isSimpleProduct } from "@lib/util/product"


type ProductActionsProps = {
  product: Product
  disabled?: boolean
  showSupportActions?: boolean
  onActionComplete?: () => void
  syncVariantParam?: boolean
  clubDiscountPercentage?: number
}

const optionsAsKeymap = (
  variantOptions: any[]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    if (varopt?.option_id && varopt?.value) {
      acc[varopt.option_id] = varopt.value
    }
    return acc
  }, {})
}

export default function ProductActions({ product, disabled, showSupportActions = true, syncVariantParam = false, onActionComplete, clubDiscountPercentage }: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [giftWrap, setGiftWrap] = useState(false)
  const [giftWrapSettings, setGiftWrapSettings] = useState<{ fee: number, enabled: boolean }>({ fee: 50, enabled: true })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { getGlobalSettings } = await import("@lib/data/settings")
        const settings = await getGlobalSettings()
        setGiftWrapSettings({
          fee: settings.gift_wrap_fee,
          enabled: settings.is_gift_wrap_enabled
        })
      } catch (error) {
        console.error("Failed to fetch gift wrap settings", error)
      }
    }
    fetchSettings()
  }, [])

  const wishlist = useOptionalWishlist()
  const [isQuestionOpen, setIsQuestionOpen] = useState(false)
  const [questionStatus, setQuestionStatus] = useState<"idle" | "success">(
    "idle"
  )
  const [questionForm, setQuestionForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  })
  const [shareCopied, setShareCopied] = useState(false)
  const [isAdding, startAddToCart] = useTransition()
  const [isBuying, startBuyNow] = useTransition()
  const countryCode = DEFAULT_COUNTRY_CODE
  const { openCart } = useCartSidebar()
  const { optimisticAdd } = useCartStore()
  const giftWrapInputId = useId()

  const isSimple = isSimpleProduct(product)

  const isVariantAvailable = useCallback((variant: any) => {
    if (!variant) return false
    if (!variant.manage_inventory) return true
    if (variant.allow_backorder) return true
    return (variant.inventory_quantity ?? 0) > 0
  }, [])

  // No-op - consolidated below

  const selectedVariant = useMemo(() => {
    // Direct variant selection by ID (for simple variant dropdown)
    if (selectedVariantId && product.variants) {
      return product.variants.find((v) => v.id === selectedVariantId)
    }

    // If it's a simple product, use the first variant (or product itself if mocked)
    if (isSimple && product.variants && product.variants.length > 0) {
      return product.variants[0]
    }

    if (!product.variants || product.variants.length === 0) {
      return undefined
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options, isSimple, selectedVariantId])

  // Check if there are any options with actual values
  const hasValidOptions = useMemo(() => {
    return (product.options || []).some(option => (option.values?.length ?? 0) > 0)
  }, [product.options])

  useEffect(() => {
    if (isSimple) {
      return
    }

    const variants = product.variants ?? []
    if (variants.length === 0) {
      return
    }

    const preferred = variants.find((variant: any) => isVariantAvailable(variant)) ?? variants[0]
    const variantOptions = optionsAsKeymap(preferred.options)

    // Only set if nothing is perfectly selected yet
    if (!selectedVariant) {
      setOptions(variantOptions ?? {})
      setSelectedVariantId(preferred.id)
    }
  }, [isVariantAvailable, product.variants, selectedVariant, isSimple, hasValidOptions])

  // Sync options when selectedVariantId changes manually (e.g. from Beetle color swatches)
  useEffect(() => {
    if (selectedVariantId && !hasValidOptions) {
      const variant = product.variants?.find(v => v.id === selectedVariantId)
      if (variant) {
        const variantOptions = optionsAsKeymap(variant.options)
        setOptions(variantOptions ?? {})
      }
    }
  }, [selectedVariantId, hasValidOptions, product.variants])


  // update the options when a variant is selected
  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  useEffect(() => {
    if (!selectedVariant) {
      return
    }
    if (selectedVariant.manage_inventory) {
      const available = Math.max(selectedVariant.inventory_quantity ?? 0, 0)
      if (available > 0 && quantity > available) {
        setQuantity(available)
      } else if (available === 0 && quantity !== 1) {
        setQuantity(1)
      }
    }
  }, [quantity, selectedVariant])

  //check if the selected options produce a valid variant
  const isValidVariant = useMemo(() => {
    if (isSimple) return true

    return product.variants?.some((v: any) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options, isSimple])

  useEffect(() => {
    if (!syncVariantParam || isSimple) {
      return
    }

    const params = new URLSearchParams(searchParams.toString())
    const value = isValidVariant ? selectedVariant?.id : null

    if (params.get("v_id") === value) {
      return
    }

    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }

    router.replace(pathname + "?" + params.toString())
  }, [isValidVariant, pathname, router, searchParams, selectedVariant?.id, syncVariantParam, isSimple])

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    // If no variants exist, use product stock
    if (!product.variants || product.variants.length === 0) {
      return (product.stock_count || 0) > 0
    }

    // If we don't manage inventory, we can always add to cart
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }

    // If we allow back orders on the variant, we can add to cart
    if (selectedVariant?.allow_backorder) {
      return true
    }

    // If there is inventory available, we can add to cart
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }

    // Otherwise, we can't add to cart
    return false
  }, [selectedVariant, product.variants, product.stock_count])

  const maxQuantity = useMemo(() => {
    // If no variants exist, use product stock
    if (!product.variants || product.variants.length === 0) {
      return Math.max(product.stock_count || 0, 0)
    }

    if (!selectedVariant) {
      return 0 // Changed from 10 to 0 to avoid "9 pieces left" bug when nothing is selected
    }
    if (!selectedVariant.manage_inventory || selectedVariant.allow_backorder) {
      return 10
    }
    return Math.max(selectedVariant.inventory_quantity ?? 0, 0)
  }, [selectedVariant, product.variants, product.stock_count])

  const updateQuantity = (direction: "inc" | "dec") => {
    setQuantity((prev) => {
      if (direction === "dec") {
        return Math.max(1, prev - 1)
      }

      const limit = maxQuantity === 0 ? prev : maxQuantity
      return Math.min(limit || prev + 1, prev + 1)
    })
  }

  const handleWishlistClick = useCallback(() => {
    if (wishlist) {
      wishlist.toggleWishlist(product.id)
    }
  }, [product.id, wishlist])

  const buildLineItemMetadata = useCallback(() => {
    if (!giftWrap) {
      return undefined
    }

    return {
      gift_wrap: true,
      gift_wrap_fee: giftWrapSettings.fee,
      gift_wrap_packages: Math.max(1, quantity),
    }
  }, [giftWrap, giftWrapSettings.fee, quantity])

  const addVariantToCart = useCallback(async () => {
    if (!selectedVariant?.id) {
      throw new Error("Missing selected variant")
    }

    // 1. Add the product itself
    optimisticAdd({
      product,
      variant: selectedVariant,
      quantity,
      countryCode,
      metadata: giftWrap ? { gift_wrap: true } : undefined, // flag that it is wrapped, but no fee here
    })

    // 2. If gift wrap is selected, add it as a separate line item
    if (giftWrap) {
      optimisticAdd({
        product,
        variant: undefined, // Gift wrap line doesn't need the specific variant
        quantity: 1, // Usually 1 wrap per set, or we can pin to quantity
        countryCode,
        metadata: {
          gift_wrap_line: true,
          gift_wrap_fee: giftWrapSettings.fee,
          parent_line_id: `parent-${selectedVariant.id}-${Date.now()}` // Linking reference
        },
      })
    }

    onActionComplete?.()
  }, [
    giftWrap,
    giftWrapSettings.fee,
    countryCode,
    optimisticAdd,
    product,
    quantity,
    selectedVariant,
    onActionComplete,
  ])

  const handleAddToCartClick = () => {
    if (isAdding || (!selectedVariant?.id && product.variants && product.variants.length > 0)) {
      return
    }

    const startTime = performance.now()
    console.log("[Add to Cart] Starting...")

    startAddToCart(async () => {
      try {
        openCart()
        if (selectedVariant?.id || (product.variants && product.variants.length === 0)) {
          if (selectedVariant?.id) {
            addVariantToCart()
          } else {
            // Simple product without variants
            optimisticAdd({
              product,
              variant: undefined,
              quantity,
              countryCode,
              metadata: giftWrap ? { gift_wrap: true } : undefined,
            })

            if (giftWrap) {
              optimisticAdd({
                product,
                variant: undefined,
                quantity: 1,
                countryCode,
                metadata: {
                  gift_wrap_line: true,
                  gift_wrap_fee: giftWrapSettings.fee,
                  parent_line_id: `parent-${product.id}-${Date.now()}`
                },
              })
            }
            onActionComplete?.()
          }
        }
        const endTime = performance.now()
        console.log(`[Add to Cart] Completed in ${(endTime - startTime).toFixed(2)}ms`)
      } catch (error) {
        console.error("Failed to add to cart", error)
      }
    })
  }

  const handleBuyNowClick = () => {
    if (isBuying || (!selectedVariant?.id && product.variants && product.variants.length > 0)) {
      return
    }

    startBuyNow(async () => {
      try {
        await createBuyNowCart({
          variantId: selectedVariant?.id || null,
          productId: product.id,
          quantity,
          countryCode,
          metadata: buildLineItemMetadata(),
        })
        onActionComplete?.()
        router.push(`/checkout?step=address`)
      } catch (error) {
        console.error("Failed to start checkout", error)
      }
    })
  }

  const handleQuestionSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setQuestionStatus("success")
    setTimeout(() => {
      setIsQuestionOpen(false)
      setQuestionStatus("idle")
      setQuestionForm({ name: "", phone: "", email: "", message: "" })
    }, 1500)
  }

  const handleShare = async () => {
    if (typeof window === "undefined") {
      return
    }
    const url = window.location.href
    const shareNavigator = navigator as Navigator & {
      share?: (_data: ShareData) => Promise<void>
    }
    if (shareNavigator.share) {
      await shareNavigator.share({
        title: product.title,
        url,
      })
      return
    }

    try {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    } catch (error) {
      console.error("Unable to copy share link", error)
    }
  }

  const priceMeta = useMemo(() => {
    try {
      return getProductPrice({ product, variantId: selectedVariant?.id, clubDiscountPercentage })
    } catch (error) {
      console.error(error)
      return { cheapestPrice: null, variantPrice: null }
    }
  }, [product, selectedVariant?.id, clubDiscountPercentage])

  const normalizedPrice = buildDisplayPrice(
    selectedVariant ? priceMeta.variantPrice : priceMeta.cheapestPrice
  )


  const requiresSelection = !isSimple && hasValidOptions && !selectedVariant

  const canTransactBase =
    inStock &&
    (!!selectedVariant || (!product.variants || product.variants.length === 0)) &&
    !disabled &&
    (isValidVariant || (!product.variants || product.variants.length === 0))

  const isBusy = isAdding || isBuying

  const addToCartLabel = requiresSelection
    ? "Select options"
    : !inStock
      ? "Out of stock"
      : "Add to Cart"

  const disableAddButton = !canTransactBase || isAdding
  const disableBuyNowButton = !canTransactBase || isBuying

  const isWishlistActive = wishlist?.isInWishlist(product.id) ?? false

  return (
    <section className="flex flex-col gap-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-[32px] font-semibold leading-tight text-slate-900">
            {product.title}
          </h1>
          {(() => {
            // Deprecated location - keeping empty to effectively remove from top if needed, 
            // or better yet, just remove this block if I am sure. 
            // The user wants it above "Inclusive of all taxes".
            // I will remove this block and place it down below.
            return null
          })()}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline gap-3">
            {normalizedPrice ? (
              <>
                <span className="text-3xl font-bold text-[#E7353A]">
                  {normalizedPrice.current.raw}
                </span>
                {normalizedPrice.original && (
                  <span className="text-lg text-slate-400 line-through">
                    {normalizedPrice.original.raw}
                  </span>
                )}
                {normalizedPrice.percentageText && (
                  <span className="text-sm font-semibold text-[#E7353A]">
                    {normalizedPrice.percentageText}
                  </span>
                )}
              </>
            ) : (
              <span className="h-9 w-32 animate-pulse rounded-full bg-slate-100" />
            )}
          </div>

          {(selectedVariant ? priceMeta.variantPrice : priceMeta.cheapestPrice)?.club_price && (
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit border border-emerald-100">
              <span className="font-semibold text-sm">Club Price: {(selectedVariant ? priceMeta.variantPrice : priceMeta.cheapestPrice)?.club_price}</span>
            </div>
          )}
        </div>
        {(() => {
          const blurb = getShortDescription(product, { fallbackToDescription: false })
          if (!blurb) return null
          return <p className="text-sm text-slate-500 mb-1">{blurb}</p>
        })()}
        <p className="text-sm text-slate-500">Inclusive of all taxes</p>
      </div>

      {!isSimple && hasValidOptions && (product.variants?.length ?? 0) > 1 && (
        <div className="flex flex-col gap-y-4">
          {(product.options || []).map((option) => {
            const normalizedTitle = option.title?.toLowerCase() ?? ""
            const isColorOption = normalizedTitle.includes("color")
            return (
              <div key={option.id}>
                <OptionSelect
                  option={option}
                  current={options[option.id]}
                  updateOption={setOptionValue}
                  title={option.title ?? ""}
                  data-testid="product-options"
                  disabled={!!disabled || isBusy}
                  layout={isColorOption ? "swatch" : "pill"}
                />
              </div>
            )
          })}
        </div>
      )}

      {/* Color swatch variant selector when options don't exist OR have no values, but variants do */}
      {!isSimple && !hasValidOptions && (product.variants?.length ?? 0) > 1 && (() => {
        const colorSwatchMap: Record<string, string> = {
          red: "#E94235",
          orange: "#FF8A3C",
          yellow: "#F6E36C",
          green: "#3BB273",
          blue: "#3A7BEB",
          navy: "#1D3C78",
          purple: "#8E44AD",
          pink: "#FF5D8F",
          black: "#111111",
          white: "#FAFAFA",
          grey: "#D9D9D9",
          gray: "#D9D9D9",
          brown: "#9B5B2A",
          gold: "#FFD700",
          silver: "#C0C0C0",
          beige: "#F5F5DC",
          cream: "#FFFDD0",
          maroon: "#800000",
          teal: "#008080",
          coral: "#FF7F50",
          olive: "#808000",
          mint: "#98FF98",
          lavender: "#E6E6FA",
          cyan: "#00FFFF",
          turquoise: "#40E0D0",
          sky: "#87CEEB",
          indigo: "#4B0082",
          violet: "#EE82EE",
          magenta: "#FF00FF",
          lime: "#00FF00",
          charcoal: "#36454F",
          slate: "#708090",
          crimson: "#DC143C",
        }

        return (
          <div className="flex flex-col gap-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Color</span>
              <span className="text-sm text-gray-500">
                {selectedVariant?.title ?? "Choose"}
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {product.variants?.map((variant) => {
                const colorName = variant.title?.toLowerCase().trim() || ""
                const colorHex = colorSwatchMap[colorName] || null
                const isSelected = selectedVariantId === variant.id

                return (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariantId(variant.id)}
                    disabled={!!disabled || isAdding || isBuying}
                    className={`relative flex h-12 w-12 items-center justify-center rounded-full border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600
                      ${isSelected ? "border-[#E7353A] ring-2 ring-[#FDD5DB]" : "border-gray-200 hover:border-gray-400"}`}
                    title={variant.title}
                  >
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full"
                      style={{ backgroundColor: colorHex || "#f4f4f4" }}
                    >
                      {!colorHex && (
                        <span className="text-[10px] font-bold text-gray-700">
                          {variant.title?.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })()}

      {giftWrapSettings.enabled && (
        <div className="space-y-3">
          <span className="text-sm font-medium text-slate-700">Add-ons</span>
          <label
            htmlFor={giftWrapInputId}
            className={`flex w-full cursor-pointer items-center justify-between rounded-2xl border bg-white px-4 py-3 text-sm shadow-[0_1px_3px_rgba(15,23,42,0.08)] transition ${giftWrap ? "border-[#FF6B6B] shadow-[0_4px_12px_rgba(255,107,107,0.15)]" : "border-slate-200"
              }`}
          >
            <input
              id={giftWrapInputId}
              type="checkbox"
              checked={giftWrap}
              onChange={(event) => setGiftWrap(event.target.checked)}
              className="peer sr-only"
            />
            <span className="flex items-center gap-3">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded border text-white transition ${giftWrap ? "border-[#FF6B6B] bg-[#FF6B6B]" : "border-slate-300 bg-white"
                  }`}
                aria-hidden
              >
                <Check className={`h-3 w-3 ${giftWrap ? "opacity-100" : "opacity-0"}`} />
              </span>
              <Gift className="h-5 w-5 text-[#FF6B6B]" aria-hidden />
              <span className="text-base font-medium text-slate-800">
                Add a Gift Wrap
              </span>
            </span>
            <span className="text-sm font-semibold text-slate-500">
              + ₹{giftWrapSettings.fee}
            </span>
          </label>
        </div>
      )}

      <div className="space-y-3">
        <p className="text-sm font-medium text-slate-700">Quantity</p>
        <div className="flex items-center gap-4">
          <QuantitySelector
            quantity={quantity}
            onChange={setQuantity}
            onIncrement={() => updateQuantity("inc")}
            onDecrement={() => updateQuantity("dec")}
            max={maxQuantity === 0 ? 1 : maxQuantity}
            className="w-fit"
          />
          {maxQuantity !== 0 && (
            <p className="text-xs text-slate-500 font-medium">
              {Math.max(maxQuantity - quantity, 0)} items left in stock
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleAddToCartClick}
            disabled={disableAddButton}
            className={`relative h-14 flex-1 rounded-full px-10 text-base font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7353A] ${!disableAddButton
              ? "bg-[#F6E36C] text-slate-900 hover:brightness-95"
              : "cursor-not-allowed bg-slate-200 text-slate-500"
              }`}
            data-testid="add-product-button"
          >
            {isAdding && (
              <Loader2 className="absolute left-4 h-5 w-5 animate-spin text-slate-700" aria-hidden="true" />
            )}
            <span className={isAdding ? "opacity-70" : ""}>{addToCartLabel}</span>
          </button>
          <button
            type="button"
            onClick={handleWishlistClick}
            className={`flex h-14 w-14 items-center justify-center rounded-full border text-[#E7353A] transition ${isWishlistActive ? "border-[#E7353A] bg-[#FFF5F5]" : "border-gray-200"
              }`}
            aria-label="Toggle wishlist"
            aria-pressed={isWishlistActive}
          >
            <Heart className={`h-5 w-5 ${isWishlistActive ? "fill-current" : ""}`} />
          </button>
        </div>
        <button
          type="button"
          onClick={handleBuyNowClick}
          disabled={disableBuyNowButton}
          className={`h-14 w-full rounded-full text-base font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7353A] ${!disableBuyNowButton ? "bg-[#E7353A] hover:bg-[#d52c34]" : "cursor-not-allowed bg-slate-300"
            }`}
        >
          {isBuying ? "Processing..." : "Buy It Now"}
        </button>
      </div>

      {showSupportActions && (
        <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-gray-900">
          <button
            type="button"
            onClick={() => setIsQuestionOpen(true)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900"
          >
            <MessageCircleQuestion className="h-4 w-4" />
            Ask a question
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900"
          >
            <Share2 className="h-4 w-4" />
            {shareCopied ? "Link copied" : "Share"}
          </button>
        </div>
      )}

      <Modal
        isOpen={isQuestionOpen}
        close={() => setIsQuestionOpen(false)}
        size="large"
      >
        <Modal.Title>Ask a question</Modal.Title>
        <Modal.Description>
          Fill in the form and our support will get back to you shortly.
        </Modal.Description>
        <Modal.Body>
          <form className="w-full space-y-4" onSubmit={handleQuestionSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                label="Your name"
                value={questionForm.name}
                onChange={(value) =>
                  setQuestionForm((prev) => ({ ...prev, name: value }))
                }
                required
              />
              <InputField
                label="Your phone number"
                value={questionForm.phone}
                onChange={(value) =>
                  setQuestionForm((prev) => ({ ...prev, phone: value }))
                }
              />
            </div>
            <InputField
              label="Your email"
              type="email"
              value={questionForm.email}
              onChange={(value) =>
                setQuestionForm((prev) => ({ ...prev, email: value }))
              }
              required
            />
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                Your message
              </label>
              <textarea
                required
                value={questionForm.message}
                onChange={(event) =>
                  setQuestionForm((prev) => ({
                    ...prev,
                    message: event.target.value,
                  }))
                }
                className="min-h-[120px] w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-gray-900 focus:outline-none"
              />
            </div>
            <Modal.Footer>
              <Button type="button" variant="secondary" onClick={() => setIsQuestionOpen(false)}>
                Back
              </Button>
              <Button type="submit">
                {questionStatus === "success" ? "Message sent" : "Send your message"}
              </Button>
            </Modal.Footer>
          </form>
        </Modal.Body>
      </Modal>
    </section>
  )
}

const InputField = ({
  label,
  type = "text",
  value,
  onChange,
  required,
}: {
  label: string
  type?: string
  value: string
  onChange: (_value: string) => void
  required?: boolean
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-900">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-gray-900 focus:outline-none"
      />
    </div>
  )
}