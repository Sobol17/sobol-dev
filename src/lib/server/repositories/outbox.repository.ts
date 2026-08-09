import { and, eq, sql } from 'drizzle-orm';
import type { Db } from '../db/index';
import { outboxMessages } from '../db/schema';

export type OutboxRow = typeof outboxMessages.$inferSelect;
export type NewOutboxRow = typeof outboxMessages.$inferInsert;

export class OutboxRepository {
	constructor(private readonly db: Db) {}

	/**
	 * Idempotent insert keyed by `dedupeKey`. Returns the row that exists after the call,
	 * so a repeated job reuses the first message instead of creating a second one.
	 */
	enqueue(values: NewOutboxRow): OutboxRow {
		const inserted = this.db
			.insert(outboxMessages)
			.values(values)
			.onConflictDoNothing({ target: outboxMessages.dedupeKey })
			.returning()
			.get();
		if (inserted) return inserted;

		const existing = this.findByDedupeKey(values.dedupeKey);
		if (!existing) throw new Error('outbox insert conflicted but no row was found');
		return existing;
	}

	findById(id: string): OutboxRow | undefined {
		return this.db.select().from(outboxMessages).where(eq(outboxMessages.id, id)).get();
	}

	findByDedupeKey(dedupeKey: string): OutboxRow | undefined {
		return this.db
			.select()
			.from(outboxMessages)
			.where(eq(outboxMessages.dedupeKey, dedupeKey))
			.get();
	}

	/**
	 * Conditional transition. Only the caller that flips `pending` to `sent` may deliver,
	 * so a duplicate run of the dispatch job cannot send twice.
	 */
	claimPending(id: string, at: Date): OutboxRow | undefined {
		return this.db
			.update(outboxMessages)
			.set({ status: 'sent', sentAt: at })
			.where(and(eq(outboxMessages.id, id), eq(outboxMessages.status, 'pending')))
			.returning()
			.get();
	}

	/** Puts a claimed message back so the job can retry it. */
	release(id: string, error: string): void {
		this.db
			.update(outboxMessages)
			.set({
				status: 'pending',
				sentAt: null,
				lastError: error,
				attempts: sql`${outboxMessages.attempts} + 1`
			})
			.where(eq(outboxMessages.id, id))
			.run();
	}

	markFailed(id: string, error: string): void {
		this.db
			.update(outboxMessages)
			.set({ status: 'failed', lastError: error })
			.where(eq(outboxMessages.id, id))
			.run();
	}
}
