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
