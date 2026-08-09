import { expect, test } from '@playwright/test';
import { E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD } from '../../scripts/e2e-credentials';

const GOAL = 'Нужен интернет-магазин на тридцать позиций с оплатой и выгрузкой в 1С';

test.describe('lead vertical', () => {
	test('a visitor submits a brief and the owner sees it in the admin', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('link', { name: 'Собрать бриф за 40 секунд' }).click();
		await expect(page).toHaveURL(/\/lead$/);

		await page.getByRole('radio', { name: 'Сайт' }).check();
		await page.getByRole('button', { name: 'Дальше' }).click();

		await page.getByLabel('Что нужно получить в итоге?').fill(GOAL);
		await page.getByRole('button', { name: 'Дальше' }).click();

		await page.getByLabel('Как к вам обращаться').fill('Игорь');
		await page.getByLabel('Telegram', { exact: true }).fill('@e2e_client');
		await page.getByRole('button', { name: 'Отправить бриф' }).click();

		await expect(page).toHaveURL(/\/thanks\?id=/);
		const publicId = new URL(page.url()).searchParams.get('id');
		expect(publicId).toMatch(/^[23456789CDFGHJKMNPQRTVWXY]{6}$/);
		await expect(page.getByText('Бриф отправлен')).toBeVisible();

		// The admin is guarded: an anonymous visit lands on the login page.
		await page.goto('/admin');
		await expect(page).toHaveURL(/\/login\?next=/);

		await page.getByLabel('Почта').fill(E2E_ADMIN_EMAIL);
		await page.getByLabel('Пароль').fill(E2E_ADMIN_PASSWORD);
		await page.getByRole('button', { name: 'Войти' }).click();

		await expect(page).toHaveURL(/\/admin$/);
		await expect(page.getByText(publicId!)).toBeVisible();
		await expect(page.getByText('Игорь')).toBeVisible();
	});

	test('the form works with javascript disabled', async ({ browser }) => {
		const context = await browser.newContext({
			javaScriptEnabled: false,
			baseURL: 'http://localhost:4173',
			reducedMotion: 'reduce'
		});
		const page = await context.newPage();

		await page.goto('/lead');
		// Without JS every step is on the page at once.
		await expect(page.getByLabel('Как к вам обращаться')).toBeVisible();

		await page.getByRole('radio', { name: 'Telegram Mini App' }).check();
		await page.getByLabel('Что нужно получить в итоге?').fill(GOAL);
		await page.getByLabel('Как к вам обращаться').fill('Без скриптов');
		await page.getByLabel('Почта').fill('nojs@example.test');
		await page.getByRole('button', { name: 'Отправить бриф' }).click();

		await expect(page).toHaveURL(/\/thanks\?id=/);
		await expect(page.getByText('Бриф отправлен')).toBeVisible();

		await context.close();
	});

	test('a bot that fills the honeypot gets nothing', async ({ page }) => {
		await page.goto('/lead');
		await page.getByRole('radio', { name: 'Сайт' }).check();
		await page.getByRole('button', { name: 'Дальше' }).click();
		await page.getByLabel('Что нужно получить в итоге?').fill(GOAL);
		await page.getByRole('button', { name: 'Дальше' }).click();
		await page.getByLabel('Как к вам обращаться').fill('Бот');
		await page.getByLabel('Telegram', { exact: true }).fill('@spam_bot');
		await page.locator('#website').fill('http://spam.example');
		await page.getByRole('button', { name: 'Отправить бриф' }).click();

		// The honeypot is a schema violation, so the submission never becomes a lead.
		await expect(page).toHaveURL(/\/lead$/);

		await page.goto('/login');
		await page.getByLabel('Почта').fill(E2E_ADMIN_EMAIL);
		await page.getByLabel('Пароль').fill(E2E_ADMIN_PASSWORD);
		await page.getByRole('button', { name: 'Войти' }).click();

		await expect(page.getByText('Бот')).toHaveCount(0);
	});
});

test('health endpoint answers', async ({ request }) => {
	const response = await request.get('/healthz');
	expect(response.ok()).toBe(true);
	expect(await response.json()).toMatchObject({ status: 'ok' });
});

// Prerendered pages are served as static files and never reach `handle`; Caddy adds the
// headers for those in production. This checks the route the application actually renders.
test('security headers are set on server-rendered routes', async ({ request }) => {
	const response = await request.get('/lead');
	expect(response.headers()['x-content-type-options']).toBe('nosniff');
	expect(response.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');
	expect(response.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
	expect(response.headers()['content-security-policy']).not.toContain("script-src 'unsafe-inline'");
});
