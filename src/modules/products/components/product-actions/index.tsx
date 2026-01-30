"use client"

import { DEFAULT_COUNTRY_CODE } from "@lib/constants/region"
import { createBuyNowCart } from "@lib/data/cart"
import { getProductPrice } from "@lib/util/get-product-price"
import { buildDisplayPrice } from "@lib/util/display-price"
import getShortDescription from "@modules/products/utils/get-short-description"
import { Button } from "@modules/common/components/button"
import Modal from "@modules/common/components/modal"
import { cn } from "@lib/util/cn"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import QuantitySelector from "@modules/common/components/quantity-selector"
import { useOptionalWishlist } from "@modules/products/context/wishlist"
import isEqual from "lodash/isEqual"
import {
  FormEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
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
import { COLOR_SWATCH_MAP } from "@/lib/constants/colors"
import { sendProductQuestion } from "@lib/actions/contact-actions"


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
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(searchParams.get("v_id"))
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
  const [questionStatus, setQuestionStatus] = useState<"idle" | "success" | "error">(
    "idle"
  )
  const [questionError, setQuestionError] = useState<string | null>(null)
  const [isQuestionPending, startSubmitQuestion] = useTransition()
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

  useEffect(() => {
    document.body.classList.add("has-sticky-buy")
    return () => {
      document.body.classList.remove("has-sticky-buy")
    }
  }, [])

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

    // 1. Try to find variant from URL (selectedVariantId initialized from searchParams)
    // 2. Otherwise try to find first in-stock variant
    // 3. Fallback to first variant
    const preferred =
      variants.find((v) => v.id === selectedVariantId) ??
      variants.find((v: any) => isVariantAvailable(v)) ??
      variants[0]

    const variantOptions = optionsAsKeymap(preferred.options)

    // Only set if the options are actually different to avoid infinite loops
    if (!isEqual(options, variantOptions)) {
      setOptions(variantOptions ?? {})
    }

    if (selectedVariantId !== preferred.id) {
      setSelectedVariantId(preferred.id)
    }
  }, [isVariantAvailable, product.variants, isSimple, selectedVariantId, options])

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

  useEffect(() => {
    if (selectedVariant?.image_url) {
      window.dispatchEvent(new CustomEvent("variant-image-change", {
        detail: { url: selectedVariant.image_url }
      }))
    }
  }, [selectedVariant?.image_url])

  // check if the selected options produce a valid variant
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
    setQuestionError(null)

    startSubmitQuestion(async () => {
      const result = await sendProductQuestion({
        ...questionForm,
        productName: product.title,
        productUrl: window.location.href,
      })

      if (result.success) {
        setQuestionStatus("success")
        setTimeout(() => {
          setIsQuestionOpen(false)
          setQuestionStatus("idle")
          setQuestionForm({ name: "", phone: "", email: "", message: "" })
        }, 2000)
      } else {
        setQuestionStatus("error")
        setQuestionError(result.error || "Failed to send question.")
      }
    })
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
          <h1 className="md:text-[32px] text-2xl font-semibold leading-tight text-slate-900">
            {product.title}
          </h1>
          {(() => {
            const blurb = getShortDescription(product, { fallbackToDescription: false })
            if (!blurb) return null
            return <p className="text-sm text-slate-500">{blurb}</p>
          })()}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline gap-3">
            {normalizedPrice ? (
              <>
                <span className="md:text-3xl text-xl font-bold text-[#E7353A]">
                  {normalizedPrice.current.raw}
                </span>
                {normalizedPrice.original && (
                  <span className="md:text-lg text-base text-slate-400 line-through">
                    {normalizedPrice.original.raw}
                  </span>
                )}
                {normalizedPrice.percentageText && (
                  <span className="md:text-sm text-xs font-semibold text-[#E7353A]">
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
        const colorSwatchMap = COLOR_SWATCH_MAP

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
            className={cn(
              "flex w-full cursor-pointer items-center justify-between rounded-2xl border bg-white px-4 py-3 text-sm shadow-[0_1px_3px_rgba(15,23,42,0.08)] transition",
              giftWrap ? "border-[#FF6B6B] shadow-[0_4px_12px_rgba(255,107,107,0.15)]" : "border-slate-200"
            )}
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
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded border text-white transition",
                  giftWrap ? "border-[#FF6B6B] bg-[#FF6B6B]" : "border-slate-300 bg-white"
                )}
                aria-hidden
              >
                <Check className={cn("h-3 w-3", giftWrap ? "opacity-100" : "opacity-0")} />
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

      {
        showSupportActions && (
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
        )
      }

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
                placeholder="Enter your full name"
                onChange={(value) =>
                  setQuestionForm((prev) => ({ ...prev, name: value }))
                }
                required
              />
              <InputField
                label="Your phone number"
                value={questionForm.phone}
                placeholder="Optional"
                onChange={(value) =>
                  setQuestionForm((prev) => ({ ...prev, phone: value }))
                }
              />
            </div>
            <InputField
              label="Your email"
              type="email"
              value={questionForm.email}
              placeholder="you@example.com"
              onChange={(value) =>
                setQuestionForm((prev) => ({ ...prev, email: value }))
              }
              required
            />
            <div className="space-y-2">
              <label className="text-sm font-semibold text-ui-fg-base">
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
                placeholder="Tell us how we can help"
                className="min-h-[120px] w-full rounded-2xl border border-ui-border-base bg-white px-4 py-3 text-ui-fg-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {questionStatus === "error" && (
              <p className="text-sm font-semibold text-red-600" aria-live="polite">
                {questionError}
              </p>
            )}
            {questionStatus === "success" && (
              <p className="text-sm font-semibold text-primary" aria-live="polite">
                Thanks for your question! We'll get back to you shortly.
              </p>
            )}
            <Modal.Footer>
              <button
                type="button"
                onClick={() => setIsQuestionOpen(false)}
                disabled={isQuestionPending}
                className="rounded-full px-6 py-2 text-sm font-semibold uppercase tracking-wider text-ui-fg-subtle transition hover:bg-gray-100 disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isQuestionPending}
                className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-black disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isQuestionPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : questionStatus === "success" ? (
                  "Message sent"
                ) : (
                  "Send Message"
                )}
              </button>
            </Modal.Footer>
          </form>
        </Modal.Body>
      </Modal>

      {/* Sticky Mobile "Buy Now" Bar */}
      <div
        className="lg:hidden fixed bottom-16 left-0 right-0 z-[50] bg-white border-t border-gray-100 p-4 shadow-[0_-12px_24px_-10px_rgba(0,0,0,0.15)]"
      >
        <div className="mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-bold text-slate-900 truncate">{product.title}</span>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-[#E7353A]">
                {normalizedPrice?.current.raw}
              </span>
              {normalizedPrice?.original && (
                <span className="text-xs text-slate-400 line-through">
                  {normalizedPrice.original.raw}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleBuyNowClick}
            disabled={disableBuyNowButton}
            className={cn(
              "h-12 px-8 rounded-full text-sm font-bold text-white transition-all",
              !disableBuyNowButton ? "bg-[#E7353A] active:bg-[#d52c34]" : "bg-slate-300 cursor-not-allowed"
            )}
          >
            {isBuying ? "..." : "Buy Now"}
          </button>
        </div>
      </div>
    </section >
  )
}

const InputField = ({
  label,
  type = "text",
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string
  type?: string
  value: string
  onChange: (_value: string) => void
  required?: boolean
  placeholder?: string
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-ui-fg-base">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-ui-border-base bg-white px-4 py-3 text-ui-fg-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  )
}