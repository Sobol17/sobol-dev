import * as v from 'valibot';

export const loginSchema = v.object({
	email: v.pipe(v.string(), v.trim(), v.email(), v.maxLength(255)),
	password: v.pipe(v.string(), v.minLength(8), v.maxLength(200))
});

export type LoginInput = v.InferOutput<typeof loginSchema>;
