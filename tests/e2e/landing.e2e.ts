import { expect, test } from '@playwright/test';
test('navigation, examples and primary CTA lead to their sections', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText(
		'Автоматизируем работу с заявками и заказами'
	);
	for (const [name, id] of [
		['Польза для бизнеса', 'benefits'],
		['Решения', 'services'],
		['Примеры', 'cases'],
		['Как работаем', 'process']
	]) {
		await page.locator('header').getByRole('link', { name, exact: true }).click();
		await expect(page.locator(`#${id}`)).toBeInViewport();
	}
	await page.getByText('Сколько стоит проект?', { exact: true }).click();
	await expect(page.getByText('Стоимость зависит от сценариев')).toBeVisible();
	await page.locator('header').getByRole('link', { name: 'Обсудить задачу' }).click();
	await expect(page.locator('#brief')).toBeInViewport();
});
test('a service preselects the form and keeps attribution', async ({ page }) => {
	await page.goto('/?utm_source=telegram');
	const booking = page.locator('.service-item').nth(2);
	await booking.locator('summary').click();
	await booking.getByRole('link', { name: 'Обсудить такую задачу' }).click();
	await expect(page.getByRole('radio', { name: 'Telegram Mini App', exact: true })).toBeChecked();
	expect(new URL(page.url()).searchParams.get('utm_source')).toBe('telegram');
	await expect(page.locator('#brief')).toBeInViewport();
});
test('mobile navigation closes on Escape and the layout fits 360px', async ({ page }) => {
	await page.setViewportSize({ width: 360, height: 800 });
	await page.goto('/');
	const menu = page.getByRole('button', { name: 'Меню', exact: true });
	await menu.click();
	await expect(menu).toHaveAttribute('aria-expanded', 'true');
	await page.keyboard.press('Escape');
	await expect(menu).toHaveAttribute('aria-expanded', 'false');
	expect(
		await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
	).toBeLessThanOrEqual(1);
});
test('static concepts show their scope and the sitemap contains only the landing', async ({
	page,
	request
}) => {
	await page.goto('/');
	await expect(page.locator('#cases')).toContainText('Концепты интерфейсов, не клиентские кейсы');
	await expect(page.locator('#cases img')).toHaveCount(2);
	await page.locator('.project-details summary').first().click();
	await expect(page.locator('.project-details').first()).toContainText('Наша роль');
	const xml = await (await request.get('/sitemap.xml')).text();
	expect(xml.match(/<loc>/g)).toHaveLength(1);
	expect(xml).toContain('<loc>http://localhost:4173/</loc>');
	expect((await request.get('/lead')).status()).toBe(404);
});
