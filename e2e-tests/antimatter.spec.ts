import { test, expect } from '@playwright/test';

test.describe('AntiMatter Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to load
    await page.waitForSelector('main');
  });

  test('should load the dashboard with correct branding', async ({ page }) => {
    // Check for "BREE" in the sidebar/header area
    await expect(page.locator('.sidebar').getByText('BREE')).toBeVisible();
    await expect(page.locator('.sidebar').getByText('ANTIMATTER')).toBeVisible();
  });

  test('should show health monitor services', async ({ page }) => {
    await expect(page.getByText('Real-time Service Status')).toBeVisible();
    await expect(page.locator('.service-card')).toHaveCount(4);
  });

  test('should navigate to Explorer tab', async ({ page }) => {
    await page.getByRole('button', { name: /Explorer/ }).click();
    await expect(page.getByText('Database Explorer')).toBeVisible();
  });

  test('should navigate to AgentX tab', async ({ page }) => {
    await page.getByRole('button', { name: /AgentX/ }).click();
    await expect(page.getByText('AgentX Intelligence Viewer')).toBeVisible();
    await expect(page.getByText('Creation Hub')).toBeVisible();
  });

  test('should navigate to NATS Events tab', async ({ page }) => {
    await page.getByRole('button', { name: /NATS Events/ }).click();
    await expect(page.getByText('Live DB Events')).toBeVisible();
  });

  test('should show NATS connection status in footer', async ({ page }) => {
    const footerStatus = page.locator('.sidebar .glass');
    await expect(footerStatus).toBeVisible();
    await expect(footerStatus.getByText('NATS Agent')).toBeVisible();
  });
});
