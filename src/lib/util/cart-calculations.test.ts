import { describe, it, expect } from 'vitest'
import { calculateCartTotals, mapCartItems, DatabaseCartItem } from './cart-calculations'
import { CartItem, Promotion } from '@/lib/supabase/types'

describe('Cart Calculations', () => {
    const mockItems: CartItem[] = [
        {
            id: 'item-1',
            unit_price: 100,
            quantity: 2,
            total: 200,
            original_unit_price: 100,
            original_total: 200,
        } as CartItem,
        {
            id: 'item-2',
            unit_price: 50,
            quantity: 1,
            total: 50,
            original_unit_price: 50,
            original_total: 50,
        } as CartItem,
    ]

    it('calculates basic subtotal correctly', () => {
        const totals = calculateCartTotals({
            items: mockItems,
            promotion: null,
            shippingMethods: null,
            availableRewards: 0,
            cartMetadata: {},
            isClubMember: false,
            clubDiscountPercentage: 0,
        })

        expect(totals.item_subtotal).toBe(250)
        expect(totals.total).toBe(250)
    })

    it('applies percentage discount correctly', () => {
        const mockPromotion: Promotion = {
            id: 'promo-1',
            type: 'percentage',
            value: 10,
            is_active: true,
            min_order_amount: 100,
            starts_at: null,
            ends_at: null,
        } as Promotion

        const totals = calculateCartTotals({
            items: mockItems,
            promotion: mockPromotion,
            shippingMethods: null,
            availableRewards: 0,
            cartMetadata: {},
            isClubMember: false,
            clubDiscountPercentage: 0,
        })

        expect(totals.discount_total).toBe(25) // 10% of 250
        expect(totals.total).toBe(225)
    })

    it('respects min order amount for promotions', () => {
        const mockPromotion: Promotion = {
            id: 'promo-1',
            type: 'percentage',
            value: 10,
            is_active: true,
            min_order_amount: 500, // Higher than subtotal
            starts_at: null,
            ends_at: null,
        } as Promotion

        const totals = calculateCartTotals({
            items: mockItems,
            promotion: mockPromotion,
            shippingMethods: null,
            availableRewards: 0,
            cartMetadata: {},
            isClubMember: false,
            clubDiscountPercentage: 0,
        })

        expect(totals.discount_total).toBe(0)
        expect(totals.total).toBe(250)
    })

    it('calculates shipping correctly', () => {
        const mockShippingMethods = [
            {
                shipping_option_id: 'ship-1',
                name: 'Standard',
                amount: 50,
                min_order_free_shipping: 500,
            }
        ]

        const totals = calculateCartTotals({
            items: mockItems,
            promotion: null,
            shippingMethods: mockShippingMethods,
            availableRewards: 0,
            cartMetadata: {},
            isClubMember: false,
            clubDiscountPercentage: 0,
        })

        expect(totals.shipping_total).toBe(50)
        expect(totals.total).toBe(300)
    })

    it('applies free shipping threshold', () => {
        const mockShippingMethods = [
            {
                shipping_option_id: 'ship-1',
                name: 'Standard',
                amount: 50,
                min_order_free_shipping: 200, // Lower than subtotal (250)
            }
        ]

        const totals = calculateCartTotals({
            items: mockItems,
            promotion: null,
            shippingMethods: mockShippingMethods,
            availableRewards: 0,
            cartMetadata: {},
            isClubMember: false,
            clubDiscountPercentage: 0,
        })

        expect(totals.shipping_total).toBe(0)
        expect(totals.total).toBe(250)
    })

    it('applies rewards discount correctly', () => {
        const totals = calculateCartTotals({
            items: mockItems,
            promotion: null,
            shippingMethods: null,
            availableRewards: 1000,
            cartMetadata: { rewards_to_apply: 100 },
            isClubMember: false,
            clubDiscountPercentage: 0,
        })

        expect(totals.rewards_discount).toBe(100)
        expect(totals.total).toBe(150)
    })

    it('limits rewards discount to order total', () => {
        const totals = calculateCartTotals({
            items: mockItems,
            promotion: null,
            shippingMethods: null,
            availableRewards: 1000,
            cartMetadata: { rewards_to_apply: 500 }, // More than subtotal (250)
            isClubMember: false,
            clubDiscountPercentage: 0,
        })

        expect(totals.rewards_discount).toBe(250)
        expect(totals.total).toBe(0)
    })
})
