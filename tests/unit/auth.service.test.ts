import { afterEach, describe, expect, it } from 'vitest';
import { users } from '$lib/server/db/schema';
import { AuthService } from '$lib/server/domain/auth.service';
import { FixedClock } from '$lib/server/domain/clock';
import { RATE_LIMITS, RateLimitService } from '$lib/server/domain/rate-limit.service';
import { SessionRepository } from '$lib/server/repositories/session.repository';
import { hashPassword } from '$lib/server/security/password';
import { hashSessionToken, SESSION_TTL_MS } from '$lib/server/security/session';
import { createTestDb, type TestDb } from '../helpers/db';

const PASSWORD = 'correct-horse-battery';
const EMAIL = 'owner@example.test';

let db: TestDb | null = null;

afterEach(() => {
	db?.drop();
	db = null;
});

async function harness() {
	db = createTestDb();
	const clock = new FixedClock(new Date('2026-03-01T10:00:00.000Z'));
	const sessions = new SessionRepository(db.db);
	const auth = new AuthService(sessions, new RateLimitService(clock), clock);

	db.db
		.insert(users)
		.values({
			email: EMAIL,
			passwordHash: await hashPassword(PASSWORD),
			displayName: 'Sobol'
		})
		.run();

	return { db, clock, sessions, auth };
}

const context = { ipHash: 'ip-1', userAgent: 'vitest' };

describe('AuthService', () => {
	it('issues a session whose raw token is never stored', async () => {
		const { auth, db: handle } = await harness();

		const result = await auth.login(EMAIL, PASSWORD, context);
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		const stored = handle.sqlite.prepare('select id from sessions').all() as { id: string }[];
		expect(stored).toHaveLength(1);
		expect(stored[0]?.id).toBe(hashSessionToken(result.token));
		expect(stored[0]?.id).not.toBe(result.token);
	});

	it('answers the same way for a wrong password and an unknown email', async () => {
		const { auth } = await harness();

		const wrongPassword = await auth.login(EMAIL, 'nope-nope-nope', context);
		const unknownEmail = await auth.login('ghost@example.test', PASSWORD, context);

		expect(wrongPassword).toEqual(unknownEmail);
	});

	it('locks the address after the configured number of failures', async () => {
		const { auth } = await harness();

		for (let attempt = 0; attempt < RATE_LIMITS.login.limit; attempt += 1) {
			await auth.login(EMAIL, 'wrong-password', context);
		}

		const blocked = await auth.login(EMAIL, PASSWORD, context);
		expect(blocked).toEqual({ ok: false, reason: 'rate_limited' });
	});

	it('lets the address back in once the window passed', async () => {
		const { auth, clock } = await harness();

		for (let attempt = 0; attempt < RATE_LIMITS.login.limit; attempt += 1) {
			await auth.login(EMAIL, 'wrong-password', context);
		}
		clock.advance(RATE_LIMITS.login.windowMs + 1000);

		const result = await auth.login(EMAIL, PASSWORD, context);
		expect(result.ok).toBe(true);
	});

	it('resolves a live session and refuses an expired one', async () => {
		const { auth, clock } = await harness();
		const result = await auth.login(EMAIL, PASSWORD, context);
		if (!result.ok) throw new Error('login failed');

		expect(auth.resolve(result.token)?.user.email).toBe(EMAIL);

		clock.advance(SESSION_TTL_MS * 2);
		expect(auth.resolve(result.token)).toBeNull();
	});

	it('slides the expiry once the session is past half its life', async () => {
		const { auth, clock, sessions } = await harness();
		const result = await auth.login(EMAIL, PASSWORD, context);
		if (!result.ok) throw new Error('login failed');

		clock.advance(SESSION_TTL_MS * 0.6);
		auth.resolve(result.token);

		const row = sessions.findValid(hashSessionToken(result.token), clock.now());
		expect(row?.session.expiresAt.getTime()).toBe(clock.now().getTime() + SESSION_TTL_MS);
	});

	it('invalidates the row on logout, not only the cookie', async () => {
		const { auth } = await harness();
		const result = await auth.login(EMAIL, PASSWORD, context);
		if (!result.ok) throw new Error('login failed');

		auth.logout(result.token);

		expect(auth.resolve(result.token)).toBeNull();
	});
});
