/**
 * The CSP header itself is emitted by SvelteKit (`kit.csp` in svelte.config.js) because only
 * the framework can hash and nonce its own inline scripts. Everything else lives here.
 */
export const SECURITY_HEADERS: Record<string, string> = {
	'x-content-type-options': 'nosniff',
	'referrer-policy': 'strict-origin-when-cross-origin',
	'x-frame-options': 'DENY',
	'permissions-policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
	'cross-origin-opener-policy': 'same-origin'
};

export function applySecurityHeaders(response: Response, secure: boolean): void {
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
		response.headers.set(name, value);
	}
	// HSTS on plain HTTP is meaningless and breaks local development.
	if (secure) {
		response.headers.set('strict-transport-security', 'max-age=31536000; includeSubDomains');
	}
}
