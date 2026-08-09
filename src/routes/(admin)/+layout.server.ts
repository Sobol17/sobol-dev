import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

/**
 * Guard for every admin page. It is not sufficient on its own: remote functions and
 * `+server.ts` handlers under admin repeat the check themselves.
 */
export const load: LayoutServerLoad = ({ locals, url }) => {
	if (!locals.user) {
		redirect(303, `/login?next=${encodeURIComponent(url.pathname + url.search)}`);
	}

	return { user: { id: locals.user.id, displayName: locals.user.displayName } };
};
