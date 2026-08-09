import { randomBytes } from 'node:crypto';
import { createDb } from '../src/lib/server/db/index';
import {
	leads,
	projectTags,
	projects,
	proposals,
	techTags,
	users
} from '../src/lib/server/db/schema';
import { hashPassword } from '../src/lib/server/security/password';
import { slugify } from '../src/lib/utils/slug';
import { generatePublicId } from '../src/lib/utils/public-id';
import type { ProjectCategory, PublishStatus } from '../src/lib/types/project';
import type { BudgetRange, LeadStatus, LeadType, TimelineRange } from '../src/lib/types/lead';
import { databaseFile } from './env';

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'owner@soboldev.ru';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'change-me-right-now';

const TAGS = [
	'TypeScript',
	'SvelteKit',
	'React Native',
	'Flutter',
	'Node.js',
	'PostgreSQL',
	'Telegram Bot API',
	'Supabase'
];

interface DemoProject {
	title: string;
	category: ProjectCategory;
	summary: string;
	body: string;
	status: PublishStatus;
	featured: boolean;
	year: number;
	durationWeeks: number;
	tags: string[];
}

const PROJECTS: DemoProject[] = [
	{
		title: 'Miracle',
		category: 'web',
		summary: 'Лендинг и вейтлист для торговой платформы: собрать заявки до запуска продукта.',
		body: '## Задача\n\nКоманда выходила на рынок и хотела набрать базу до релиза.\n\n## Что сделал\n\n- Одностраничник с анимацией при скролле\n- Форма вейтлиста с проверкой почты\n- Реферальные ссылки и место в очереди',
		status: 'published',
		featured: true,
		year: 2026,
		durationWeeks: 2,
		tags: ['TypeScript', 'SvelteKit', 'Supabase']
	},
	{
		title: 'Панель дилера',
		category: 'web',
		summary: 'Личный кабинет дилера с заказами, остатками и выгрузкой в 1С.',
		body: '## Задача\n\nЗаказы приходили в почту и терялись.\n\n## Что сделал\n\n- Каталог с остатками в реальном времени\n- Роли и права\n- Выгрузка документов',
		status: 'published',
		featured: false,
		year: 2025,
		durationWeeks: 8,
		tags: ['TypeScript', 'Node.js', 'PostgreSQL']
	},
	{
		title: 'ZAP',
		category: 'mobile',
		summary: 'Соцсеть для знакомств с людьми, которые находятся рядом прямо сейчас.',
		body: '## Задача\n\nЖивое знакомство вместо бесконечной ленты.\n\n## Что сделал\n\n- Экран «рядом» с фильтром по радиусу\n- Чат на WebSocket\n- Подписки через App Store и Google Play',
		status: 'published',
		featured: true,
		year: 2025,
		durationWeeks: 11,
		tags: ['React Native', 'TypeScript', 'PostgreSQL']
	},
	{
		title: 'Kanso',
		category: 'mobile',
		summary: 'Трекер привычек с офлайн-режимом и синхронизацией между устройствами.',
		body: '## Задача\n\nПриложение должно полностью работать без интернета.\n\n## Что сделал\n\n- Локальная база и очередь синхронизации\n- Виджеты на главный экран\n- Экспорт истории в CSV',
		status: 'published',
		featured: false,
		year: 2025,
		durationWeeks: 7,
		tags: ['Flutter']
	},
	{
		title: 'FermaBox',
		category: 'tma',
		summary: 'Магазин фермерских продуктов с доставкой целиком внутри Telegram.',
		body: '## Задача\n\nХозяйство продавало через комментарии в канале и теряло заказы.\n\n## Что сделал\n\n- Каталог с корзиной и выбором даты доставки\n- Оплата через ЮKassa и Telegram Stars\n- Админка для сборщиков',
		status: 'published',
		featured: true,
		year: 2025,
		durationWeeks: 4,
		tags: ['Telegram Bot API', 'Node.js', 'PostgreSQL']
	},
	{
		title: 'Запись в студию',
		category: 'tma',
		summary: 'Мини-апп записи к мастерам с напоминаниями в боте.',
		body: '## Задача\n\nАдминистратор вёл запись в тетради.\n\n## Что сделал\n\n- Календарь свободных слотов\n- Напоминания за сутки и за час\n- Отмена и перенос без звонка',
		status: 'draft',
		featured: false,
		year: 2026,
		durationWeeks: 3,
		tags: ['Telegram Bot API', 'TypeScript']
	}
];

interface DemoLead {
	type: LeadType;
	goal: string;
	budget: BudgetRange;
	timeline: TimelineRange;
	contactName: string;
	contactTelegram: string;
	status: LeadStatus;
	spamScore: number;
}

