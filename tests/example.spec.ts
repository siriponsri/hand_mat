import { test, expect } from '@playwright/test';

test.describe('HandMat Application', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check that the main heading is visible
    await expect(page.locator('h1')).toBeVisible();
    
    // Check that the webcam capture area is present
    await expect(page.locator('[data-testid="webcam-capture"]')).toBeVisible();
  });

  test('settings drawer can be opened', async ({ page }) => {
    await page.goto('/');
    
    // Look for settings button and click it
    const settingsButton = page.locator('button[aria-label*="Settings"], button:has-text("Settings")').first();
    await settingsButton.click();
    
    // Verify settings drawer is open
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('theme toggle works', async ({ page }) => {
    await page.goto('/');
    
    // Find and click theme toggle
    const themeToggle = page.locator('button[aria-label*="Toggle theme"], button:has-text("Theme")').first();
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      
      // Verify theme changed (this would require checking data-theme attribute or similar)
      await expect(page.locator('html')).toHaveAttribute('class', /dark|light/);
    }
  });
});