import { describe, it, expect, vi, beforeEach } from 'vitest'
import { completeCheckout } from './complete-checkout'
import * as cartData from '@lib/data/cart'
import { createClient } from '@/lib/supabase/server'

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}))

vi.mock('@lib/data/cart', () => ({
    initiatePaymentSession: vi.fn(),
    retrieveCart: vi.fn(),
    handlePostOrderLogic: vi.fn(),
}))

describe('completeCheckout Integration', () => {
    const mockCheckoutData = {
        cartId: 'test-cart-id',
        email: 'test@example.com',
        shippingAddress: {
            first_name: 'John',
            last_name: 'Doe',
            address_1: '123 Test St',
            city: 'Test City',
            postal_code: '12345',
            country_code: 'IN',
        },
        billingAddress: {
            first_name: 'John',
            last_name: 'Doe',
            address_1: '123 Test St',
            city: 'Test City',
            postal_code: '12345',
            country_code: 'IN',
        },
        paymentMethod: 'payu',
        rewardsToApply: 0,
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should successfully complete checkout', async () => {
        // Setup mock Supabase client
        const mockRpc = vi.fn().mockResolvedValue({ data: { order_id: 'new-order-id' }, error: null })
        const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'new-order-id', payment_collection: { payment_sessions: [{ provider_id: 'payu', data: { hash: 'abc' } }] } }, error: null })
        const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
        const mockFrom = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq: mockEq }) })

            ; (createClient as any).mockResolvedValue({
                rpc: mockRpc,
                from: mockFrom,
            })

            // Setup mock cart data
            ; (cartData.initiatePaymentSession as any).mockResolvedValue({})
            ; (cartData.retrieveCart as any).mockResolvedValue({ id: 'test-cart-id' })
            ; (cartData.handlePostOrderLogic as any).mockResolvedValue({})

        const result = await completeCheckout(mockCheckoutData as any)

        expect(result.success).toBe(true)
        expect(result.orderId).toBe('new-order-id')
        expect(result.paymentData).toEqual({ hash: 'abc' })

        // Verify steps were called
        expect(cartData.initiatePaymentSession).toHaveBeenCalled()
        expect(mockRpc).toHaveBeenCalledWith('create_order_with_payment', expect.anything())
    })

    it('should handle order creation failure', async () => {
        const mockRpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } })

            ; (createClient as any).mockResolvedValue({
                rpc: mockRpc,
            })

        const result = await completeCheckout(mockCheckoutData as any)

        expect(result.success).toBe(false)
        expect(result.error).toBe('DB Error')
    })

    it('should validate input data using Zod', async () => {
        const result = await completeCheckout({ cartId: '', email: 'invalid' } as any)
        expect(result.success).toBe(false)
        expect(result.error).toBeDefined()
    })
})
