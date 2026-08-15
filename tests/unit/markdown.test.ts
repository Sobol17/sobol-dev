import { describe, expect, it } from 'vitest';
import { markdownToText, renderMarkdown } from '$lib/utils/markdown';

describe('renderMarkdown', () => {
	it('escapes raw html instead of passing it through', () => {
		const html = renderMarkdown('<script>alert(1)</script>');

		expect(html).not.toContain('<script>');
		expect(html).toContain('&lt;script&gt;');
	});

	it('drops an event handler smuggled inside markup', () => {
		const html = renderMarkdown('<img src="x" onerror="alert(1)">');

		expect(html).not.toContain('<img');
		expect(html).not.toContain('onerror="');
	});

	it('renders headings starting at h2 so the page keeps a single h1', () => {
		const html = renderMarkdown('# Задача\n\n### Детали');

		expect(html).toContain('<h2>Задача</h2>');
		expect(html).toContain('<h3>Детали</h3>');
	});

	it('renders lists, emphasis and code spans', () => {
		const html = renderMarkdown('- **важно**\n- `pnpm build`');

		expect(html).toBe('<ul><li><strong>важно</strong></li><li><code>pnpm build</code></li></ul>');
	});

	it('keeps markdown syntax inside a code span literal', () => {
		const html = renderMarkdown('Текст `*не курсив*` дальше');

		expect(html).toContain('<code>*не курсив*</code>');
		expect(html).not.toContain('<em>');
	});

	it('renders an http link and marks it as external', () => {
		const html = renderMarkdown('[сайт](https://example.test/page)');

		expect(html).toBe(
			'<p><a href="https://example.test/page" target="_blank" rel="noopener noreferrer">сайт</a></p>'
		);
	});

	it('refuses a javascript url and leaves it as text', () => {
		const html = renderMarkdown('[клик](javascript:alert(1))');

		expect(html).not.toContain('<a ');
		expect(html).not.toContain('href=');
	});

	it('keeps a fenced block as escaped code', () => {
		const html = renderMarkdown('```\n<b>x</b>\n```');

		expect(html).toBe('<pre><code>&lt;b&gt;x&lt;/b&gt;</code></pre>');
	});
});

describe('markdownToText', () => {
	it('strips markup down to a readable line', () => {
		expect(markdownToText('## Задача\n\nСделать **быстро** и [точно](https://example.test)')).toBe(
			'Задача Сделать быстро и точно'
		);
	});
});
