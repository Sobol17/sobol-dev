import { fail, redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { loginSchema } from '$lib/schemas/auth';
import { container } from '$lib/server/container';
import { hashIp } from '$lib/server/security/ip';
import { config } from '$lib/server/config';
import { SESSION_COOKIE, sessionCookieOptions } from '$lib/server/security/session';
import type { Actions, PageServerLoad } from './$types';

/** Same text for every failure: the response must not say which half of the pair was wrong. */
const GENERIC_ERROR = 'Неверная почта или пароль';

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.user) redirect(303, url.searchParams.get('next') ?? '/admin');
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies, getClientAddress, url }) => {
		const data = await request.formData();
		const parsed = v.safeParse(loginSchema, {
			email: data.get('email'),
			password: data.get('password')
		});

		if (!parsed.success) {
			return fail(400, { error: GENERIC_ERROR });
		}

		const ipHash = hashIp(getClientAddress(), config.IP_HASH_SALT) ?? 'unknown';
		const result = await container.auth.login(parsed.output.email, parsed.output.password, {
			ipHash,
			userAgent: request.headers.get('user-agent')
		});

		if (!result.ok) {
			return fail(result.reason === 'rate_limited' ? 429 : 400, {
				error:
					result.reason === 'rate_limited'
						? 'Слишком много попыток. Подождите 15 минут.'
						: GENERIC_ERROR
			});
		}

		cookies.set(SESSION_COOKIE, result.token, sessionCookieOptions);
		redirect(303, url.searchParams.get('next') ?? '/admin');
	}
};
