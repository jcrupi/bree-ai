import { test, expect } from '@playwright/test'

const sidebar = (page: { locator: (s: string) => any }) => page.locator('aside')

test.describe('Admin console', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
  })

  test('loads dashboard with overview stats', async ({ page }) => {
    await expect(page.getByText('Welcome back')).toBeVisible()
    await expect(page.getByText('Total Assessed')).toBeVisible()
  })

  test('navigates to Jobs via sidebar', async ({ page }) => {
    await sidebar(page).getByRole('button', { name: 'Jobs' }).click()
    await expect(page).toHaveURL(/\/dashboard\/jobs/)
    await expect(page.getByText('Manage your job listings')).toBeVisible()
  })

  test('navigates to Candidates via sidebar', async ({ page }) => {
    await sidebar(page).getByRole('button', { name: 'Candidates' }).click()
    await expect(page).toHaveURL(/\/dashboard\/candidates/)
    await expect(page.getByText('Review and manage candidates')).toBeVisible()
  })

  test('navigates to Analytics via sidebar', async ({ page }) => {
    await sidebar(page).getByRole('button', { name: 'Analytics' }).click()
    await expect(page).toHaveURL(/\/dashboard\/analytics/)
    await expect(page.getByText('Total Assessments').first()).toBeVisible()
  })

  test('navigates to Settings via Admin button', async ({ page }) => {
    await sidebar(page).getByRole('button', { name: 'Admin' }).click()
    await expect(page).toHaveURL(/\/dashboard\/settings/)
  })

  test('full admin navigation flow', async ({ page }) => {
    // Dashboard
    await expect(page.getByText('Welcome back')).toBeVisible()

    // Jobs
    await sidebar(page).getByRole('button', { name: 'Jobs' }).click()
    await expect(page).toHaveURL(/\/dashboard\/jobs/)
    await expect(page.getByText('Senior DevOps Engineer').first()).toBeVisible()

    // Click into job detail
    await page.getByRole('link', { name: 'View Candidates' }).first().click()
    await expect(page).toHaveURL(/\/dashboard\/jobs\/1/)
    await expect(page.getByText('TechCorp')).toBeVisible()

    // Back to Jobs
    await sidebar(page).getByRole('button', { name: 'Jobs' }).click()
    await expect(page).toHaveURL(/\/dashboard\/jobs/)

    // Candidates
    await sidebar(page).getByRole('button', { name: 'Candidates' }).click()
    await expect(page).toHaveURL(/\/dashboard\/candidates/)
    await expect(page.getByText('Michael Chen')).toBeVisible()

    // Analytics
    await sidebar(page).getByRole('button', { name: 'Analytics' }).click()
    await expect(page).toHaveURL(/\/dashboard\/analytics/)

    // Settings
    await sidebar(page).getByRole('button', { name: 'Admin' }).click()
    await expect(page).toHaveURL(/\/dashboard\/settings/)

    // Back to Dashboard
    await sidebar(page).getByRole('button', { name: 'Dashboard' }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
  })
})
