import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
});

test('page loads', async ({ page }) => {
    await expect(page).toHaveTitle(/Task Manager/);
    await expect(page.getByTestId('task-list')).toBeVisible();
});

test('user can add a task', async ({ page }) => {
    const input = page.getByTestId('task-input');
    const submitBtn = page.getByTestId('task-submit');

    await input.fill('Write Playwright tests');
    await submitBtn.click();

    await expect(page.getByTestId('task-list')).toContainText('Write Playwright tests');
    await expect(input).toHaveValue('');
});

test('user cannot add a blank task', async ({ page }) => {
    const submitBtn = page.getByTestId('task-submit');
    await submitBtn.click();
    await expect(page.getByTestId('task-list')).not.toContainText('li');
});

test('user can complete a task', async ({ page }) => {
    const input = page.getByTestId('task-input');
    await input.fill('Complete me');
    await page.getByTestId('task-submit').click();

    const checkbox = page.locator('.task-checkbox').first();
    await checkbox.click();

    const taskItem = page.locator('li').first();
    await expect(taskItem).toHaveClass(/completed/);
});

test('user can delete a task', async ({ page }) => {
    const input = page.getByTestId('task-input');
    await input.fill('Delete me');
    await page.getByTestId('task-submit').click();

    await page.getByTestId('task-list').locator('.delete-btn').first().click();

    await expect(page.getByTestId('task-list')).not.toContainText('Delete me');
});

test('tasks persist after page reload', async ({ page }) => {
    const input = page.getByTestId('task-input');
    await input.fill('Persistent task');
    await page.getByTestId('task-submit').click();

    await expect(page.getByTestId('task-list')).toContainText('Persistent task');

    await page.reload();

    await expect(page.getByTestId('task-list')).toContainText('Persistent task');
});