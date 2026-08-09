import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import { leadInputSchema } from '$lib/schemas/lead';

const base = {
	type: 'web',
	goal: 'Нужен интернет-магазин на тридцать товаров с оплатой',
	budget: '3k_10k',
	timeline: '1_3m',
	contactName: 'Игорь'
};

describe('leadInputSchema', () => {
	it('accepts a lead with only telegram', () => {
		const result = v.safeParse(leadInputSchema, { ...base, contactTelegram: '@client' });
		expect(result.success).toBe(true);
	});

	it('treats empty optional fields as absent, the way a no-JS form posts them', () => {
		const result = v.safeParse(leadInputSchema, {
			...base,
			contactEmail: 'client@example.com',
			contactTelegram: '',
			website: ''
		});
		expect(result.success).toBe(true);
		expect(result.success && result.output.contactTelegram).toBeUndefined();
	});

	it('rejects a lead without any contact channel', () => {
		const result = v.safeParse(leadInputSchema, { ...base, contactEmail: '', contactTelegram: '' });
		expect(result.success).toBe(false);
		expect(result.success === false && result.issues[0]?.message).toBe('contact_required');
	});

	it('rejects a goal shorter than the minimum', () => {
		const result = v.safeParse(leadInputSchema, {
			...base,
			goal: 'коротко',
			contactTelegram: '@client'
		});
		expect(result.success).toBe(false);
	});

	it('rejects a malformed email', () => {
		const result = v.safeParse(leadInputSchema, { ...base, contactEmail: 'not-an-email' });
		expect(result.success).toBe(false);
	});

	it('never lets the client set server-owned fields', () => {
		const result = v.safeParse(leadInputSchema, {
			...base,
			contactTelegram: '@client',
			status: 'won',
			spamScore: 0,
			publicId: 'FORGED'
		});
		expect(result.success).toBe(true);
		expect(result.success && Object.keys(result.output)).not.toContain('status');
		expect(result.success && Object.keys(result.output)).not.toContain('publicId');
	});
});
