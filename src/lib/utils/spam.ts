import type { LeadInput, RequestMeta } from '$lib/types';

/** A lead at or above this score is stored as spam and never notifies the owner. */
export const SPAM_THRESHOLD = 50;

/** A human needs longer than this to read four questions and answer them. */
export const MIN_FILL_MS = 3000;

/** More than this many leads from one address per hour is not a human shopping around. */
export const MAX_LEADS_PER_IP_PER_HOUR = 3;

export interface SpamSignals {
	input: Pick<LeadInput, 'goal' | 'contactName'>;
	meta: Pick<RequestMeta, 'honeypot' | 'submittedAtMs'>;
	/** Milliseconds between the form being served and the submission arriving. */
	fillDurationMs: number;
	recentFromIp: number;
}

const LINK_PATTERN = /https?:\/\/|www\.|\bt\.me\/|@[a-z0-9_]+\.[a-z]{2,}/gi;

/**
 * Accumulating score in 0..100. Every rule is additive and bounded, so a new rule can never
 * push the result out of range and the threshold keeps its meaning.
 */
export function scoreSpam(signals: SpamSignals): number {
	let score = 0;

	// A hidden field is only ever filled by something that reads the DOM and ignores CSS.
	if (signals.meta.honeypot.trim() !== '') score += 60;

	if (signals.fillDurationMs >= 0 && signals.fillDurationMs < MIN_FILL_MS) score += 30;

	if (signals.recentFromIp >= MAX_LEADS_PER_IP_PER_HOUR) score += 40;

	const links = signals.input.goal.match(LINK_PATTERN)?.length ?? 0;
	score += Math.min(links * 10, 20);

	if (isShouting(signals.input.goal)) score += 10;
	if (isShouting(signals.input.contactName)) score += 5;

	return Math.max(0, Math.min(100, score));
}

export function isSpam(score: number): boolean {
	return score >= SPAM_THRESHOLD;
}

/** Long runs of capitals read as shouting only when there are enough letters to judge. */
function isShouting(text: string): boolean {
	const letters = text.replace(/[^\p{L}]/gu, '');
	if (letters.length < 12) return false;
	const upper = letters.replace(/[^\p{Lu}]/gu, '').length;
	return upper / letters.length > 0.7;
}
