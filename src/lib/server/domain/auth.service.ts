import type { SessionRepository, SessionWithUser } from '../repositories/session.repository';
import {
	createSessionToken,
	hashSessionToken,
	SESSION_RENEW_AFTER_MS,
	SESSION_TTL_MS
} from '../security/session';
import { hashPassword, verifyPassword } from '../security/password';
import type { Clock } from './clock';
import { RATE_LIMITS, type RateLimitService } from './rate-limit.service';

export interface LoginContext {
	ipHash: string;
	userAgent: string | null;
}

export type LoginResult =
	| { ok: true; token: string; expiresAt: Date }
	| { ok: false; reason: 'invalid_credentials' | 'rate_limited' };

export class AuthService {
	constructor(
		private readonly sessions: SessionRepository,
		private readonly rateLimit: RateLimitService,
		private readonly clock: Clock
	) {}

	/**
	 * Wrong email and wrong password return the same result on purpose: the response must not
	 * tell an attacker which half of the pair was right.
	 */
	async login(email: string, password: string, context: LoginContext): Promise<LoginResult> {
		const failed = this.sessions.countFailedAttempts(
			context.ipHash,
			this.rateLimit.windowStart(RATE_LIMITS.login)
		);
		if (this.rateLimit.exceeded(failed, RATE_LIMITS.login)) {
			return { ok: false, reason: 'rate_limited' };
		}

		const user = this.sessions.findUserByEmail(email);
		const valid = user ? await verifyPassword(user.passwordHash, password) : false;

		if (!user || !valid) {
			this.sessions.recordAttempt(context.ipHash, email, false);
			return { ok: false, reason: 'invalid_credentials' };
		}

		this.sessions.recordAttempt(context.ipHash, email, true);

		const token = createSessionToken();
		const expiresAt = new Date(this.clock.now().getTime() + SESSION_TTL_MS);
		this.sessions.create({
			id: hashSessionToken(token),
			userId: user.id,
			expiresAt,
			ipHash: context.ipHash,
			userAgent: context.userAgent
		});

		return { ok: true, token, expiresAt };
	}

	/** Resolves a cookie token to a user and slides the expiry once the session is half spent. */
	resolve(token: string): SessionWithUser | null {
		const now = this.clock.now();
		const found = this.sessions.findValid(hashSessionToken(token), now);
		if (!found) return null;

		if (found.session.expiresAt.getTime() - now.getTime() < SESSION_RENEW_AFTER_MS) {
			this.sessions.extend(found.session.id, new Date(now.getTime() + SESSION_TTL_MS));
		}
		return found;
	}

	/** Logout drops the row, not just the cookie: a stolen cookie must stop working. */
	logout(token: string): void {
		this.sessions.delete(hashSessionToken(token));
	}

	hashPassword(password: string): Promise<string> {
		return hashPassword(password);
	}
}
