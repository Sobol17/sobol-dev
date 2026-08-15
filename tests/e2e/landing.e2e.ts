import { expect, test } from '@playwright/test';
import { loginAsAdmin } from '../helpers/e2e-admin';

const TITLE = 'Кейс для главной';
const SUMMARY = 'Избранный кейс, который лендинг показывает в блоке с проектами студии.';
const BODY = '## Задача\n\nПоказать избранный проект на главной странице.';

test.describe('landing', () => {
	test('every anchor and both calls to action lead somewhere', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('heading', { level: 1 })).toContainText('Telegram Mini Apps');

		await page.getByRole('link', { name: 'Услуги' }).click();
		await expect(page.locator('#services')).toBeInViewport();

		await page.getByRole('link', { name: 'Процесс' }).click();
		await expect(page.locator('#process')).toBeInViewport();

		await page.getByRole('link', { name: 'Вопросы' }).click();
		await expect(page.locator('#faq')).toBeInViewport();

		await page.getByText('Сколько стоит проект?').click();
		await expect(page.getByText('Лендинг начинается от 150 000 ₽')).toBeVisible();

		await page.getByRole('link', { name: 'Посмотреть кейсы' }).click();
		await expect(page).toHaveURL(/\/cases$/);

		await page.goto('/');
		await page.getByRole('link', { name: 'Собрать бриф за 40 секунд' }).click();
		await expect(page).toHaveURL(/\/lead$/);
	});

	test('the type picked on the landing arrives at the form preselected', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('radio', { name: 'Telegram Mini App' }).check();
		await page.getByRole('link', { name: 'Собрать бриф', exact: true }).click();

		await expect(page).toHaveURL(/\/lead\?type=tma$/);
	});

	test('a featured case shows up in the cases block', async ({ page }) => {
		await loginAsAdmin(page);

		await page.goto('/admin/projects/new');
		await page.getByLabel('Заголовок').fill(TITLE);
		await page.getByLabel('Короткое описание').fill(SUMMARY);
		await page.getByLabel('Текст кейса').fill(BODY);
		await page.getByLabel('Показывать на главной').check();
		await page.getByRole('button', { name: 'Создать черновик' }).click();
		await page.getByRole('button', { name: 'Опубликовать' }).click();
		await expect(page.getByText('Опубликован', { exact: true })).toBeVisible();

		await page.goto('/');
		await expect(page.locator('#cases').getByRole('heading', { name: TITLE })).toBeVisible();
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
