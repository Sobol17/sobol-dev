import * as v from 'valibot';
import { leadTypeSchema } from '$lib/schemas/lead';
import { FORM_STAMP_COOKIE } from './_lead/constants';
import type { PageServerLoad } from './$types';
export const prerender = false;
export const load: PageServerLoad = ({ cookies, url, setHeaders, request }) => {
	// The fill-time cookie and rejected POST values must never enter a shared cache.
	setHeaders({ 'cache-control': 'private, no-store' });
	if (request.method === 'GET')
		cookies.set(FORM_STAMP_COOKIE, String(Date.now()), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 3600
		});
	const type = v.safeParse(leadTypeSchema, url.searchParams.get('type'));
	return { initialType: type.success ? type.output : undefined };
};
