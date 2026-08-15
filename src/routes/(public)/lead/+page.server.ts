import * as v from 'valibot';
import { leadTypeSchema } from '$lib/schemas/lead';
import type { PageServerLoad } from './$types';
import { FORM_STAMP_COOKIE } from './constants';

/** Rendered per request: the page stamps a cookie the submission uses to measure fill time. */
export const prerender = false;

export const load: PageServerLoad = ({ cookies, url }) => {
	cookies.set(FORM_STAMP_COOKIE, String(Date.now()), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 60 * 60
	});

	// The landing links to /lead?type=tma. Anything else in that parameter is dropped.
	const type = v.safeParse(leadTypeSchema, url.searchParams.get('type'));

	return { initialType: type.success ? type.output : undefined };
};
