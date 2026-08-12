import { randomBytes } from 'node:crypto';
import type { VariantFormat } from '../clients/image-processor';
import { extensionFor, type AllowedImageMime } from '$lib/utils/image-type';

const ORIGINAL_PREFIX = 'orig';
const VARIANT_PREFIX = 'var';

/** Random name in storage: the uploaded file name is data, not a path, and stays in the database. */
export function originalKey(mime: AllowedImageMime): string {
	return `${ORIGINAL_PREFIX}/${randomBytes(16).toString('hex')}.${extensionFor(mime)}`;
}

export function variantKey(original: string, width: number, format: VariantFormat): string {
	return `${VARIANT_PREFIX}/${baseName(original)}-${width}.${format}`;
}

function baseName(key: string): string {
	const file = key.slice(key.lastIndexOf('/') + 1);
	const dot = file.lastIndexOf('.');
	return dot === -1 ? file : file.slice(0, dot);
}
