import { redirect } from '@sveltejs/kit';
import { container } from '$lib/server/container';
import { SESSION_COOKIE } from '$lib/server/security/session';
import type { RequestHandler } from './$types';

/** Drops the session row, not only the cookie: a copied cookie must stop working too. */
export const POST: RequestHandler = ({ cookies }) => {
	const token = cookies.get(SESSION_COOKIE);
	if (token) container.auth.logout(token);
	cookies.delete(SESSION_COOKIE, { path: '/' });
	redirect(303, '/login');
};
