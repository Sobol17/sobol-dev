import { expect, test } from '@playwright/test';

test('static demo keeps assets and navigation under its Pages prefix', async ({ page }) => {
	const failures: string[] = [];
	page.on('pageerror', (error) => failures.push(error.message));
	page.on('response', (response) => {
		if (response.status() >= 400) failures.push(response.url());
	});
	await page.goto('./');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Автоматизируем');
	await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
		'content',
		'noindex, nofollow'
	);
	await page.locator('#cases').scrollIntoViewIfNeeded();
	await expect
		.poll(() =>
			page
				.locator('#cases img')
				.evaluateAll((images) =>
					images.every((image) => (image as HTMLImageElement).naturalWidth > 0)
				)
		)
		.toBe(true);
	await page.getByRole('link', { name: 'Открыть CRM', exact: true }).click();
	await expect(page.getByRole('table')).toContainText('DEMO01');
	await expect(page.getByRole('complementary')).toBeVisible();
	await page.reload();
	await expect(page.getByRole('heading', { name: 'Заявки', exact: true })).toBeVisible();
	await page.getByRole('link', { name: 'На сайт', exact: true }).click();
	await expect(page).toHaveURL(/\/sobol-dev\/$/);
	expect(failures).toEqual([]);
});

test('demo brief validates locally and never sends form data', async ({ page }) => {
	const writes: string[] = [];
	page.on('request', (request) => {
		if (request.method() !== 'GET') writes.push(request.url());
	});
	await page.goto('./?type=tma#brief');
	await expect(page.getByRole('radio', { name: 'Telegram Mini App', exact: true })).toBeChecked();
	await page
		.getByLabel('Что нужно получить в итоге?')
		.fill('Демонстрационный сервис для записи клиентов на занятия');
	await page.getByRole('button', { name: 'Дальше', exact: true }).click();
	await page.getByRole('button', { name: 'Дальше', exact: true }).click();
	await page.getByRole('button', { name: 'Показать результат', exact: true }).click();
	await expect(page.getByLabel('Как к вам обращаться')).toHaveAttribute('aria-invalid', 'true');
	await page.getByLabel('Как к вам обращаться').fill('Демо-клиент');
	await page.getByLabel('Telegram', { exact: true }).fill('@demo_client');
	await page.getByRole('button', { name: 'Показать результат', exact: true }).click();
	await expect(page).toHaveURL(/\/sobol-dev\/thanks\/$/);
	await expect(
		page.getByText(
			'Это демонстрация интерфейса. Заявка не отправлена, введённые данные не сохранены.'
		)
	).toBeVisible();
	expect(writes).toEqual([]);
});

test('mobile demo CRM keeps navigation and cards usable', async ({ page }) => {
	await page.setViewportSize({ width: 360, height: 800 });
	await page.goto('./admin/');
	await expect(page.getByRole('list', { name: 'Список заявок' })).toContainText('DEMO01');
	expect(
		await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
	).toBeLessThanOrEqual(1);
	await page.getByRole('button', { name: 'Открыть навигацию' }).click();
	await expect(page.getByRole('dialog')).toBeVisible();
	await page.getByRole('dialog').getByRole('link', { name: 'Выйти из демо CRM' }).click();
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Автоматизируем');
});

test('unknown demo routes show the shared 404 and a working home link', async ({ page }) => {
	const response = await page.goto('./missing/');
	expect(response?.status()).toBe(404);
	await expect(page.getByRole('heading', { name: 'Такой страницы нет' })).toBeVisible();
	await page.getByRole('link', { name: 'На главную' }).click();
	await expect(page).toHaveURL(/\/sobol-dev\/$/);
});
