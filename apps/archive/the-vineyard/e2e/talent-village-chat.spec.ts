import { test, expect } from '@playwright/test'

const LEAD_URL =
  '/talent-village?role=expert&name=Johnny%20Vines&isLead=true&villageName=Happy%20Village&villageId=test-chat-1'

test.describe('Talent Village chat', () => {
  test('lead dashboard loads and Expert Vine Chat input is usable', async ({ page }) => {
    await page.goto(LEAD_URL)

    // Wait for join form or dashboard
    const joinButton = page.getByRole('button', { name: /join/i })
    if (await joinButton.isVisible()) {
      await joinButton.click()
    }

    // Wait for Lead Dashboard: Expert Vine Chat panel visible
    await expect(page.getByText('Expert Vine Chat').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Candidate Mirror').first()).toBeVisible({ timeout: 5_000 })

    // Find Expert Vine Chat message input (placeholder "Message the expert team...")
    const expertInput = page.getByPlaceholder('Message the expert team...')
    await expect(expertInput).toBeVisible({ timeout: 5_000 })

    // Type and send a message
    const message = 'E2E test message ' + Date.now()
    await expertInput.fill(message)
    await expect(expertInput).toHaveValue(message)

    // Click send (icon-only submit button)
    await expertInput.locator('xpath=ancestor::form[1]').locator('button[type="submit"]').click()

    // After send: input should clear (or message may appear if NATS is connected)
    await expect(expertInput).toHaveValue('')
  })

  test('Candidate Mirror input accepts text and Send works', async ({ page }) => {
    await page.goto(LEAD_URL)

    const joinButton = page.getByRole('button', { name: /join/i })
    if (await joinButton.isVisible()) {
      await joinButton.click()
    }

    await expect(page.getByText('Candidate Mirror').first()).toBeVisible({ timeout: 15_000 })

    // Lead has a Candidate Mirror input (placeholder "Message the candidate...")
    const mirrorInput = page.getByPlaceholder('Message the candidate...')
    await expect(mirrorInput).toBeVisible({ timeout: 5_000 })

    const message = 'Mirror test ' + Date.now()
    await mirrorInput.fill(message)
    await expect(mirrorInput).toHaveValue(message)

    await mirrorInput.locator('xpath=ancestor::form[1]').getByRole('button', { name: /send/i }).click()

    await expect(mirrorInput).toHaveValue('')
  })
})
