import { and, eq, gt, lt } from 'drizzle-orm';
import type { Db } from '../db/index';
import { authAttempts, sessions, users } from '../db/schema';

export type UserRow = typeof users.$inferSelect;
export type SessionRow = typeof sessions.$inferSelect;

export interface SessionWithUser {
	session: SessionRow;
	user: Pick<UserRow, 'id' | 'email' | 'displayName'>;
}

export class SessionRepository {
	constructor(private readonly db: Db) {}

	create(values: typeof sessions.$inferInsert): SessionRow {
		const row = this.db.insert(sessions).values(values).returning().get();
		if (!row) throw new Error('session insert returned no row');
		return row;
	}

	/** Expired rows are filtered in SQL: a stale cookie must never resolve to a user. */
	findValid(id: string, now: Date): SessionWithUser | undefined {
		const row = this.db
			.select({
				session: sessions,
				user: { id: users.id, email: users.email, displayName: users.displayName }
			})
			.from(sessions)
			.innerJoin(users, eq(users.id, sessions.userId))
			.where(and(eq(sessions.id, id), gt(sessions.expiresAt, now)))
			.get();
		return row;
	}

	extend(id: string, expiresAt: Date): void {
		this.db.update(sessions).set({ expiresAt }).where(eq(sessions.id, id)).run();
	}

	delete(id: string): void {
		this.db.delete(sessions).where(eq(sessions.id, id)).run();
	}

	deleteExpired(now: Date): number {
		return this.db.delete(sessions).where(lt(sessions.expiresAt, now)).run().changes;
	}

	findUserByEmail(email: string): UserRow | undefined {
		return this.db.select().from(users).where(eq(users.email, email)).get();
	}

	recordAttempt(ipHash: string, email: string | null, succeeded: boolean): void {
		this.db.insert(authAttempts).values({ ipHash, email, succeeded }).run();
	}

	countFailedAttempts(ipHash: string, since: Date): number {
		return this.db
			.select({ id: authAttempts.id })
			.from(authAttempts)
			.where(
				and(
					eq(authAttempts.ipHash, ipHash),
					eq(authAttempts.succeeded, false),
					gt(authAttempts.createdAt, since)
				)
			)
			.all().length;
	}
}
