import * as v from 'valibot';
import { randomInt } from 'node:crypto';

/** No vowels and no lookalikes: the id gets read out loud over the phone. */
const ALPHABET = '23456789CDFGHJKMNPQRTVWXY';
const LENGTH = 6;

export function generatePublicId(): string {
	let id = '';
	for (let index = 0; index < LENGTH; index += 1) {
		id += ALPHABET[randomInt(ALPHABET.length)];
	}
	return id;
}

const publicIdSchema = v.pipe(v.string(), v.regex(new RegExp(`^[${ALPHABET}]{${LENGTH}}$`)));

/** Reject arbitrary query text before rendering a public reference. */
export function parsePublicId(value: unknown): string | null {
	const parsed = v.safeParse(publicIdSchema, value);
	return parsed.success ? parsed.output : null;
}
