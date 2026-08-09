import { dev } from '$app/environment';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

/** Showcase route. It must not exist in production. */
export const prerender = false;

export const load: PageLoad = () => {
	if (!dev) error(404, 'Not Found');
	return {};
};
