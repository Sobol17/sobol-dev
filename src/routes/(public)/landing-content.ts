import type { ProjectCategory } from '$lib/types';

/**
 * Every word the landing shows lives here. Editing copy stays a one-file change and the
 * markup keeps describing structure instead of carrying text.
 */

export const HERO = {
	eyebrow: 'Студия разработки',
	titleStart: 'Сайты, приложения и',
	titleAccent: 'Telegram Mini Apps',
	lead: 'SobolDev — небольшая студия. Веду проект от брифа до релиза: интерфейс, код, публикация в сторах и поддержка. Заявку разбираю в день обращения и присылаю смету с фиксированной ценой.',
	primaryCta: 'Собрать бриф за 40 секунд',
	secondaryCta: 'Посмотреть кейсы',
	facts: [
		{ value: '7 лет', label: 'в коммерческой разработке' },
		{ value: '40+', label: 'проектов в проде' },
		{ value: '1 день', label: 'до сметы после брифа' }
	]
} as const;

export interface Direction {
	id: ProjectCategory;
	title: string;
	description: string;
	bullets: string[];
	meta: string;
}

export const DIRECTIONS: Direction[] = [
	{
		id: 'web',
		title: 'Сайты и веб-приложения',
		description:
			'Лендинг, магазин, личный кабинет или внутренняя панель. Собираю на SvelteKit и Node, подключаю оплату, CRM и 1С.',
		bullets: ['Дизайн и вёрстка под ключ', 'Оплата, CRM, интеграции', 'Админка для контента'],
		meta: 'от 3 недель'
	},
	{
		id: 'mobile',
		title: 'Мобильные приложения',
		description:
			'iOS и Android из одной кодовой базы на Flutter или React Native. Публикую в сторах и веду обновления.',
		bullets: [
			'Один код на две платформы',
			'Офлайн-режим и пуши',
			'Публикация в App Store и Google Play'
		],
		meta: 'от 6 недель'
	},
	{
		id: 'tma',
		title: 'Telegram Mini Apps',
		description:
			'Продажи и запись прямо в мессенджере: каталог, корзина, оплата и бот с напоминаниями внутри Telegram.',
		bullets: ['Каталог и корзина', 'Оплата картой и Stars', 'Бот с уведомлениями'],
		meta: 'от 2 недель'
	}
];

export interface ProcessStep {
	number: string;
	title: string;
	text: string;
}

export const PROCESS: ProcessStep[] = [
	{
		number: '01',
		title: 'Бриф',
		text: 'Заполняете форму: тип проекта, задача, бюджет и срок. Занимает пару минут.'
	},
	{
		number: '02',
		title: 'Смета',
		text: 'В течение рабочего дня присылаю план работ, вилку цены и срок. Спорные места отмечаю сразу.'
	},
	{
		number: '03',
		title: 'Разработка',
		text: 'Работаю недельными спринтами. В конце каждого показываю рабочую сборку, а не отчёт.'
	},
	{
		number: '04',
		title: 'Релиз и поддержка',
		text: 'Выкатываю на боевой домен или в сторы, передаю доступы и остаюсь на связи по правкам.'
	}
];

export const FAQ_INTRO = {
	eyebrow: 'Вопросы',
	title: 'Что спрашивают чаще всего',
	text: 'Здесь то, что всплывает в первом разговоре. Остального в списке нет — спрашивайте напрямую.',
	contactLabel: 'Написать в Telegram →',
	contactHref: 'https://t.me/soboldev'
} as const;

export interface FaqItem {
	question: string;
	answer: string;
}

export const FAQ: FaqItem[] = [
	{
		question: 'Сколько стоит проект?',
		answer:
			'Лендинг начинается от 150 000 ₽, магазин и личный кабинет — от 400 000 ₽, мобильное приложение — от 700 000 ₽. Точную цену называю после брифа: она зависит от объёма, а не от типа проекта.'
	},
	{
		question: 'Как быстро вы отвечаете на заявку?',
		answer:
			'В течение рабочего дня. Если задача понятна, сразу присылаю смету, если нет — задаю два-три уточняющих вопроса.'
	},
	{
		question: 'Работаете по договору?',
		answer:
			'Да, договор с фиксированной ценой и этапами. Оплата разбивается на предоплату и приёмку по спринтам.'
	},
	{
		question: 'Что с исходным кодом?',
		answer:
			'Код ваш. Репозиторий передаю вместе с доступами к серверу и инструкцией по запуску в день релиза.'
	},
	{
		question: 'Поддерживаете проект после релиза?',
		answer:
			'Да. Первый месяц правок входит в стоимость, дальше работаю по часам или на месячной поддержке.'
	}
];

export const FINAL_CTA = {
	title: 'Расскажите про задачу',
	text: 'Четыре вопроса и контакт. Разберу заявку в день обращения и пришлю смету с фиксированной ценой.',
	button: 'Собрать бриф'
} as const;
