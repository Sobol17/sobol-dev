import { expect, type Page } from '@playwright/test';
import { E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD } from '../../scripts/e2e-credentials';

/** Signs in through the real login form: the admin has no back door in tests either. */
export async function loginAsAdmin(page: Page): Promise<void> {
	await page.goto('/login');
	await page.getByLabel('Почта').fill(E2E_ADMIN_EMAIL);
	await page.getByLabel('Пароль').fill(E2E_ADMIN_PASSWORD);
	await page.getByRole('button', { name: 'Войти' }).click();
	await expect(page).toHaveURL(/\/admin/);
}

/** Follow a newly submitted lead through the status filters in the real workspace. */
export async function qualifyLead(page: Page, publicId: string, name: string): Promise<void> {
	const row = page.getByRole('row').filter({ hasText: publicId });
	await row.getByRole('button', { name: 'В работу', exact: true }).click();
	await expect(row.getByText('В работе', { exact: true })).toBeVisible();
	await page.goto('/admin/leads?' + new URLSearchParams({ search: name, status: 'new' }));
	await expect(page.getByText('Заявок не найдено', { exact: true })).toBeVisible();
	await page.goto('/admin/leads?' + new URLSearchParams({ search: name, status: 'qualifying' }));
	await expect(page.getByRole('table').getByText(publicId, { exact: true })).toBeVisible();
}
