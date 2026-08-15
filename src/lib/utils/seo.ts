/**
 * Structured data for crawlers. The payload goes through `JSON.stringify` and every `<`
 * becomes a JSON escape, so no value can close the element early and the result is safe
 * to hand to `{@html}`.
 */
export function jsonLdScript(data: Record<string, unknown>): string {
	const json = JSON.stringify(data).replace(/</g, '\\u003c');
	return `<script type="application/ld+json">${json}</script>`;
}
