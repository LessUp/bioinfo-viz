import { test, expect } from '@playwright/test'

test('user can navigate from home to WES pipeline page', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('link', { name: '进入外显子流程演示' }).click()

  await expect(page.getByText('外显子组变异检测')).toBeVisible()
  await expect(page.getByText('流程简介')).toBeVisible()
  await expect(page.getByText('核心指标概览')).toBeVisible()
  await expect(page.getByText('质控')).toBeVisible()
})
