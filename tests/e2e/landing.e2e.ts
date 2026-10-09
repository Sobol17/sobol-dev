import { expect, test } from '@playwright/test';

test.describe('landing', () => {
	test('every anchor and both calls to action lead somewhere', async ({ page }) => {
		await page.goto('/');
		await expect(
			page.getByRole('heading', {
				level: 1,
				name: 'Сайты, приложения и Telegram Mini Apps'
			})
		).toBeVisible();

		await page.getByRole('link', { name: 'Услуги' }).click();
		await expect(page.locator('#services')).toBeInViewport();

		await page.getByRole('link', { name: 'Процесс' }).click();
		await expect(page.locator('#process')).toBeInViewport();

		await page.getByRole('link', { name: 'Вопросы' }).click();
		await expect(page.locator('#faq')).toBeInViewport();

		await page.getByText('Сколько стоит проект?').click();
		await expect(page.getByText('Стоимость зависит от сценариев')).toBeVisible();

		await page.getByRole('link', { name: 'Смотреть работы' }).click();
		await expect(page).toHaveURL(/#cases$/);

		await page.goto('/');
		await page.getByRole('link', { name: 'Обсудить проект' }).first().click();
		await expect(page).toHaveURL(/\/lead$/);
	});

	test('the service link opens the form with a matching type', async ({ page }) => {
		await page.goto('/');
		await page.locator('#services').getByRole('link', { name: 'Обсудить задачу' }).last().click();

		await expect(page).toHaveURL(/\/lead\?type=tma$/);
	});

	test('mobile navigation closes on Escape', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/');
		const menu = page.getByRole('button', { name: 'Меню' });
		await menu.click();
		await expect(menu).toHaveAttribute('aria-expanded', 'true');
		await page.keyboard.press('Escape');
		await expect(menu).toHaveAttribute('aria-expanded', 'false');
	});

	test('static examples are labelled as concepts', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('#cases')).toContainText('Концепты интерфейсов, не клиентские кейсы');
		await expect(page.locator('#cases').getByRole('heading', { level: 3 })).toHaveCount(2);
	});

	test('the page fits a 360px screen without sideways scrolling', async ({ page }) => {
		await page.setViewportSize({ width: 360, height: 800 });
		await page.goto('/');

		const overflow = await page.evaluate(
			() => document.documentElement.scrollWidth - document.documentElement.clientWidth
		);
		expect(overflow).toBeLessThanOrEqual(1);
	});
});
