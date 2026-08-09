const CYRILLIC_MAP: Record<string, string> = {
	а: 'a',
	б: 'b',
	в: 'v',
	г: 'g',
	д: 'd',
	е: 'e',
	ё: 'e',
	ж: 'zh',
	з: 'z',
	и: 'i',
	й: 'i',
	к: 'k',
	л: 'l',
	м: 'm',
	н: 'n',
	о: 'o',
	п: 'p',
	р: 'r',
	с: 's',
	т: 't',
	у: 'u',
	ф: 'f',
	х: 'h',
	ц: 'c',
	ч: 'ch',
	ш: 'sh',
	щ: 'sch',
	ъ: '',
	ы: 'y',
	ь: '',
	э: 'e',
	ю: 'yu',
	я: 'ya'
};

const MAX_SLUG_LENGTH = 80;

/**
 * Always returns a non-empty url-safe slug. Titles are Russian more often than not,
 * so transliterate before stripping: otherwise every case would collapse to the fallback.
 */
export function slugify(title: string): string {
	const transliterated = [...title.toLowerCase()]
		.map((char) => CYRILLIC_MAP[char] ?? char)
		.join('')
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '');

	const slug = transliterated
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, MAX_SLUG_LENGTH)
		.replace(/-+$/g, '');

	return slug || 'item';
}

/** Appends the smallest numeric suffix that clears the collision. */
export function uniqueSlug(title: string, taken: ReadonlySet<string>): string {
	const base = slugify(title);
	if (!taken.has(base)) return base;

	for (let suffix = 2; ; suffix += 1) {
		const candidate = `${base.slice(0, MAX_SLUG_LENGTH - String(suffix).length - 1)}-${suffix}`;
		if (!taken.has(candidate)) return candidate;
	}
}
