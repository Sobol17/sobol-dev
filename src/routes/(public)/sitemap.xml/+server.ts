import { config } from '$lib/server/config';
import type { RequestHandler } from './$types';
export const prerender = true;
export const GET: RequestHandler = () => {
	const url = new URL('/', config.PUBLIC_SITE_URL).href
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;');
	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${url}</loc></url></urlset>`,
		{
			headers: {
				'content-type': 'application/xml; charset=utf-8',
				'cache-control': 'public, max-age=3600'
			}
		}
	);
};
