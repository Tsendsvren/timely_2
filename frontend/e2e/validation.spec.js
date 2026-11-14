import { test, expect } from '@playwright/test';
import { MEMBER, login, trackApi } from './helpers.js';

// @validation — хоосон/буруу утгад алдаа харагдаж, шинэ record үүсэхгүй
test('@validation Хоосон гарчигтай даалгавар хадгалагдахгүй', async ({ page }) => {
  const api = trackApi(page);
  await login(page, MEMBER);
  await page.goto('/tasks/new');
  await page.getByRole('button', { name: 'Нэмэх' }).click();
  await expect(page.getByText('Гарчиг заавал оруулна уу')).toBeVisible();
  await expect(page.getByTestId('page-task-new')).toBeVisible(); // шилжээгүй

  await page.goto('/planner');
  await page.getByTestId('task-search').fill('   ');
  expect(api).toEqual([]);
});

test('@validation Буруу имэйл/богино нууц үгтэй бүртгэл амжилтгүй', async ({ page }) => {
  await page.goto('/authenticate');
  await page.getByTestId('auth-mode-signup').click();
  await page.getByTestId('field-email').fill('buruu-email');
  await page.getByTestId('field-password').fill('123');
  await page.getByTestId('submit').click();
  await expect(page.getByTestId('page-authenticate')).toBeVisible();
  await expect(page.getByTestId('page-dashboard')).toHaveCount(0);
});
