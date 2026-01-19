import { CartItem, Product, ProductVariant, Promotion } from "@/lib/supabase/types"
import { fixUrl } from "./images"

/** Raw cart item from database with nested product/variant objects */
export interface DatabaseCartItem {
    id: string
    cart_id: string
    product_id: string
    variant_id: string | null
    quantity: number
    created_at: string
    updated_at: string
    product: Product | null
    variant: ProductVariant | null
    metadata?: Record<string, unknown>
}

/** Shipping method stored in cart */
export interface CartShippingMethod {
    shipping_option_id: string
    name: string
    amount: number
    min_order_free_shipping?: number | null
}

export const mapCartItems = (items: DatabaseCartItem[], clubDiscountPercentage = 0, giftWrapFee = 50): CartItem[] => {
    return items.map((item) => {
        const product = item.product
        const variant = item.variant

        let thumbnail = fixUrl(product?.image_url)
        if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
            const firstImg = product.images[0]
            if (typeof firstImg === 'string') {
                thumbnail = fixUrl(firstImg)
            } else if (firstImg && typeof firstImg === 'object' && 'url' in firstImg) {
                thumbnail = fixUrl((firstImg as { url: string }).url) || thumbnail
            }
        }

        const originalPrice = Number(variant?.price || product?.price || 0)
        const hasClubDiscount = clubDiscountPercentage > 0
        const discountedPrice = hasClubDiscount
            ? Math.round(originalPrice * (1 - clubDiscountPercentage / 100))
            : originalPrice

        const metadata = (item.metadata || {}) as Record<string, unknown>

        // Check if this specific line is a Gift Wrap line
        const isGiftWrapLine = metadata.gift_wrap_line === true
        const itemGiftWrapFee = Number(metadata.gift_wrap_fee || giftWrapFee)

        // If it's a gift wrap line, the price is ONLY the fee
        // Otherwise, it's the product price (without the fee)
        const finalUnitPrice = isGiftWrapLine ? itemGiftWrapFee : discountedPrice
        const finalOriginalUnitPrice = isGiftWrapLine ? itemGiftWrapFee : originalPrice

        return {
            ...item,
            title: isGiftWrapLine ? "Gift Wrap" : (variant?.title || product?.name || "Product"),
            product_title: isGiftWrapLine ? "Gift Wrap" : (product?.name || "Product"),
            product_handle: isGiftWrapLine ? undefined : product?.handle,
            thumbnail: isGiftWrapLine ? undefined : (thumbnail ?? undefined),
            unit_price: finalUnitPrice,
            original_unit_price: finalOriginalUnitPrice,
            total: finalUnitPrice * item.quantity,
            original_total: finalOriginalUnitPrice * item.quantity,
            subtotal: finalUnitPrice * item.quantity,
            has_club_discount: !isGiftWrapLine && hasClubDiscount,
            product: product ?? undefined,
            variant: variant ?? undefined
        }
    })
}

export interface CalculateTotalsParams {
    items: CartItem[]
    promotion: Promotion | null
    shippingMethods: CartShippingMethod[] | null
    availableRewards: number
    cartMetadata: Record<string, unknown>
    isClubMember: boolean
    clubDiscountPercentage: number
    defaultShippingOption?: CartShippingMethod | null
}

export const calculateCartTotals = ({
    items,
    promotion,
    shippingMethods,
    availableRewards,
    cartMetadata,
    isClubMember,
    clubDiscountPercentage,
    defaultShippingOption,
}: CalculateTotalsParams) => {
    const item_subtotal = items.reduce((sum, item) => sum + item.total, 0)
    const original_subtotal = items.reduce((sum, item) => sum + (item.original_total || item.total), 0)
    const club_savings = original_subtotal - item_subtotal

    let discount_total = 0
    let isFreeShipping = false

    if (promotion && promotion.is_active) {
        const now = new Date()
        const startsAt = promotion.starts_at ? new Date(promotion.starts_at) : null
        const endsAt = promotion.ends_at ? new Date(promotion.ends_at) : null

        if ((!startsAt || startsAt <= now) && (!endsAt || endsAt >= now)) {
            if (item_subtotal >= (promotion.min_order_amount || 0)) {
                if (promotion.type === "percentage") {
                    discount_total = Math.round((item_subtotal * promotion.value) / 100)
                } else if (promotion.type === "fixed") {
                    discount_total = Math.min(promotion.value, item_subtotal)
                } else if (promotion.type === "free_shipping") {
                    isFreeShipping = true
                }
            }
        }
    }

    let shipping_total = 0
    if (Array.isArray(shippingMethods) && shippingMethods.length > 0) {
        const method = shippingMethods[0]
        const baseAmount = Number(method.amount || 0)
        const threshold = method.min_order_free_shipping

        if (isFreeShipping) {
            shipping_total = 0
        } else if (threshold !== null && threshold !== undefined && item_subtotal >= Number(threshold)) {
            shipping_total = 0
        } else {
            shipping_total = baseAmount
        }
    } else if (defaultShippingOption && !isFreeShipping) {
        // Fallback to default option if no method selected yet
        const threshold = defaultShippingOption.min_order_free_shipping
        if (threshold !== null && threshold !== undefined && item_subtotal >= Number(threshold)) {
            shipping_total = 0
        } else {
            shipping_total = Number(defaultShippingOption.amount || 0)
        }
    }

    const rewards_to_apply = Math.min(
        Number(cartMetadata.rewards_to_apply || 0),
        availableRewards,
        item_subtotal + shipping_total - discount_total
    )
    const rewards_discount = rewards_to_apply

    const tax_total = 0
    const total = Math.max(0, item_subtotal + tax_total + shipping_total - discount_total - rewards_discount)

    return {
        item_subtotal,
        subtotal: item_subtotal,
        tax_total,
        shipping_total,
        total,
        discount_total,
        gift_card_total: 0,
        shipping_subtotal: shipping_total,
        club_savings,
        is_club_member: isClubMember,
        club_discount_percentage: clubDiscountPercentage,
        rewards_to_apply,
        rewards_discount,
        available_rewards: availableRewards,
    }
}
