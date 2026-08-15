/**
 * Markdown for case bodies and proposals. The renderer escapes everything first and then emits
 * a fixed set of tags, so the allowlist is the code itself: raw HTML in the source can never
 * reach the output and `{@html}` on the result stays safe.
 */

const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:'];

/** Code spans are pulled out before the inline patterns run, so `*` inside code stays literal. */
const CODE_PLACEHOLDER = '\u0000';

export function renderMarkdown(source: string): string {
	const lines = source.replace(/\r\n?/g, '\n').split('\n');
	const blocks: string[] = [];
	let index = 0;

	while (index < lines.length) {
		const line = lines[index] ?? '';

		if (line.trim() === '') {
			index += 1;
			continue;
		}

		if (line.startsWith('```')) {
			const code: string[] = [];
			index += 1;
			while (index < lines.length && !(lines[index] ?? '').startsWith('```')) {
				code.push(lines[index] ?? '');
				index += 1;
			}
			index += 1; // closing fence, missing at the end of the file
			blocks.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
			continue;
		}

		const heading = /^(#{1,6})\s+(.*)$/.exec(line);
		if (heading) {
			// The page owns the only h1. Markdown headings start at h2 and stop at h4.
			const level = Math.min(Math.max(heading[1]?.length ?? 2, 2), 4);
			blocks.push(`<h${level}>${renderInline(heading[2] ?? '')}</h${level}>`);
			index += 1;
			continue;
		}

		if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
			blocks.push('<hr />');
			index += 1;
			continue;
		}

		if (/^>\s?/.test(line)) {
			const quoted: string[] = [];
			while (index < lines.length && /^>\s?/.test(lines[index] ?? '')) {
				quoted.push((lines[index] ?? '').replace(/^>\s?/, ''));
				index += 1;
			}
			blocks.push(`<blockquote><p>${renderInline(quoted.join(' '))}</p></blockquote>`);
			continue;
		}

		const bulleted = /^\s*[-*+]\s+/;
		if (bulleted.test(line)) {
			const items: string[] = [];
			while (index < lines.length && bulleted.test(lines[index] ?? '')) {
				items.push((lines[index] ?? '').replace(bulleted, ''));
				index += 1;
			}
			blocks.push(`<ul>${items.map((item) => `<li>${renderInline(item)}</li>`).join('')}</ul>`);
			continue;
		}

		const numbered = /^\s*\d+[.)]\s+/;
		if (numbered.test(line)) {
			const items: string[] = [];
			while (index < lines.length && numbered.test(lines[index] ?? '')) {
				items.push((lines[index] ?? '').replace(numbered, ''));
				index += 1;
			}
			blocks.push(`<ol>${items.map((item) => `<li>${renderInline(item)}</li>`).join('')}</ol>`);
			continue;
		}

		const paragraph: string[] = [];
		while (index < lines.length && !startsBlock(lines[index] ?? '')) {
			paragraph.push(lines[index] ?? '');
			index += 1;
		}
		blocks.push(`<p>${renderInline(paragraph.join(' '))}</p>`);
	}

	return blocks.join('\n');
}

/** Strips markup down to readable text. Feeds meta descriptions and previews. */
export function markdownToText(source: string): string {
	return source
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/`([^`]+)`/g, '$1')
		.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/^\s{0,3}(?:#{1,6}|>|[-*+])\s+/gm, '')
		.replace(/[*_~]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

function startsBlock(line: string): boolean {
	return (
		line.trim() === '' ||
		line.startsWith('```') ||
		/^#{1,6}\s+/.test(line) ||
		/^>\s?/.test(line) ||
		/^\s*[-*+]\s+/.test(line) ||
		/^\s*\d+[.)]\s+/.test(line) ||
		/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)
	);
}

function renderInline(raw: string): string {
	const codes: string[] = [];
	const masked = raw.replace(/`([^`]+)`/g, (_, code: string) => {
		codes.push(`<code>${escapeHtml(code)}</code>`);
		return `${CODE_PLACEHOLDER}${codes.length - 1}${CODE_PLACEHOLDER}`;
	});

	const html = escapeHtml(masked)
		.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, text: string, href: string) =>
			renderLink(match, text, href)
		)
		.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
		.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');

	return html.replace(
		new RegExp(`${CODE_PLACEHOLDER}(\\d+)${CODE_PLACEHOLDER}`, 'g'),
		(_, position: string) => codes[Number(position)] ?? ''
	);
}

/** An unsupported scheme leaves the link as plain text instead of producing a live one. */
function renderLink(match: string, text: string, href: string): string {
	if (!isSafeHref(href)) return match;

	const external = !href.startsWith('/');
	const attributes = external ? ' target="_blank" rel="noopener noreferrer"' : '';
	return `<a href="${href}"${attributes}>${text}</a>`;
}

function isSafeHref(href: string): boolean {
	if (href.startsWith('/') && !href.startsWith('//')) return true;
	if (href.startsWith('#')) return true;

	try {
		return ALLOWED_PROTOCOLS.includes(new URL(href).protocol);
	} catch {
		return false;
	}
}

export function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}
