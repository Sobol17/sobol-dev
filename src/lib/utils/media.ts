import type { MediaRef, MediaVariant } from '$lib/types';

/** Uploads are served by an application route, never straight from the static directory. */
export function mediaUrl(key: string): string {
	return `/media/${key}`;
}

/** Smallest variant that still covers the requested width, or the largest one there is. */
export function pickVariant(
	ref: Pick<MediaRef, 'variants'>,
	width: number,
	format: MediaVariant['format'] = 'webp'
): MediaVariant | undefined {
	const sorted = ref.variants
		.filter((variant) => variant.format === format)
		.sort((left, right) => left.width - right.width);

	return sorted.find((variant) => variant.width >= width) ?? sorted.at(-1);
}

export function srcset(ref: Pick<MediaRef, 'variants'>, format: MediaVariant['format']): string {
	return ref.variants
		.filter((variant) => variant.format === format)
		.sort((left, right) => left.width - right.width)
		.map((variant) => `${mediaUrl(variant.key)} ${variant.width}w`)
		.join(', ');
}
