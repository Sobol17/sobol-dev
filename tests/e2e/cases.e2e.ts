import { expect, test, type Page } from '@playwright/test';
import { loginAsAdmin } from '../helpers/e2e-admin';

const TITLE = 'Витрина кейсов';
const SUMMARY = 'Публичная витрина проектов с фильтром по направлению и страницей каждого кейса.';
const BODY = '## Задача\n\nПоказать проекты так, чтобы клиент понял результат.\n\n- Список\n- Кейс';
const DRAFT_TITLE = 'Черновик витрины';

/** Creates a draft case through the admin editor. */
async function createCase(page: Page, title: string): Promise<void> {
	await page.goto('/admin/projects/new');
	await page.getByLabel('Заголовок').fill(title);
	await page.getByLabel('Короткое описание').fill(SUMMARY);
	await page.getByLabel('Текст кейса').fill(BODY);
	await page.getByLabel('Стек').fill('SvelteKit, TypeScript');
	await page.getByRole('button', { name: 'Создать черновик' }).click();
	await expect(page).toHaveURL(/\/admin\/projects\/[0-9a-f-]{36}$/);
}

test.describe('public cases', () => {
	test('a published case reaches the list, its page and the sitemap', async ({ page }) => {
		await loginAsAdmin(page);

		await createCase(page, TITLE);
		await page.getByRole('button', { name: 'Опубликовать' }).click();
		await expect(page.getByText('Опубликован', { exact: true })).toBeVisible();

		await createCase(page, DRAFT_TITLE);

		await page.goto('/cases');
		await expect(page.getByRole('heading', { name: TITLE })).toBeVisible();
		// The draft has no page and no card: publishing is the only way in.
		await expect(page.getByRole('heading', { name: DRAFT_TITLE })).toHaveCount(0);

		await page.getByRole('tab', { name: 'Мобильное приложение' }).click();
		await expect(page).toHaveURL(/\/cases\?category=mobile$/);
		await expect(page.getByText('В этой категории пока пусто')).toBeVisible();

		await page.getByRole('tab', { name: 'Все' }).click();
		await page.getByRole('heading', { name: TITLE }).click();
		await expect(page).toHaveURL(/\/cases\/[a-z0-9-]+$/);
		await expect(page.getByRole('heading', { level: 1, name: TITLE })).toBeVisible();
		await expect(page.getByRole('heading', { level: 2, name: 'Задача' })).toBeVisible();

		const slug = page.url().split('/').pop();
		const sitemap = await page.request.get('/sitemap.xml');
		expect(sitemap.ok()).toBe(true);
		const xml = await sitemap.text();
		expect(xml).toContain(`/cases/${slug}`);
		expect(xml).not.toContain('/admin');
	});

	test('an unknown slug answers with 404', async ({ page }) => {
		const response = await page.goto('/cases/net-takogo-keysa');
		expect(response?.status()).toBe(404);
	});

	test('robots keeps the admin and proposal links out of the index', async ({ request }) => {
		const response = await request.get('/robots.txt');
		const body = await response.text();

		expect(body).toContain('Disallow: /admin');
		expect(body).toContain('Disallow: /p/');
		expect(body).toContain('Sitemap: http://localhost:4173/sitemap.xml');
	});
});
