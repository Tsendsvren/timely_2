import { test, expect } from '@playwright/test';
import { MEMBER, ADMIN, login, trackApi } from './helpers.js';

// @role — member/admin эрхийн ялгаа (mock login)
test('@role Нэвтрээгүй хэрэглэгч /authenticate руу шилжинэ', async ({ page }) => {
  await page.goto('/planner');
  await expect(page.getByTestId('page-authenticate')).toBeVisible();
});

test('@role Member /admin/shop-д орж чадахгүй', async ({ page }) => {
  const api = trackApi(page);
  await login(page, MEMBER);
  await page.goto('/admin/shop');
  await expect(page.getByTestId('page-admin-shop')).toHaveCount(0);
  await expect(page.getByTestId('page-dashboard')).toBeVisible();
  expect(api).toEqual([]);
});

test('@role Admin /admin/shop-д орж бараа нэмнэ', async ({ page }) => {
  await login(page, ADMIN);
  await page.goto('/admin/shop');
  await expect(page.getByTestId('page-admin-shop')).toBeVisible();
  await expect(page.getByTestId('shop-form')).toBeVisible();
});

test('@role Reload хийхэд нэвтрэлт хадгалагдана', async ({ page }) => {
  await login(page, MEMBER);
  await page.goto('/planner');
  await page.reload();
  await expect(page.getByTestId('page-planner')).toBeVisible();
});
