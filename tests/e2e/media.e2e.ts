import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { loginAsAdmin } from '../helpers/e2e-admin';

const SCREENSHOT = fileURLToPath(new URL('../fixtures/screenshot.png', import.meta.url));

test.describe('media library', () => {
	test('an upload is processed and becomes usable in a case gallery', async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/admin/media');

		await page.locator('input[type=file]').setInputFiles(SCREENSHOT);
		await expect(page.getByText('идёт обработка')).toBeVisible();

		// The worker picks the job up within a second; the list is refreshed by hand.
		await expect(async () => {
			await page.getByRole('button', { name: 'Обновить' }).click();
			await expect(page.getByText('Готово')).toBeVisible({ timeout: 1000 });
		}).toPass({ timeout: 15_000 });

		await expect(page.getByText('1200×800')).toBeVisible();

		const preview = page.locator('img').first();
		await expect(preview).toHaveJSProperty('naturalWidth', 400);
	});

	test('a file that is not an image is refused', async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/admin/media');

		await page.locator('input[type=file]').setInputFiles({
			name: 'payload.png',
			mimeType: 'image/png',
			buffer: Buffer.from('MZ not an image at all')
		});

		await expect(page.getByText('Это не изображение: PNG, JPEG, WebP или AVIF')).toBeVisible();
	});
});
