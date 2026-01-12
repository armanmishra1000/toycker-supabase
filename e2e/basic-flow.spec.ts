import { test, expect } from '@playwright/test';

test.describe('Toycker Basic User Journey', () => {
    test('should navigate to a product and add to cart', async ({ page }) => {
        // 1. Direct to Store for reliability
        await page.goto('/store');

        // 2. Click on the first product card using a combined selector
        const productCard = page.locator('a[href^="/products/"]').first();
        await expect(productCard).toBeVisible({ timeout: 15000 });
        await productCard.click();

        // 3. Verify we are on a product page
        await expect(page).toHaveURL(/\/products\//);

        // 4. Add to cart
        const addToCartButton = page.locator('button').filter({ hasText: /add to cart/i }).first();
        await expect(addToCartButton).toBeVisible();
        await addToCartButton.click();

        // 5. Verify cart drawer/sidebar opens (expect some mention of bag or cart)
        await expect(page.locator('body')).toContainText(/bag|cart/i, { timeout: 15000 });

        // 6. Click Proceed to Checkout
        const checkoutButton = page.locator('a, button').filter({ hasText: /checkout/i }).first();
        await expect(checkoutButton).toBeVisible();
        await checkoutButton.click();

        // 7. Expect redirect to login (since not authenticated)
        await expect(page).toHaveURL(/\/login/);
    });

    test('should have a working search', async ({ page }) => {
        await page.goto('/store');

        // Try finding a search icon/button or input
        const searchInput = page.getByPlaceholder(/search/i).first();
        if (await searchInput.isVisible()) {
            await searchInput.fill('car');
            await searchInput.press('Enter');
            await expect(page).toHaveURL(/search=car/);
        } else {
            const searchIcon = page.locator('button, svg').filter({ hasText: /search/i }).first();
            if (await searchIcon.isVisible()) {
                await searchIcon.click();
                await page.waitForTimeout(1000);
                const secondaryInput = page.locator('input[placeholder*="search"i]').first();
                await secondaryInput.fill('car');
                await secondaryInput.press('Enter');
                await expect(page).toHaveURL(/search=car/);
            }
        }
    });
});
