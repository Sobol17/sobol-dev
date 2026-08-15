import { config } from '$lib/server/config';
import type { RequestHandler } from './$types';

export const prerender = false;

/** The admin, the login form and proposal links stay out of every index. */
export const GET: RequestHandler = () => {
	const base = config.PUBLIC_SITE_URL.replace(/\/$/, '');
	const body = [
		'User-agent: *',
		'Allow: /',
		'Disallow: /admin',
		'Disallow: /login',
		'Disallow: /p/',
		'Disallow: /media/',
		'',
		`Sitemap: ${base}/sitemap.xml`,
		''
	].join('\n');

	return new Response(body, {
		headers: {
			'content-type': 'text/plain; charset=utf-8',
			'cache-control': 'public, max-age=3600'
		}
	});
};
