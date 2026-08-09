import { BUDGET_LABELS, LEAD_TYPE_LABELS, TIMELINE_LABELS, excerpt } from '$lib/utils/format';
import type { BudgetRange, LeadType, TimelineRange } from '$lib/types';

export const TEMPLATE_KEYS = {
	LEAD_NEW: 'lead.new'
} as const;

export type TemplateKey = (typeof TEMPLATE_KEYS)[keyof typeof TEMPLATE_KEYS];

export interface LeadNewPayload extends Record<string, unknown> {
	publicId: string;
	type: LeadType;
	budget: BudgetRange;
	timeline: TimelineRange;
	contactName: string;
	contact: string;
	goal: string;
	adminUrl: string;
}

/** Telegram HTML parse mode. Escaping is mandatory: the goal is visitor-supplied text. */
export function renderLeadNew(payload: LeadNewPayload): string {
	return [
		`<b>Заявка ${escapeHtml(payload.publicId)}</b>`,
		`Тип: ${escapeHtml(LEAD_TYPE_LABELS[payload.type])}`,
		`Бюджет: ${escapeHtml(BUDGET_LABELS[payload.budget])}`,
		`Срок: ${escapeHtml(TIMELINE_LABELS[payload.timeline])}`,
		`Имя: ${escapeHtml(payload.contactName)}`,
		`Контакт: ${escapeHtml(payload.contact)}`,
		'',
		escapeHtml(excerpt(payload.goal, 200)),
		'',
		escapeHtml(payload.adminUrl)
	].join('\n');
}

export function renderTemplate(key: string, payload: Record<string, unknown>): string {
	if (key === TEMPLATE_KEYS.LEAD_NEW) {
		return renderLeadNew(payload as LeadNewPayload);
	}
	throw new Error(`unknown template key: ${key}`);
}

function escapeHtml(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
