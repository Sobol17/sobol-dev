export const ALLOWED_IMAGE_MIMES = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'] as const;

export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIMES)[number];

/** Ten megabytes covers a camera JPEG and stops an upload from eating the disk. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const EXTENSIONS: Record<AllowedImageMime, string> = {
	'image/png': 'png',
	'image/jpeg': 'jpg',
	'image/webp': 'webp',
	'image/avif': 'avif'
};

/**
 * Reads the format from the bytes, not from the name or the browser-supplied type.
 * A renamed executable never gets past this, which is the whole point of the check.
 */
export function detectImageMime(bytes: Uint8Array): AllowedImageMime | null {
	if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
	if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg';
	if (matchesAscii(bytes, 0, 'RIFF') && matchesAscii(bytes, 8, 'WEBP')) return 'image/webp';
	if (matchesAscii(bytes, 4, 'ftyp') && isAvifBrand(bytes)) return 'image/avif';
	return null;
}

export function extensionFor(mime: AllowedImageMime): string {
	return EXTENSIONS[mime];
}

export function mimeForExtension(extension: string): AllowedImageMime | null {
	const found = Object.entries(EXTENSIONS).find(([, value]) => value === extension.toLowerCase());
	return found ? (found[0] as AllowedImageMime) : null;
}

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
	if (bytes.length < signature.length) return false;
	return signature.every((byte, index) => bytes[index] === byte);
}

function matchesAscii(bytes: Uint8Array, offset: number, text: string): boolean {
	if (bytes.length < offset + text.length) return false;
	return [...text].every((char, index) => bytes[offset + index] === char.charCodeAt(0));
}

/** The major brand sits right after `ftyp`; `avis` is the animated sibling of `avif`. */
function isAvifBrand(bytes: Uint8Array): boolean {
	return matchesAscii(bytes, 8, 'avif') || matchesAscii(bytes, 8, 'avis');
}
