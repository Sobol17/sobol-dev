export type LeadType = 'web' | 'mobile' | 'tma' | 'other';
export type LeadStatus = 'new' | 'qualifying' | 'proposal_sent' | 'won' | 'lost' | 'spam';
export type BudgetRange = 'under_3k' | '3k_10k' | '10k_30k' | 'over_30k' | 'unknown';
export type TimelineRange = 'asap' | 'under_1m' | '1_3m' | 'over_3m' | 'unknown';

export interface UtmParams {
	source?: string;
	medium?: string;
	campaign?: string;
	content?: string;
	term?: string;
}

/** Client-supplied part of a lead. Server never trusts anything outside this shape. */
export interface LeadInput {
	type: LeadType;
	goal: string;
	budget: BudgetRange;
	timeline: TimelineRange;
	contactName: string;
	contactEmail?: string;
	contactTelegram?: string;
	utm?: UtmParams;
}

/** Server-derived request metadata, never accepted from the client body. */
export interface RequestMeta {
	ipHash: string | null;
	userAgent: string | null;
	referrer: string | null;
	submittedAtMs: number;
	honeypot: string;
}

export interface LeadListItem {
	id: string;
	publicId: string;
	type: LeadType;
	status: LeadStatus;
	contactName: string;
	goalExcerpt: string;
	createdAt: string;
}
