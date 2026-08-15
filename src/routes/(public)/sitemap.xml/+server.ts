import { config } from '$lib/server/config';
import { container } from '$lib/server/container';
import { escapeHtml } from '$lib/utils/markdown';
import type { RequestHandler } from './$types';

export const prerender = false;

interface SitemapUrl {
	path: string;
	updatedAt?: string;
	priority: string;
}

const STATIC_URLS: SitemapUrl[] = [
	{ path: '/', priority: '1.0' },
	{ path: '/cases', priority: '0.8' },
	{ path: '/lead', priority: '0.7' }
];

/** Only published cases. Proposal links and the admin never appear here. */
export const GET: RequestHandler = () => {
	const base = config.PUBLIC_SITE_URL.replace(/\/$/, '');
	const urls: SitemapUrl[] = [
		...STATIC_URLS,
		...container.projects
			.sitemapEntries()
			.map((entry) => ({ path: entry.path, updatedAt: entry.updatedAt, priority: '0.6' }))
	];

	const body = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		...urls.map((url) => renderUrl(base, url)),
		'</urlset>'
	].join('\n');

	return new Response(body, {
		headers: {
			'content-type': 'application/xml; charset=utf-8',
			'cache-control': 'public, max-age=3600'
		}
	});
};

function renderUrl(base: string, url: SitemapUrl): string {
	const lastmod = url.updatedAt ? `<lastmod>${url.updatedAt}</lastmod>` : '';
	return `  <url><loc>${escapeHtml(base + url.path)}</loc>${lastmod}<priority>${url.priority}</priority></url>`;
}
