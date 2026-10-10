import { afterEach, describe, expect, it } from 'vitest';
import * as v from 'valibot';
import { leadListSchema, leadNoteSchema, leadStatusChangeSchema } from '$lib/schemas/lead';
import { createLeadSlice } from '../helpers/lead-slice';

let slice: ReturnType<typeof createLeadSlice>;
afterEach(() => slice?.dispose());
const filters = (input = {}) => v.parse(leadListSchema, input);

function insert(overrides = {}) {
	return slice.leadRepository.insert({
		publicId: crypto.randomUUID(),
		type: 'web',
		goal: 'Обработка заказов',
		contactName: 'Игорь',
		contactEmail: 'client@example.test',
		createdAt: slice.clock.now(),
		...overrides
	});
}

describe('A4 lead list', () => {
	it('isolates spam, combines status and type filters, and searches Cyrillic without case sensitivity', () => {
		slice = createLeadSlice();
		const first = insert();
		insert({ status: 'qualifying', type: 'tma', contactName: 'Анна' });
		insert({ status: 'spam' });
		expect(slice.leads.list(filters()).total).toBe(2);
		expect(slice.leads.list(filters({ view: 'spam' })).total).toBe(1);
		expect(slice.leads.list(filters({ status: 'qualifying', type: 'web' })).total).toBe(0);
		expect(slice.leads.list(filters({ search: 'иГоРь' })).leads.map((lead) => lead.id)).toEqual([
			first.id
		]);
		expect(slice.leads.list(filters({ search: 'ЗАКАЗОВ' })).total).toBe(2);
	});

	it('treats SQL wildcard characters as literal text and cannot change the query with input', () => {
		slice = createLeadSlice();
		insert({ goal: 'Need 100%_coverage\\today' });
		insert();
		expect(slice.leads.list(filters({ search: '%_' })).total).toBe(1);
		expect(slice.leads.list(filters({ search: '\\today' })).total).toBe(1);
		expect(slice.leads.list(filters({ search: "' OR 1=1 --" })).total).toBe(0);
	});

	it('orders new leads first, paginates without overlaps, and clamps an out-of-range page', () => {
		slice = createLeadSlice();
		for (let index = 0; index < 23; index++) {
			slice.clock.advance(1000);
			insert({ contactName: `Client ${index}` });
		}
		const first = slice.leads.list(filters());
		const last = slice.leads.list(filters({ page: 999 }));
		expect(first.leads).toHaveLength(20);
		expect(first.leads[0]?.contactName).toBe('Client 22');
		expect(last).toMatchObject({ total: 23, page: 2, pageCount: 2 });
		expect(last.leads).toHaveLength(3);
		expect(last.leads.every((lead) => !first.leads.some((other) => other.id === lead.id))).toBe(
			true
		);
		expect(slice.leads.list(filters({ search: 'missing', page: 99 }))).toMatchObject({
			total: 0,
			page: 1,
			pageCount: 1,
			leads: []
		});
	});

	it('rejects malformed filters, ids, statuses and empty notes before persistence', () => {
		expect(v.safeParse(leadListSchema, { page: 0 }).success).toBe(false);
		expect(v.safeParse(leadListSchema, { type: 'invalid' }).success).toBe(false);
		expect(v.safeParse(leadListSchema, { status: 'invalid' }).success).toBe(false);
		expect(v.safeParse(leadListSchema, { search: 'x'.repeat(121) }).success).toBe(false);
		expect(v.safeParse(leadStatusChangeSchema, { id: 'invalid', status: 'won' }).success).toBe(
			false
		);
		expect(v.safeParse(leadNoteSchema, { id: crypto.randomUUID(), body: '   ' }).success).toBe(
			false
		);
	});
});
