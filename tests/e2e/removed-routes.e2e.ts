import { expect, test } from '@playwright/test';
import { loginAsAdmin } from '../helpers/e2e-admin';
test('retired routes return 404 and the admin only lists leads', async ({ page }) => {
	await loginAsAdmin(page);
	await expect(page.locator('nav').getByRole('link')).toHaveText(['Заявки']);
	for (const path of ['/cases', '/admin/projects', '/admin/media', '/media/missing.png']) {
		const response = await page.goto(path);
		expect(response?.status()).toBe(404);
	}
});
