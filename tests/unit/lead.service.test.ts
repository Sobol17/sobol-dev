import { afterEach, describe, expect, it } from 'vitest';
import { MAX_LEADS_PER_IP_PER_HOUR } from '$lib/utils/spam';
import { createLeadSlice, leadInput, requestMeta } from '../helpers/lead-slice';

let slice: ReturnType<typeof createLeadSlice> | null = null;

afterEach(() => {
	slice?.dispose();
	slice = null;
});

describe('LeadService.submit', () => {
	it('assigns a short public id that reads out loud', async () => {
		slice = createLeadSlice();

		const lead = await slice.leads.submit(leadInput(), requestMeta());

		expect(lead.publicId).toMatch(/^[23456789CDFGHJKMNPQRTVWXY]{6}$/);
		expect(lead.status).toBe('new');
		expect(lead.spamScore).toBe(0);
	});

	it('stores only the hashed address, never the raw one', async () => {
		slice = createLeadSlice();

		const lead = await slice.leads.submit(leadInput(), requestMeta({ ipHash: 'hashed-value' }));

		expect(lead.ipHash).toBe('hashed-value');
	});

	it('marks a honeypot submission as spam', async () => {
		slice = createLeadSlice();

		const lead = await slice.leads.submit(leadInput(), requestMeta({ honeypot: 'bot' }));

		expect(lead.status).toBe('spam');
		expect(lead.spamScore).toBeGreaterThanOrEqual(50);
	});

	it('marks a submission that beat the minimum fill time as suspicious', async () => {
		slice = createLeadSlice();

		const lead = await slice.leads.submit(
			leadInput(),
			requestMeta({ submittedAtMs: slice.clock.now().getTime() - 500 })
		);

		expect(lead.spamScore).toBeGreaterThan(0);
	});

	it('turns the rate limit into spam once the address goes over the hourly budget', async () => {
		slice = createLeadSlice();

		for (let index = 0; index < MAX_LEADS_PER_IP_PER_HOUR; index += 1) {
			await slice.leads.submit(leadInput(), requestMeta());
		}
		const over = await slice.leads.submit(leadInput(), requestMeta());

		expect(over.status).toBe('spam');
	});

	it('refuses a lead with no contact channel', async () => {
		slice = createLeadSlice();

		await expect(
			slice.leads.submit(
				leadInput({ contactTelegram: undefined, contactEmail: undefined }),
				requestMeta()
			)
		).rejects.toThrow('contact channel');
	});

	it('writes utm from the caller and nothing else', async () => {
		slice = createLeadSlice();

		const lead = await slice.leads.submit(
			leadInput({ utm: { source: 'telegram', campaign: 'launch' } }),
			requestMeta({ referrer: 'https://t.me/soboldev' })
		);

		expect(lead.utm).toEqual({ source: 'telegram', campaign: 'launch' });
		expect(lead.referrer).toBe('https://t.me/soboldev');
	});
});
