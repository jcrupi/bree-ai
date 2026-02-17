import { test, expect } from '@playwright/test'

test.describe('Landing page', () => {
  test('loads and shows hero headline', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1, name: /Better Hiring for/i })).toBeVisible()
  })

  test('navigates to dashboard via See it', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /see it/i }).first().click()
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('navigates to assessment via Try as Candidate', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /try as candidate/i }).first().click()
    await expect(page).toHaveURL(/\/assess\/demo/)
  })
})