const LEADS: DemoLead[] = [
	{
		type: 'web',
		goal: 'Нужен интернет-магазин на тридцать позиций с оплатой и выгрузкой остатков в 1С.',
		budget: '3k_10k',
		timeline: '1_3m',
		contactName: 'Анна',
		contactTelegram: '@anna',
		status: 'new',
		spamScore: 0
	},
	{
		type: 'mobile',
		goal: 'Приложение для доставки еды на iOS и Android, нужен запуск к осеннему сезону.',
		budget: '10k_30k',
		timeline: 'under_1m',
		contactName: 'Борис',
		contactTelegram: '@boris',
		status: 'qualifying',
		spamScore: 0
	},
	{
		type: 'tma',
		goal: 'Mini App для записи в барбершоп с напоминаниями и оплатой через Telegram Stars.',
		budget: 'under_3k',
		timeline: 'asap',
		contactName: 'Вера',
		contactTelegram: '@vera',
		status: 'proposal_sent',
		spamScore: 0
	},
	{
		type: 'other',
		goal: 'Есть готовый проект на React, нужно доделать личный кабинет и починить оплату.',
		budget: 'unknown',
		timeline: 'over_3m',
		contactName: 'Глеб',
		contactTelegram: '@gleb',
		status: 'won',
		spamScore: 0
	},
	{
		type: 'web',
		goal: 'CHEAP SEO BACKLINKS http://spam.example BUY NOW BEST PRICE GUARANTEED SERVICE',
		budget: 'unknown',
		timeline: 'unknown',
		contactName: 'SEO AGENCY BEST',
		contactTelegram: '@seo_bot',
		status: 'spam',
		spamScore: 90
	}
];

async function main(): Promise<void> {
	const { db, close } = createDb(databaseFile());

	try {
		db.transaction(() => {
			db.delete(proposals).run();
			db.delete(projectTags).run();
			db.delete(projects).run();
			db.delete(techTags).run();
			db.delete(leads).run();
		});

		const passwordHash = await hashPassword(ADMIN_PASSWORD);
		const existingAdmin = db.select().from(users).all()[0];
		if (!existingAdmin) {
			db.insert(users).values({ email: ADMIN_EMAIL, passwordHash, displayName: 'Sobol' }).run();
		}

		db.transaction(() => {
			const tagIds = new Map<string, string>();
			for (const name of TAGS) {
				const row = db
					.insert(techTags)
					.values({ slug: slugify(name), name })
					.returning()
					.get();
				if (row) tagIds.set(name, row.id);
			}

			PROJECTS.forEach((demo, index) => {
				const project = db
					.insert(projects)
					.values({
						slug: slugify(demo.title),
						title: demo.title,
						category: demo.category,
						summary: demo.summary,
						body: demo.body,
						year: demo.year,
						durationWeeks: demo.durationWeeks,
						status: demo.status,
						featured: demo.featured,
						position: index,
						publishedAt: demo.status === 'published' ? new Date() : null
					})
					.returning()
					.get();
				if (!project) return;

				for (const tag of demo.tags) {
					const tagId = tagIds.get(tag);
					if (tagId) db.insert(projectTags).values({ projectId: project.id, tagId }).run();
				}
			});

			const leadRows = LEADS.map((demo) =>
				db
					.insert(leads)
					.values({
						publicId: generatePublicId(),
						type: demo.type,
						goal: demo.goal,
						budget: demo.budget,
						timeline: demo.timeline,
						contactName: demo.contactName,
						contactTelegram: demo.contactTelegram,
						status: demo.status,
						spamScore: demo.spamScore,
						utm: { source: 'seed' }
					})
					.returning()
					.get()
			);

			const draftLead = leadRows[1];
			const sentLead = leadRows[2];

			if (draftLead) {
				db.insert(proposals)
					.values({
						leadId: draftLead.id,
						publicToken: randomBytes(32).toString('base64url'),
						title: `КП для ${draftLead.contactName}`,
						bodyMd: '## Что делаем\n\nСписок работ уточняется.',
						scope: [{ title: 'Дизайн экранов', weeks: 2 }],
						priceFrom: 8000,
						priceTo: 12000,
						timelineWeeks: 8,
						status: 'draft'
					})
					.run();
			}

			if (sentLead) {
				const token = randomBytes(32).toString('base64url');
				db.insert(proposals)
					.values({
						leadId: sentLead.id,
						publicToken: token,
						title: `КП для ${sentLead.contactName}`,
						bodyMd: '## Что делаем\n\n- Каталог мастеров\n- Календарь записи\n- Оплата',
						scope: [
							{ title: 'Каталог и календарь', weeks: 2 },
							{ title: 'Оплата и напоминания', weeks: 1 }
						],
						priceFrom: 2500,
						priceTo: 3500,
						timelineWeeks: 3,
						status: 'sent',
						sentAt: new Date(),
						validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
					})
					.run();
				console.log(`sent proposal link: /p/${token}`);
			}
		});

		console.log(`seeded ${PROJECTS.length} projects, ${LEADS.length} leads, admin ${ADMIN_EMAIL}`);
	} finally {
		close();
	}
}

await main();
