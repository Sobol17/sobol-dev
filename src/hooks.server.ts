import { randomUUID } from 'node:crypto';
import type { Handle, HandleServerError, ServerInit } from '@sveltejs/kit';
import { container } from '$lib/server/container';
import { applySecurityHeaders } from '$lib/server/security/csp';
import { SESSION_COOKIE } from '$lib/server/security/session';

/** One worker per process, started once, stopped on SIGTERM with the job in flight finished. */
export const init: ServerInit = () => {
	container.start();

	for (const signal of ['SIGTERM', 'SIGINT'] as const) {
		process.once(signal, () => {
			void container.stop().then(() => process.exit(0));
		});
	}
};

export const handle: Handle = async ({ event, resolve }) => {
	const started = Date.now();
	event.locals.requestId = randomUUID();
	event.locals.user = null;

	const token = event.cookies.get(SESSION_COOKIE);
	if (token) {
		const found = container.auth.resolve(token);
		if (found) {
			event.locals.user = found.user;
		} else {
			event.cookies.delete(SESSION_COOKIE, { path: '/' });
		}
	}

	const response = await resolve(event);
	applySecurityHeaders(response, event.url.protocol === 'https:');
	response.headers.set('x-request-id', event.locals.requestId);

	container.log.info(
		{
			requestId: event.locals.requestId,
			method: event.request.method,
			path: event.url.pathname,
			status: response.status,
			durationMs: Date.now() - started
		},
		'request'
	);

	return response;
};

/** Full error to the log, a neutral message plus the request id to the client. */
export const handleError: HandleServerError = ({ error, event, status, message }) => {
	const requestId = event.locals.requestId ?? 'unknown';
	container.log.error(
		{ requestId, status, path: event.url.pathname, err: error },
		'unhandled error'
	);

	return {
		message: status === 404 ? message : 'Что-то сломалось. Попробуйте ещё раз.',
		requestId
	};
};
