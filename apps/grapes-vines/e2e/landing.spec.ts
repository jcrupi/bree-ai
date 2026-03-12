import { test, expect } from '@playwright/test'

test.describe('Project Tracker', () => {
  test('loads dashboard and shows sidebar', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Dashboard').first()).toBeVisible({ timeout: 10_000 })
  })

  test('navigates to Team via sidebar', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /team/i }).first().click()
    await expect(page).toHaveURL(/\/team/)
  })

  test('navigates to Architecture', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /architecture/i }).first().click()
    await expect(page).toHaveURL(/\/architecture/)
  })
})
