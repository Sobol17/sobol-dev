import { createHash, randomBytes } from 'node:crypto';

export const SESSION_COOKIE = 'sid';
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
/** Renew once the session is past half its life, so an active admin never gets logged out. */
export const SESSION_RENEW_AFTER_MS = SESSION_TTL_MS / 2;

/** Returns the raw token for the cookie. Only its hash ever reaches the database. */
export function createSessionToken(): string {
	return randomBytes(32).toString('base64url');
}

export function hashSessionToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

/** `secure` is left to SvelteKit: it sets it everywhere except http://localhost. */
export const sessionCookieOptions = {
	path: '/',
	httpOnly: true,
	sameSite: 'lax',
	maxAge: SESSION_TTL_MS / 1000
} as const;
