import { expect, test } from '@playwright/test';
import { loginAsAdmin } from '../helpers/e2e-admin';
import { E2E_ADMIN_EMAIL } from '../../scripts/e2e-credentials';

test('login errors stay generic and signing out removes access to the CRM', async ({ page }) => {
	await page.goto('/login');
	await page.getByLabel('Почта').fill(E2E_ADMIN_EMAIL);
	await page.getByLabel('Пароль').fill('wrong-password');
	await page.getByRole('button', { name: 'Войти', exact: true }).click();
	await expect(page.getByRole('alert')).toHaveText('Неверная почта или пароль');
	await loginAsAdmin(page);
	await expect(page.getByRole('heading', { name: 'Заявки', exact: true })).toBeVisible();
	await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
	await page.getByRole('button', { name: 'Выйти', exact: true }).click();
	await expect(page).toHaveURL('/login');
	await page.goto('/admin');
	await expect(page).toHaveURL(/\/login\?next=/);
});

test('a submitted lead remains readable as a card at 360px', async ({ page }) => {
	await page.setViewportSize({ width: 360, height: 800 });
	await page.goto('/#brief');
	await page.getByRole('radio', { name: 'Веб-сервис', exact: true }).check();
	await page
		.getByLabel('Что нужно получить в итоге?')
		.fill('Нужен сервис для обработки заказов с сайта и заявок из мессенджеров');
	await page.getByRole('button', { name: 'Дальше', exact: true }).click();
	await page.getByRole('button', { name: 'Дальше', exact: true }).click();
	await page.getByLabel('Как к вам обращаться').fill('Мобильный клиент');
	await page.getByLabel('Telegram', { exact: true }).fill('@mobile_client');
	await page.getByRole('button', { name: 'Отправить бриф', exact: true }).click();
	await expect(page).toHaveURL(/\/thanks\?id=/);
	const reference = new URL(page.url()).searchParams.get('id');
	await loginAsAdmin(page);
	const list = page.getByRole('list', { name: 'Список заявок' });
	await expect(list.getByText(reference!, { exact: true })).toBeVisible();
	await expect(list.getByRole('heading', { name: 'Мобильный клиент', exact: true })).toBeVisible();
	await expect(page.getByRole('table')).toBeHidden();
	expect(
		await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
	).toBeLessThanOrEqual(1);
	await page.getByRole('button', { name: 'Выйти', exact: true }).click();
	await expect(page.getByRole('heading', { name: 'Вход в CRM', exact: true })).toBeVisible();
	expect(
		await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
	).toBeLessThanOrEqual(1);
});
