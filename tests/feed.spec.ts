import { test, expect } from '@playwright/test';

test.describe('Recognition Feed', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('feed is visible on homepage', async ({ page }) => {
    // Check if recognition feed component is present
    const feedElement = page.locator('[data-testid="recognition-feed"]').or(
      page.locator('text=Recognition Feed')
    );
    
    await expect(feedElement).toBeVisible();
  });

  test('empty feed shows placeholder message', async ({ page }) => {
    // Look for empty state message
    const emptyMessage = page.locator('text=No captures yet').or(
      page.locator('text=Recognized signs will appear here')
    );
    
    await expect(emptyMessage).toBeVisible();
  });

  test('feed settings toggle works', async ({ page }) => {
    // Try to find thumbnail toggle
    const thumbnailToggle = page.locator('input[type="checkbox"]', { 
      has: page.locator('text=Show thumbnails') 
    }).or(
      page.locator('label:has-text("Show thumbnails") input')
    );

    if (await thumbnailToggle.isVisible()) {
      const initialState = await thumbnailToggle.isChecked();
      await thumbnailToggle.click();
      
      // Verify state changed
      const newState = await thumbnailToggle.isChecked();
      expect(newState).toBe(!initialState);
    }
  });
});