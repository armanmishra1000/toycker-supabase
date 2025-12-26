"use client"

import { DEFAULT_COUNTRY_CODE } from "@lib/constants/region"
import { createBuyNowCart } from "@lib/data/cart"
import { getProductPrice } from "@lib/util/get-product-price"
import { buildDisplayPrice } from "@lib/util/display-price"
import getShortDescription from "@modules/products/utils/get-short-description"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import Modal from "@modules/common/components/modal"
import OptionSelect from "@modules/products/components/product-actions/option-select"
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
  GitCompare,
  Heart,
  Loader2,
  MessageCircleQuestion,
  Minus,
  Plus,
  Share2,
} from "lucide-react"
import { useCartSidebar } from "@modules/layout/context/cart-sidebar-context"
import { useCartStore } from "@modules/cart/context/cart-store-context"

const GIFT_WRAP_FEE = 50

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  disabled?: boolean
  showSupportActions?: boolean
  onActionComplete?: () => void
  syncVariantParam?: boolean
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt) => {
    if (varopt?.option_id && varopt?.value) {
      acc[varopt.option_id] = varopt.value
    }
    return acc
  }, {})
}

export default function ProductActions({ product, disabled, showSupportActions = true, syncVariantParam = true, onActionComplete }: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [quantity, setQuantity] = useState(1)
  const [giftWrap, setGiftWrap] = useState(false)
  const wishlist = useOptionalWishlist()
  const [localWishlistSaved, setLocalWishlistSaved] = useState(false)
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
  const [isBuying, setIsBuying] = useState(false)
  const countryCode = DEFAULT_COUNTRY_CODE
  const { openCart } = useCartSidebar()
  const { optimisticAdd } = useCartStore()
  const giftWrapInputId = useId()

  const isVariantAvailable = useCallback((variant: HttpTypes.StoreProductVariant) => {
    if (!variant) return false
    if (!variant.manage_inventory) return true
    if (variant.allow_backorder) return true
    return (variant.inventory_quantity ?? 0) > 0
  }, [])

  // If there is only 1 variant, preselect the options
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    if (selectedVariant) {
      return
    }

    const variants = product.variants ?? []
    if (variants.length === 0) {
      return
    }

    const preferred = variants.find((variant) => isVariantAvailable(variant)) ?? variants[0]
    const variantOptions = optionsAsKeymap(preferred.options)

    setOptions((prev) => {
      if (Object.keys(prev).length > 0) {
        return prev
      }
      return variantOptions ?? {}
    })
  }, [isVariantAvailable, product.variants, selectedVariant])

  useEffect(() => {
    if (wishlist || typeof window === "undefined") {
      return
    }
    const saved = window.localStorage.getItem(`wishlist-${product.id}`)
    setLocalWishlistSaved(saved === "true")
  }, [product.id, wishlist])

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
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    if (!syncVariantParam) {
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
  }, [isValidVariant, pathname, router, searchParams, selectedVariant?.id, syncVariantParam])

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
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
  }, [selectedVariant])

  const maxQuantity = useMemo(() => {
    if (!selectedVariant) {
      return 10
    }
    if (!selectedVariant.manage_inventory || selectedVariant.allow_backorder) {
      return 10
    }
    return Math.max(selectedVariant.inventory_quantity ?? 0, 0)
  }, [selectedVariant])

  const updateQuantity = (direction: "inc" | "dec") => {
    setQuantity((prev) => {
      if (direction === "dec") {
        return Math.max(1, prev - 1)
      }

      const limit = maxQuantity === 0 ? prev : maxQuantity
      return Math.min(limit || prev + 1, prev + 1)
    })
  }

  const toggleLocalWishlist = useCallback(() => {
    if (typeof window === "undefined") {
      return
    }
    const next = !localWishlistSaved
    window.localStorage.setItem(`wishlist-${product.id}`, String(next))
    setLocalWishlistSaved(next)
  }, [product.id, localWishlistSaved])

  const handleWishlistClick = useCallback(() => {
    if (wishlist) {
      wishlist.toggleWishlist(product.id)
      return
    }
    toggleLocalWishlist()
  }, [product.id, toggleLocalWishlist, wishlist])

  const buildLineItemMetadata = useCallback(() => {
    if (!giftWrap) {
      return undefined
    }

    return {
      gift_wrap: true,
      gift_wrap_fee: GIFT_WRAP_FEE,
      gift_wrap_packages: Math.max(1, quantity),
    }
  }, [giftWrap, quantity])

  const addVariantToCart = useCallback(async () => {
    if (!selectedVariant?.id) {
      throw new Error("Missing selected variant")
    }

    await optimisticAdd({
      product,
      variant: selectedVariant,
      quantity,
      countryCode,
      metadata: buildLineItemMetadata(),
    })
    onActionComplete?.()
  }, [
    buildLineItemMetadata,
    countryCode,
    optimisticAdd,
    product,
    quantity,
    selectedVariant,
    onActionComplete,
  ])

  const handleAddToCartClick = () => {
    if (!selectedVariant?.id || isAdding) {
      return
    }

    startAddToCart(async () => {
      try {
        openCart()
        await addVariantToCart()
      } catch (error) {
        console.error("Failed to add to cart", error)
      }
    })
  }

  const handleBuyNowClick = async () => {
    if (!selectedVariant?.id) {
      return
    }

    setIsBuying(true)
    try {
      await createBuyNowCart({
        variantId: selectedVariant.id,
        quantity,
        countryCode,
        metadata: buildLineItemMetadata(),
      })
      onActionComplete?.()
      router.push(`/checkout?step=address`)
    } catch (error) {
      console.error("Failed to start checkout", error)
    } finally {
      setIsBuying(false)
    }
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
      share?: (data: ShareData) => Promise<void>
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
      return getProductPrice({ product, variantId: selectedVariant?.id })
    } catch (error) {
      console.error(error)
      return { cheapestPrice: null, variantPrice: null }
    }
  }, [product, selectedVariant?.id])

  const normalizedPrice = buildDisplayPrice(
    selectedVariant ? priceMeta.variantPrice : priceMeta.cheapestPrice
  )

  const requiresSelection = (product.options?.length ?? 0) > 0 && !selectedVariant

  const canTransactBase =
    inStock &&
    !!selectedVariant &&
    !disabled &&
    isValidVariant

  const isBusy = isAdding || isBuying

  const addToCartLabel = requiresSelection
    ? "Select options"
    : !isValidVariant
    ? "Select options"
    : !inStock
    ? "Out of stock"
    : "Add to Cart"

  const disableAddButton = !canTransactBase || isAdding
  const disableBuyNowButton = !canTransactBase || isBuying

  const isWishlistActive = wishlist
    ? wishlist.isInWishlist(product.id)
    : localWishlistSaved

  return (
    <section className="flex flex-col gap-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-[32px] font-semibold leading-tight text-slate-900">
            {product.title}
          </h1>
          {(() => {
            const blurb = getShortDescription(product, { fallbackToDescription: false })
            if (!blurb) {
              return null
            }
            return <p className="text-base text-slate-500">{blurb}</p>
          })()}
        </div>

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
        <p className="text-sm text-slate-500">Inclusive of all taxes</p>
      </div>

      {(product.options?.length ?? 0) > 0 && (product.variants?.length ?? 0) > 1 && (
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

      <div className="space-y-3">
        <span className="text-sm font-medium text-slate-700">Add-ons</span>
        <label
          htmlFor={giftWrapInputId}
          className={`flex w-full cursor-pointer items-center justify-between rounded-2xl border bg-white px-4 py-3 text-sm shadow-[0_1px_3px_rgba(15,23,42,0.08)] transition ${
            giftWrap ? "border-[#FF6B6B] shadow-[0_4px_12px_rgba(255,107,107,0.15)]" : "border-slate-200"
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
              className={`flex h-5 w-5 items-center justify-center rounded border text-white transition ${
                giftWrap ? "border-[#FF6B6B] bg-[#FF6B6B]" : "border-slate-300 bg-white"
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
            + ₹{GIFT_WRAP_FEE}
          </span>
        </label>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Quantity</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => updateQuantity("dec")}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-50"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <div className="flex h-12 min-w-[64px] items-center justify-center rounded-full border border-slate-200 text-lg font-semibold">
            {quantity}
          </div>
          <button
            type="button"
            onClick={() => updateQuantity("inc")}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-50"
            aria-label="Increase quantity"
            disabled={maxQuantity === 0 || (maxQuantity !== 0 && quantity >= maxQuantity)}
          >
            <Plus className="h-4 w-4" />
          </button>
          {maxQuantity !== 0 && (
            <p className="text-xs text-slate-500">
              {Math.max(maxQuantity - quantity, 0)} pieces left in stock
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
            className={`relative h-14 flex-1 rounded-full px-10 text-base font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7353A] ${
              !disableAddButton
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
            className={`flex h-14 w-14 items-center justify-center rounded-full border text-[#E7353A] transition ${
              isWishlistActive ? "border-[#E7353A] bg-[#FFF5F5]" : "border-ui-border-base"
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
          className={`h-14 w-full rounded-full text-base font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7353A] ${
            !disableBuyNowButton ? "bg-[#E7353A] hover:bg-[#d52c34]" : "cursor-not-allowed bg-slate-300"
          }`}
        >
          {isBuying ? "Processing..." : "Buy It Now"}
        </button>
      </div>

      {showSupportActions && (
        <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-ui-fg-base">
          <button
            type="button"
            onClick={() => setIsQuestionOpen(true)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-ui-fg-base"
          >
            <MessageCircleQuestion className="h-4 w-4" />
            Ask a question
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 text-sm font-semibold text-ui-fg-base"
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
              <label className="text-sm font-medium text-ui-fg-base">
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
                className="min-h-[120px] w-full rounded-2xl border border-ui-border-base px-4 py-3 text-sm focus:border-ui-fg-interactive focus:outline-none"
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
  onChange: (value: string) => void
  required?: boolean
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-ui-fg-base">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="w-full rounded-2xl border border-ui-border-base px-4 py-3 text-sm focus:border-ui-fg-interactive focus:outline-none"
      />
    </div>
  )
}
