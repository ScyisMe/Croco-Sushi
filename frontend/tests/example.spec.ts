import { test, expect } from '@playwright/test';

test('homepage has correct title', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Croco Sushi/);
});

test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');

    // Wait for page to fully load with network requests
    await page.waitForLoadState('networkidle');

    // Check that the page has content (check for any product cards or main content)
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });

    // Check for fire emoji (used in popular products section)
    const fireEmoji = page.locator('text=/🔥/');
    await expect(fireEmoji).toBeVisible({ timeout: 10000 });
});
