import * as v from 'valibot';
import * as privateEnv from '$env/static/private';
import * as publicEnv from '$env/static/public';
import { env as runtimeEnv } from '$env/dynamic/private';

const secret = v.pipe(v.string(), v.minLength(32));
const configSchema = v.object({
	DATABASE_FILE: v.pipe(v.string(), v.minLength(1)),
	PUBLIC_SITE_URL: v.pipe(v.string(), v.url()),
	SESSION_SECRET: secret,
	IP_HASH_SALT: secret
});
export type AppConfig = v.InferOutput<typeof configSchema>;

function load(): AppConfig {
	const result = v.safeParse(configSchema, {
		...privateEnv,
		...publicEnv,
		// A build uses a temporary database; the service supplies the persistent path at runtime.
		DATABASE_FILE: runtimeEnv.DATABASE_FILE ?? privateEnv.DATABASE_FILE
	});
	if (!result.success) {
		const details = result.issues
			.map((issue) => `${v.getDotPath(issue) ?? '<root>'}: ${issue.message}`)
			.join('; ');
		throw new Error(`invalid environment: ${details}`);
	}
	return result.output;
}

/** Secrets remain static; invalid configuration stops startup before traffic is accepted. */
export const config: AppConfig = load();
