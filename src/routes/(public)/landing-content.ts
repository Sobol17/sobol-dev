import type { ProjectCategory } from '$lib/types';

export const HERO = {
	eyebrow: 'Студия разработки',
	titleStart: 'Сайты, приложения и',
	titleAccent: 'Telegram Mini Apps',
	lead: 'SobolDev — студия разработки. Проектируем интерфейсы, создаём веб-сервисы и Telegram Mini Apps для продаж, записи и работы с клиентами. Помогаем с запуском и поддержкой.',
	primaryCta: 'Обсудить проект',
	secondaryCta: 'Смотреть работы',
	facts: [
		{ value: '7 лет', label: 'в коммерческой разработке' },
		{ value: '40+', label: 'проектов в проде' },
		{ value: '1 день', label: 'до ответа после брифа' }
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
		title: 'Веб-сервисы',
		description:
			'Сайты и рабочие инструменты, в которых удобно покупать, бронировать и управлять процессами.',
		bullets: ['Личные кабинеты и каталоги', 'Оплата, CRM и интеграции', 'Управление контентом'],
		meta: '01 / В браузере'
	},
	{
		id: 'tma',
		title: 'Telegram Mini Apps',
		description:
			'Клиентский сервис внутри привычного мессенджера: путь от первого контакта до повторной покупки.',
		bullets: ['Запись и заказы', 'Каталог и оплата', 'Уведомления и поддержка'],
		meta: '02 / В Telegram'
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
		title: 'Разбираемся в задаче',
		text: 'Обсуждаем бизнес-процесс, аудиторию и то, как оценить результат.'
	},
	{
		number: '02',
		title: 'Фиксируем объём',
		text: 'Определяем первый релиз, этапы, сроки и стоимость до начала разработки.'
	},
	{
		number: '03',
		title: 'Собираем и показываем',
		text: 'Проектируем интерфейс, разрабатываем продукт и показываем рабочую версию по ходу проекта.'
	},
	{
		number: '04',
		title: 'Запускаем',
		text: 'Проверяем сценарии, публикуем сервис и остаёмся на связи после релиза.'
	}
];

export const FAQ_INTRO = {
	eyebrow: 'Перед началом',
	title: 'Частые вопросы',
	text: 'Если задача пока не сформулирована до деталей, начнём с разговора.',
	contactLabel: 'Написать в Telegram ↗',
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
			'Стоимость зависит от сценариев, интеграций и объёма первого релиза. После обсуждения задачи подготовим план работ и смету.'
	},
	{
		question: 'Когда можно начать?',
		answer:
			'Сначала уточним задачу и согласуем объём работ. После этого зафиксируем график и дату старта.'
	},
	{
		question: 'Работаете по договору?',
		answer: 'Да. В договоре фиксируем этапы, стоимость и порядок приёмки.'
	},
	{
		question: 'Что происходит после запуска?',
		answer:
			'Передаём доступы и исходный код, помогаем с публикацией и обсуждаем дальнейшую поддержку.'
	}
];

export const FINAL_CTA = {
	title: 'Есть задача для веба или Telegram?',
	text: 'Расскажите, что нужно изменить в вашем бизнесе. Поможем определить первый разумный шаг.',
	button: 'Обсудить проект'
} as const;
