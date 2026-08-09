import type { PageServerLoad } from './$types';
import { FORM_STAMP_COOKIE } from './constants';

/** Rendered per request: the page stamps a cookie the submission uses to measure fill time. */
export const prerender = false;

export const load: PageServerLoad = ({ cookies }) => {
	cookies.set(FORM_STAMP_COOKIE, String(Date.now()), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 60 * 60
	});

	return {};
};
