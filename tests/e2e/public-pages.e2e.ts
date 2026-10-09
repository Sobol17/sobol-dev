import { expect, test } from '@playwright/test';

test('confirmation shows a valid public reference, next steps and the shared navigation', async ({
	page
}) => {
	await page.goto('/thanks?id=CDFGHJ');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Бриф отправлен');
	await expect(page.getByText('CDFGHJ', { exact: true })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Что будет дальше' })).toBeVisible();
	await expect(page.locator('header')).toHaveCount(1);
	await expect(page.locator('footer')).toHaveCount(1);
	await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
	await page.getByRole('link', { name: 'На главную', exact: true }).click();
	await expect(page).toHaveURL('/');
});

test('confirmation handles missing and invalid references without echoing query text', async ({
	page
}) => {
	for (const query of ['', '?id=invalid-reference', '?id=%3Cscript%3E']) {
		await page.goto(`/thanks${query}`);
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Бриф отправлен');
		await expect(page.getByText('Номер заявки')).toHaveCount(0);
		await expect(page.locator('main')).not.toContainText('invalid-reference');
		await expect(page.locator('main')).not.toContainText('<script>');
	}
});

test('404 keeps the site shell and working exits at 360px', async ({ page }) => {
	await page.setViewportSize({ width: 360, height: 800 });
	const response = await page.goto('/missing-public-page');
	expect(response?.status()).toBe(404);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Такой страницы нет');
	await expect(page.locator('header')).toHaveCount(1);
	await expect(page.locator('footer')).toHaveCount(1);
	expect(
		await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
	).toBeLessThanOrEqual(1);
	await page.getByRole('link', { name: 'Обсудить проект', exact: true }).click();
	await expect(page).toHaveURL('/#brief');
	await expect(page.locator('#brief')).toBeInViewport();
});
