import { and, desc, eq, gte, sql } from 'drizzle-orm';
import type { Db } from '../db/index';
import { leads } from '../db/schema';
import type { LeadListItem } from '$lib/types';
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

	listRecent(limit = 20): LeadListItem[] {
		return this.db
			.select()
			.from(leads)
			.orderBy(desc(leads.createdAt))
			.limit(limit)
			.all()
			.map(toListItem);
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
