import { expect, test } from '@playwright/test';
import { loginAsAdmin } from '../helpers/e2e-admin';
import { mkdirSync } from 'node:fs';

test('the owner filters, changes status in one response and records a plain-text note', async ({
	page
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await loginAsAdmin(page);
	await expect(page).toHaveURL('/admin/leads');
	await page.getByLabel('Поиск', { exact: true }).fill('a4 клиент 20');
	await page.getByRole('button', { name: 'Найти', exact: true }).click();
	const row = page.getByRole('row').filter({ hasText: 'A4 Клиент 20' });
	await expect(row).toBeVisible();
	const command = page.waitForResponse(
		(response) => response.request().method() === 'POST' && response.url().includes('/remote/')
	);
	const requests: string[] = [];
	page.on('request', (request) => {
		if (!request.url().includes('/remote/')) return;
		// Hover can preload a card before the command starts.
		if (request.method() === 'POST' || requests.length) requests.push(request.method());
	});
	await row.getByRole('button', { name: 'В работу', exact: true }).click();
	const response = await command;
	expect(response.ok()).toBe(true);
	await expect(row.getByText('В работе', { exact: true })).toBeVisible();
	expect(requests).toEqual(['POST']);
	await page.getByLabel('Статус', { exact: true }).selectOption('new');
	await page.getByRole('button', { name: 'Найти', exact: true }).click();
	await expect(page.getByText('Заявок не найдено', { exact: true })).toBeVisible();
	await page.getByLabel('Статус', { exact: true }).selectOption('qualifying');
	await page.getByRole('button', { name: 'Найти', exact: true }).click();
	await page.getByRole('row').filter({ hasText: 'A4 Клиент 20' }).getByRole('link').click();
	await expect(page.getByRole('heading', { name: 'A4 Клиент 20', exact: true })).toBeVisible();
	await expect(page.getByText('fixture-hash', { exact: true })).toBeVisible();
	await expect(page.getByText('a4', { exact: true })).toBeVisible();
	await expect(page.getByText('90', { exact: true })).toHaveCount(0);
	await page
		.getByLabel('Новая заметка')
		.fill('<script>window.a4Unsafe = true</script> История звонка');
	await page.getByRole('button', { name: 'Добавить заметку', exact: true }).click();
	await expect(page.getByRole('list', { name: 'История заметок' })).toContainText(
		'<script>window.a4Unsafe = true</script>'
	);
	expect(await page.evaluate(() => 'a4Unsafe' in window)).toBe(false);
	await page.reload();
	await expect(page.getByRole('list', { name: 'История заметок' })).toContainText('История звонка');
	await page.getByLabel('Новая заметка').fill('Unsaved follow-up');
	await page.getByLabel('Новый статус').selectOption('proposal_sent');
	await page.getByRole('button', { name: 'Сохранить статус', exact: true }).click();
	await expect(page.getByText('КП отправлено', { exact: true })).toBeVisible();
	await expect(page.getByLabel('Новая заметка')).toHaveValue('Unsaved follow-up');
	await expect(page.getByText('Статус сохранён', { exact: true })).toBeVisible();
	mkdirSync('test-results/a4', { recursive: true });
	await page.screenshot({ path: 'test-results/a4/detail-desktop.png', fullPage: true });
});

test('spam restores with one action and list/detail fit a 360px screen', async ({ page }) => {
	await page.setViewportSize({ width: 360, height: 800 });
	await loginAsAdmin(page);
	await page.getByRole('tab', { name: 'Спам', exact: true }).click();
	const card = page
		.getByRole('list', { name: 'Список заявок' })
		.getByRole('listitem')
		.filter({ hasText: 'A4 Спам' });
	await card.getByRole('link').click();
	await expect(page.getByText('90', { exact: true })).toBeVisible();
	await page.getByRole('button', { name: 'Вернуть в заявки', exact: true }).click();
	await expect(page.getByText('Новая', { exact: true })).toBeVisible();
	await expect(page.getByText('90', { exact: true })).toBeVisible();
	await expect(page.getByText('fixture-hash', { exact: true })).toBeVisible();
	await page.screenshot({ path: 'test-results/a4/detail-mobile.png', fullPage: true });
	expect(
		await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
	).toBeLessThanOrEqual(1);
	await page.getByRole('link', { name: 'К списку заявок' }).click();
	await page.getByLabel('Поиск', { exact: true }).fill('A4 Спам');
	await page.getByRole('button', { name: 'Найти', exact: true }).click();
	await expect(page.getByRole('list', { name: 'Список заявок' })).toContainText('A4 Спам');
	await expect(page.getByText('Найдено: 1. Новые сверху', { exact: true })).toBeVisible();
	await page.screenshot({ path: 'test-results/a4/list-mobile.png', fullPage: true });
	expect(
		await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
	).toBeLessThanOrEqual(1);
});

test('pagination and URL filters survive refresh, and malformed or missing ids return 404', async ({
	page,
	request
}) => {
	await loginAsAdmin(page);
	await page.goto('/admin/leads?search=A4&type=web');
	await expect(page.getByLabel('Тип проекта')).toHaveValue('web');
	await page.reload();
	await expect(page.getByLabel('Поиск', { exact: true })).toHaveValue('A4');
	await page.goto('/admin/leads?search=A4');
	const first = await page.getByRole('table').getByRole('link').allTextContents();
	await page
		.getByRole('navigation', { name: 'Страницы', exact: true })
		.getByRole('button', { name: '2', exact: true })
		.click();
	await expect(page).toHaveURL(/page=2/);
	const last = await page.getByRole('table').getByRole('link').allTextContents();
	expect(last.every((reference) => !first.includes(reference))).toBe(true);
	await page.goto('/admin/leads?search=A4&page=999');
	await expect(
		page
			.getByRole('navigation', { name: 'Страницы', exact: true })
			.getByRole('button', { name: '2', exact: true })
	).toHaveAttribute('aria-current', 'page');
	const invalid = await page.goto('/admin/leads?status=invalid');
	expect(invalid?.status()).toBe(400);
	await expect(page.getByRole('heading', { name: 'Не удалось открыть страницу' })).toBeVisible();
	for (const id of ['invalid', crypto.randomUUID()]) {
		const response = await page.goto('/admin/leads/' + id);
		expect(response?.status()).toBe(404);
	}
	expect((await request.get('/admin/leads', { maxRedirects: 0 })).status()).toBe(303);
});

test('each remote function rejects anonymous calls and revoked sessions', async ({
	page,
	playwright
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await loginAsAdmin(page);
	await page.goto('/admin/leads?search=A4%20Клиент%2019');
	const captured = new Map<string, { url: string; method: string; data?: string }>();
	page.on('request', (request) => {
		if (!request.url().includes('/remote/')) return;
		const name = new URL(request.url()).pathname.split('/').at(-1)!;
		captured.set(name, {
			url: request.url(),
			method: request.method(),
			data: request.postData() ?? undefined
		});
	});
	await page.getByRole('button', { name: 'Обновить', exact: true }).click();
	await page.getByRole('table').getByRole('link').click();
	await page.getByRole('button', { name: 'Обновить', exact: true }).click();
	await page.getByLabel('Новый статус').selectOption('qualifying');
	await page.getByRole('button', { name: 'Сохранить статус', exact: true }).click();
	await expect(page.getByText('Статус сохранён', { exact: true })).toBeVisible();
	await page.getByLabel('Новая заметка').fill('Authorization note');
	await page.getByRole('button', { name: 'Добавить заметку', exact: true }).click();
	await expect(page.getByText('Заметка добавлена', { exact: true })).toBeVisible();
	expect([...captured.keys()].sort()).toEqual([
		'addLeadNote',
		'changeLeadStatus',
		'getLead',
		'listLeads'
	]);
	const revoked = await playwright.request.newContext({
		storageState: await page.context().storageState()
	});
	await page.getByRole('button', { name: 'Выйти', exact: true }).click();
	const anonymous = await playwright.request.newContext();
	try {
		for (const client of [anonymous, revoked]) {
			for (const call of captured.values()) {
				const response = await client.fetch(call.url, {
					method: call.method,
					data: call.data,
					headers: { 'content-type': 'application/json', origin: 'http://localhost:4173' }
				});
				// SvelteKit carries HttpError inside its remote response envelope.
				expect(await response.json()).toMatchObject({ type: 'error', status: 401 });
			}
		}
	} finally {
		await anonymous.dispose();
		await revoked.dispose();
	}
});
