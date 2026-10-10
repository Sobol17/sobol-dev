import { and, asc, desc, eq, gte, ne, or, sql } from 'drizzle-orm';
import type * as v from 'valibot';
import type { leadListSchema } from '$lib/schemas/lead';
import type { Db } from '../db/index';
import { leadNotes, leads, users } from '../db/schema';
import type { LeadListItem, LeadStatus } from '$lib/types';
import { excerpt } from '$lib/utils/format';

export type LeadRow = typeof leads.$inferSelect;
export type NewLeadRow = typeof leads.$inferInsert;

export class LeadRepository {
	constructor(private readonly db: Db) {}

	insert(values: NewLeadRow): LeadRow {
		const row = this.db.insert(leads).values(values).returning().get();
		if (!row) throw new Error('lead insert returned no row');
		return row;
	}

	findById(id: string): LeadRow | undefined {
		return this.db.select().from(leads).where(eq(leads.id, id)).get();
	}

	findByPublicId(publicId: string): LeadRow | undefined {
		return this.db.select().from(leads).where(eq(leads.publicId, publicId)).get();
	}

	/** Feeds the rate limit and the spam score. Counts every status, spam included. */
	countRecentByIp(ipHash: string, since: Date): number {
		const row = this.db
			.select({ count: sql<number>`count(*)` })
			.from(leads)
			.where(and(eq(leads.ipHash, ipHash), gte(leads.createdAt, since)))
			.get();
		return row?.count ?? 0;
	}

	count(): number {
		const row = this.db
			.select({ count: sql<number>`count(*)` })
			.from(leads)
			.get();
		return row?.count ?? 0;
	}

	countByStatus(status: LeadRow['status']): number {
		const row = this.db
			.select({ count: sql<number>`count(*)` })
			.from(leads)
			.where(eq(leads.status, status))
			.get();
		return row?.count ?? 0;
	}

	listRecent(limit = 20): LeadListItem[] {
		return this.db
			.select()
			.from(leads)
			.orderBy(desc(leads.createdAt))
			.limit(limit)
			.all()
			.map(toListItem);
	}

	list(input: v.InferOutput<typeof leadListSchema>) {
		const pattern = `%${input.search.toLowerCase().replace(/[\\%_]/g, '\\$&')}%`;
		const where = and(
			input.view === 'spam' ? eq(leads.status, 'spam') : ne(leads.status, 'spam'),
			input.status ? eq(leads.status, input.status) : undefined,
			input.type ? eq(leads.type, input.type) : undefined,
			input.search
				? or(
						sql`lower_unicode(${leads.contactName}) like ${pattern} escape ${'\\'}`,
						sql`lower_unicode(${leads.goal}) like ${pattern} escape ${'\\'}`
					)
				: undefined
		);
		const total =
			this.db
				.select({ count: sql<number>`count(*)` })
				.from(leads)
				.where(where)
				.get()?.count ?? 0;
		const pageCount = Math.max(1, Math.ceil(total / 20));
		const page = Math.min(input.page, pageCount);
		const rows = this.db
			.select()
			.from(leads)
			.where(where)
			.orderBy(desc(leads.createdAt), desc(leads.id))
			.limit(20)
			.offset((page - 1) * 20)
			.all();
		return { leads: rows.map(toListItem), total, page, pageCount };
	}

	/** The expected status prevents a stale transition from overwriting newer work. */
	changeStatus(id: string, from: LeadStatus, status: LeadStatus, updatedAt: Date) {
		return this.db
			.update(leads)
			.set({ status, updatedAt })
			.where(and(eq(leads.id, id), eq(leads.status, from)))
			.returning()
			.get();
	}

	listNotes(leadId: string) {
		return this.db
			.select({
				id: leadNotes.id,
				leadId: leadNotes.leadId,
				authorId: leadNotes.authorId,
				body: leadNotes.body,
				createdAt: leadNotes.createdAt,
				authorName: users.displayName
			})
			.from(leadNotes)
			.leftJoin(users, eq(users.id, leadNotes.authorId))
			.where(eq(leadNotes.leadId, leadId))
			.orderBy(asc(leadNotes.createdAt), asc(leadNotes.id))
			.all();
	}

	addNote(leadId: string, authorId: string, body: string, createdAt: Date) {
		return this.db
			.insert(leadNotes)
			.values({ leadId, authorId, body, createdAt })
			.returning()
			.get();
	}
}

export function toListItem(row: LeadRow): LeadListItem {
	return {
		id: row.id,
		publicId: row.publicId,
		type: row.type,
		status: row.status,
		contactName: row.contactName,
		goalExcerpt: excerpt(row.goal, 140),
		createdAt: row.createdAt.toISOString()
	};
}
