import type {
	BudgetRange,
	LeadStatus,
	LeadType,
	ProjectCategory,
	PublishStatus,
	TimelineRange
} from '$lib/types';

export function excerpt(text: string, length = 200): string {
	const clean = text.replace(/\s+/g, ' ').trim();
	if (clean.length <= length) return clean;
	return `${clean.slice(0, length - 1).trimEnd()}…`;
}

export function formatDate(value: Date | number | string, locale = 'ru-RU'): string {
	const date = value instanceof Date ? value : new Date(value);
	return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export const LEAD_TYPE_LABELS: Record<LeadType, string> = {
	web: 'Сайт',
	mobile: 'Мобильное приложение',
	tma: 'Telegram Mini App',
	other: 'Пока не решил'
};

export const BUDGET_LABELS: Record<BudgetRange, string> = {
	under_3k: 'до 150 000 ₽',
	'3k_10k': '150–400 000 ₽',
	'10k_30k': '400 000 – 1 200 000 ₽',
	over_30k: 'больше 1 200 000 ₽',
	unknown: 'нужна оценка'
};

export const TIMELINE_LABELS: Record<TimelineRange, string> = {
	asap: 'вчера',
	under_1m: 'до месяца',
	'1_3m': '1–3 месяца',
	over_3m: '3 месяца и больше',
	unknown: 'сроки гибкие'
};

export const PROJECT_CATEGORY_LABELS: Record<ProjectCategory, string> = {
	web: 'Веб',
	mobile: 'Мобильное приложение',
	tma: 'Telegram Mini App'
};

export const PUBLISH_STATUS_LABELS: Record<PublishStatus, string> = {
	draft: 'Черновик',
	published: 'Опубликован',
	archived: 'В архиве'
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
	new: 'Новая',
	qualifying: 'В работе',
	proposal_sent: 'КП отправлено',
	won: 'Выиграна',
	lost: 'Проиграна',
	spam: 'Спам'
};
