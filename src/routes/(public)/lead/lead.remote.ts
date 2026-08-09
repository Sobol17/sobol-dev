import { error, redirect } from '@sveltejs/kit';
import { form, getRequestEvent, query } from '$app/server';
import { leadInputSchema } from '$lib/schemas/lead';
import { container } from '$lib/server/container';
import type { UtmParams } from '$lib/types';
import { FORM_STAMP_COOKIE } from './constants';

/**
 * Public lead submission. Progressive enhancement works without JS: the same valibot schema
 * validates on both sides, and the redirect closes the POST.
 */
export const submitLead = form(leadInputSchema, async (data) => {
	const event = getRequestEvent();

	const meta = container.meta.from({
		ip: clientIp(event.request, event.getClientAddress()),
		userAgent: event.request.headers.get('user-agent'),
		referrer: event.request.headers.get('referer'),
		honeypot: data.website ?? '',
		submittedAtMs: renderedAtMs(event.cookies.get(FORM_STAMP_COOKIE))
	});

	const lead = await container.leads.submit(
		{
			type: data.type,
			goal: data.goal,
			budget: data.budget,
			timeline: data.timeline,
			contactName: data.contactName,
			contactEmail: data.contactEmail,
			contactTelegram: data.contactTelegram,
			utm: readUtm(event.url)
		},
		meta
	);

	redirect(303, `/thanks?id=${lead.publicId}`);
});

export const recentLeads = query(async () => {
	const { locals } = getRequestEvent();
	if (!locals.user) error(401, 'unauthorized'); // authorize inside every remote function
	return container.leads.listRecent(20);
});

/** UTM comes from the query string, never from the body: the body is attacker-controlled. */
function readUtm(url: URL): UtmParams {
	const utm: UtmParams = {};
	const keys = ['source', 'medium', 'campaign', 'content', 'term'] as const;
	for (const key of keys) {
		const value = url.searchParams.get(`utm_${key}`);
		if (value) utm[key] = value.slice(0, 120);
	}
	return utm;
}

/**
 * The page stamped a cookie when it rendered. A missing cookie means the visitor posted
 * without ever loading the form, so treat it as an instant submission.
 */
function renderedAtMs(stamp: string | undefined): number {
	const raw = Number(stamp);
	return Number.isFinite(raw) && raw > 0 ? raw : Date.now();
}

function clientIp(request: Request, fallback: string): string {
	return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || fallback;
}
