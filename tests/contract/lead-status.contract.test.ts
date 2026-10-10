import { afterEach, describe, expect, it } from 'vitest';
import { jobs, users } from '$lib/server/db/schema';
import type { LeadStatus } from '$lib/types';
import { createLeadSlice, leadInput, requestMeta } from '../helpers/lead-slice';

const allowed: Record<LeadStatus, LeadStatus[]> = {
	new: ['qualifying', 'lost', 'spam'],
	qualifying: ['proposal_sent', 'won', 'lost', 'spam'],
	proposal_sent: ['qualifying', 'won', 'lost', 'spam'],
	won: ['qualifying'],
	lost: ['qualifying'],
	spam: ['new']
};
const statuses = Object.keys(allowed) as LeadStatus[];
let slice: ReturnType<typeof createLeadSlice>;
afterEach(() => slice?.dispose());

describe('A4 status contract', () => {
	for (const from of statuses) {
		for (const to of statuses) {
			it(`${from} -> ${to}`, async () => {
				slice = createLeadSlice();
				const lead = slice.leadRepository.insert({
					publicId: 'ABCDEF',
					type: 'web',
					goal: 'A saved goal',
					contactName: 'Client',
					contactEmail: 'a@example.test',
					status: from,
					spamScore: 90,
					createdAt: slice.clock.now(),
					updatedAt: slice.clock.now()
				});
				slice.clock.advance(1000);
				if (from === to || allowed[from].includes(to)) {
					const updated = slice.leads.changeStatus(lead.id, to);
					expect(updated.status).toBe(to);
					expect(updated.updatedAt).toEqual(from === to ? lead.updatedAt : slice.clock.now());
				} else {
					expect(() => slice.leads.changeStatus(lead.id, to)).toThrow('invalid_transition');
					expect(slice.leadRepository.findById(lead.id)).toEqual(lead);
				}
				expect(slice.db.db.select().from(jobs).all()).toHaveLength(0);
			});
		}
	}

	it('restores spam without losing its metadata or notes and does not resend a notification', async () => {
		slice = createLeadSlice();
		const lead = await slice.leads.submit(
			leadInput({ utm: { source: 'telegram' } }),
			requestMeta({ honeypot: 'bot' })
		);
		const author = slice.db.db
			.insert(users)
			.values({ email: 'owner@example.test', passwordHash: 'hash', displayName: 'Owner' })
			.returning()
			.get()!;
		slice.leads.addNote(lead.id, author.id, 'Keep this note');
		const before = slice.db.db.select().from(jobs).all();
		slice.leads.changeStatus(lead.id, 'new');
		const detail = slice.leads.detail(lead.id);
		expect(detail.lead).toMatchObject({
			status: 'new',
			spamScore: lead.spamScore,
			utm: lead.utm,
			contactTelegram: lead.contactTelegram
		});
		expect(detail.notes).toHaveLength(1);
		expect(detail.notes[0]).toMatchObject({
			body: 'Keep this note',
			authorId: author.id,
			authorName: 'Owner'
		});
		expect(slice.db.db.select().from(jobs).all()).toEqual(before);
	});

	it('keeps notes append-only and refuses a missing lead', async () => {
		slice = createLeadSlice();
		const lead = await slice.leads.submit(leadInput(), requestMeta());
		const author = slice.db.db
			.insert(users)
			.values({ email: 'owner@example.test', passwordHash: 'hash', displayName: 'Owner' })
			.returning()
			.get()!;
		slice.leads.addNote(lead.id, author.id, 'First note');
		slice.clock.advance(1000);
		slice.leads.addNote(lead.id, author.id, 'Second note');
		expect(slice.leads.detail(lead.id).notes.map((note) => note.body)).toEqual([
			'First note',
			'Second note'
		]);
		expect(() => slice.leads.addNote(crypto.randomUUID(), author.id, 'Missing')).toThrow(
			'lead_not_found'
		);
		expect(() => slice.leads.changeStatus(crypto.randomUUID(), 'qualifying')).toThrow(
			'lead_not_found'
		);
	});
});
