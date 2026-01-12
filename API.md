# 🌐 API Documentation - Toycker Platform

This document describes the key internal APIs and data structures used for the Toycker storefront.

## 🛍️ Cart API (`src/lib/data/cart.ts`)

### `retrieveCart(cartId?: string)`
- **Returns**: `Promise<Cart | null>`
- **Description**: Fetches the current cart by ID or from cookies. Includes calculated totals and mapped items.

### `addItem({ cartId, variantId, quantity })`
- **Description**: Adds an item to the cart. Syncs with Supabase database. Handles inventory checks.

### `calculateCartTotals(params)`
- **Location**: `src/lib/util/cart-calculations.ts`
- **Description**: pure utility function to calculate subtotal, shipping, discounts, and rewards.

---

## 🧸 Product API (`src/lib/data/products.ts`)

### `listProducts({ page, limit, categoryId })`
- **Returns**: `Promise<{ products: Product[], count: number }>`
- **Description**: Fetches paginated list of products. Supports filtering by category/collection.

### `getProductByHandle(handle: string)`
- **Returns**: `Promise<Product | null>`
- **Description**: Fetches detailed product info for single product pages.

---

## 👤 Customer API (`src/lib/data/customer.ts`)

### `login(currentState, formData)`
- **Pattern**: Server Action
- **Returns**: `ActionResult`
- **Description**: Authenticates user using Supabase Auth.

### `signup(currentState, formData)`
- **Pattern**: Server Action
- **Returns**: `ActionResult`
- **Description**: Registers new user and handles email confirmation flow.

---

## 💳 Payment API (`src/app/api/payu/callback/route.ts`)

### `POST /api/payu/callback`
- **Description**: Webhook handler for PayU payment notifications.
- **Security**: 
  - Hash verification (`SHA-512`).
  - Idempotency check on order status.
  - Burst rate limiting and deduplication.

---

## 🔒 Security & Auth

All sensitive data operations are protected via **Supabase Row Level Security (RLS)**.
- **Carts**: Users can only see their own `user_id` linked cart.
- **Orders**: Users can only fetch orders where `customer_id` matches their UID.
- **Admin**: Routes protected by `ensureAdmin()` server-side middleware.

---

*Last Updated: January 12, 2026*
