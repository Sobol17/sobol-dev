import * as v from 'valibot';
import { ALLOWED_IMAGE_MIMES, MAX_UPLOAD_BYTES } from '$lib/utils/image-type';
import { idSchema } from './common';

/**
 * The browser-supplied type is only a first filter. The service re-reads the magic bytes,
 * because the type on a `File` is whatever the client felt like sending.
 */
export const mediaUploadSchema = v.object({
	file: v.pipe(
		v.file(),
		v.mimeType([...ALLOWED_IMAGE_MIMES]),
		v.maxSize(MAX_UPLOAD_BYTES),
		v.minSize(1)
	)
});

export const mediaIdSchema = v.object({ id: idSchema });

export const mediaAltSchema = v.object({
	id: idSchema,
	alt: v.pipe(v.string(), v.trim(), v.maxLength(200))
});

export const galleryItemSchema = v.object({
	projectId: idSchema,
	mediaId: idSchema
});

export const galleryOrderSchema = v.object({
	projectId: idSchema,
	mediaIds: v.pipe(v.array(idSchema), v.maxLength(100))
});

export const coverSchema = v.object({
	projectId: idSchema,
	mediaId: v.nullable(idSchema)
});

/** Storage keys come back from the database, but the serving route still checks the shape. */
export const storageKeySchema = v.pipe(
	v.string(),
	v.maxLength(200),
	v.regex(/^[a-z0-9]+(?:\/[a-z0-9-]+)*\.[a-z0-9]+$/)
);
