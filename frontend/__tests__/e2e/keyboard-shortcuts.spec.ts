import { test, expect } from '@playwright/test';

test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for page to load
    await page.waitForSelector('text=Medical Intake Assistant', { timeout: 10000 });
  });

  test('should show command menu with Cmd+K', async ({ page, browserName }) => {
    const modifier = browserName === 'webkit' ? 'Meta' : 'Control';

    // Press Cmd+K (or Ctrl+K on non-Mac)
    await page.keyboard.press(`${modifier}+KeyK`);

    // Command menu should be visible
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 2000 });
  });

  test('should have connection status indicator', async ({ page }) => {
    // Check for connection badge
    const badge = page.locator('text=/Connected|Disconnected/').first();
    await expect(badge).toBeVisible();
  });

  test('should display voice orb', async ({ page }) => {
    // Check for voice orb button
    const voiceButton = page.locator('button[aria-label*="voice"]').first();
    await expect(voiceButton).toBeVisible();
  });

  test('should show conversation area', async ({ page }) => {
    // Check for conversation container
    const conversation = page.locator('text=Start speaking to begin');
    await expect(conversation).toBeVisible();
  });

  test('should be accessible', async ({ page }) => {
    // Check for main region
    const main = page.locator('main[role="main"]');
    await expect(main).toBeVisible();

    // Check for ARIA labels
    const voiceButton = page.locator('button[aria-label*="voice"]').first();
    await expect(voiceButton).toHaveAttribute('aria-label');
  });
});
