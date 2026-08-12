import { expect, test } from '@playwright/test';
import { loginAsAdmin } from '../helpers/e2e-admin';

const SUMMARY = 'Личный кабинет дилера с заказами, остатками и выгрузкой документов в 1С.';
const BODY = '## Задача\n\nЗаказы приходили в почту и терялись между менеджерами.';

test.describe('projects admin', () => {
	test('the owner creates a case, publishes it and sees it in the list', async ({ page }) => {
		await loginAsAdmin(page);

		await page.goto('/admin/projects');
		await page.getByRole('link', { name: 'Новый кейс' }).first().click();
		await expect(page).toHaveURL(/\/admin\/projects\/new$/);

		await page.getByLabel('Заголовок').fill('Панель дилера');
		await page.getByLabel('Короткое описание').fill(SUMMARY);
		await page.getByLabel('Текст кейса').fill(BODY);
		await page.getByLabel('Стек').fill('SvelteKit, TypeScript');
		await page.getByRole('button', { name: 'Создать черновик' }).click();

		await expect(page).toHaveURL(/\/admin\/projects\/[0-9a-f-]{36}$/);
		await expect(page.getByText('Черновик')).toBeVisible();

		await page.getByRole('button', { name: 'Опубликовать' }).click();
		await expect(page.getByText('Опубликован', { exact: true })).toBeVisible();

		await page.getByRole('link', { name: 'К списку' }).click();
		await expect(page).toHaveURL(/\/admin\/projects$/);
		await expect(page.getByRole('link', { name: 'Панель дилера' })).toBeVisible();
		await expect(page.getByText('/panel-dilera')).toBeVisible();
	});

	test('a slug that is already taken comes back as a field error', async ({ page }) => {
		await loginAsAdmin(page);

		await page.goto('/admin/projects/new');
		await page.getByLabel('Заголовок').fill('Панель дилера 2');
		await page.getByLabel('Адрес страницы').fill('panel-dilera');
		await page.getByLabel('Короткое описание').fill(SUMMARY);
		await page.getByLabel('Текст кейса').fill(BODY);
		await page.getByRole('button', { name: 'Создать черновик' }).click();

		await expect(page).toHaveURL(/\/admin\/projects\/new$/);
		await expect(page.getByText('Такой адрес уже занят')).toBeVisible();
	});

	test('an anonymous visitor cannot reach the editor', async ({ page }) => {
		await page.goto('/admin/projects');
		await expect(page).toHaveURL(/\/login\?next=/);
	});
});
