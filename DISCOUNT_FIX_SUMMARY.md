# Production Migrations Summary - Discount Fix

## Applied Migrations (2026-01-10)

### 1. `20260110_add_discount_total_to_carts.sql`
**Purpose:** Adds the `discount_total` column to the `carts` table to store promo code discount amounts.

**Changes:**
- Adds `discount_total NUMERIC DEFAULT 0` column to `carts` table
- This column is populated when a promo code is applied via `applyPromotions()` function

### 2. `20260110_comprehensive_fix.sql`
**Purpose:** Updates the `create_order_with_payment` function to properly handle all discount types.

**Changes:**
- Reads `discount_total` from the `carts` table (promo discount)
- Calculates club savings based on club membership
- Stores all discount details in order metadata:
  - `promo_discount`: Discount from promo codes
  - `club_savings`: Discount from club membership
  - `rewards_used`: Reward points applied
  - `is_club_member`: Club membership status
  - `club_discount_percentage`: Club discount percentage
- Includes comprehensive NULL handling with COALESCE
- Adds RAISE NOTICE debugging statements
- Sets `search_path = ''` for security

## Code Changes

### `src/lib/data/cart.ts`
**Function:** `applyPromotions(codes: string[])`

**Changes:**
- Calculates discount amount based on promotion type (percentage/fixed)
- Updates both `promo_code` AND `discount_total` in carts table
- Resets `discount_total` to 0 when removing promo codes

## Result
All discount details (Club Savings, Reward Points, Promo Codes) are now accurately displayed in the Order Summary on both cart and order confirmation pages.

## Cleanup
Removed 18 debug SQL files and 5 superseded migration files.
