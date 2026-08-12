import { isHttpError } from '@sveltejs/kit';

/**
 * A remote function that called `error()` arrives on the client as an `HttpError`, which is
 * not an `Error` instance. Without this the message the server chose would be swallowed.
 */
export function errorText(thrown: unknown, fallback: string): string {
	if (isHttpError(thrown)) return thrown.body.message || fallback;
	if (thrown instanceof Error && thrown.message) return thrown.message;
	return fallback;
}
