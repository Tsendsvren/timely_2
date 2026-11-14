import { test, expect } from '@playwright/test';
import { MEMBER, login, trackApi } from './helpers.js';

// @crud — Task: Create → Read → Update → Delete (mock data, backend API-гүй)
test('@crud Даалгавар нэмэх → харах → засах → устгах', async ({ page }) => {
  const api = trackApi(page);
  await login(page, MEMBER);

  // CREATE
  await page.goto('/tasks/new');
  await expect(page.getByTestId('page-task-new')).toBeVisible();
  await page.getByLabel('Гарчиг').fill('Хустайн нуруу');
  await page.getByLabel('Deadline').fill('2026-12-31');
  await page.getByRole('button', { name: 'Нэмэх' }).click();

  // READ: жагсаалтад харагдана
  await expect(page.getByTestId('page-planner')).toBeVisible();
  await page.getByTestId('task-search').fill('Хустайн нуруу');
  await expect(page.getByTestId('task-item')).toHaveCount(1);
  await page.getByTestId('task-item').click();
  await expect(page.getByTestId('page-task-edit')).toBeVisible();
  await expect(page.getByLabel('Гарчиг')).toHaveValue('Хустайн нуруу');

  // UPDATE
  await page.getByLabel('Гарчиг').fill('Хустайн цогцолбор');
  await page.getByRole('button', { name: 'Хадгалах' }).click();
  await expect(page.getByTestId('page-planner')).toBeVisible();
  await page.getByTestId('task-search').fill('Хустайн нуруу');
  await expect(page.getByTestId('task-item')).toHaveCount(0);
  await page.getByTestId('task-search').fill('Хустайн цогцолбор');
  await expect(page.getByTestId('task-item')).toHaveCount(1);

  // DELETE
  await page.getByTestId('task-item').click();
  await page.getByRole('button', { name: 'Устгах', exact: true }).click();
  await page.getByRole('button', { name: 'Тийм, устгах' }).click();
  await expect(page.getByTestId('page-planner')).toBeVisible();
  await page.getByTestId('task-search').fill('Хустайн цогцолбор');
  await expect(page.getByTestId('task-item')).toHaveCount(0);

  expect(api).toEqual([]);
});
