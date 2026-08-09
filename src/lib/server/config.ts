import * as v from 'valibot';
import * as privateEnv from '$env/static/private';
// PUBLIC_SITE_URL carries the `PUBLIC_` prefix, so SvelteKit routes it to the public module.
// It is a site address, not a secret; every other value stays private.
import * as publicEnv from '$env/static/public';

const booleanFlag = v.pipe(
	v.optional(v.picklist(['true', 'false']), 'false'),
	v.transform((value) => value === 'true')
);

const secret = v.pipe(v.string(), v.minLength(32));

const configSchema = v.pipe(
	v.object({
		DATABASE_FILE: v.pipe(v.string(), v.minLength(1)),
		PUBLIC_SITE_URL: v.pipe(v.string(), v.url()),
		SESSION_SECRET: secret,
		IP_HASH_SALT: secret,
		TELEGRAM_BOT_TOKEN: v.optional(v.string(), ''),
		TELEGRAM_OWNER_CHAT_ID: v.optional(v.string(), ''),
		UPLOADS_DIR: v.pipe(v.string(), v.minLength(1)),
		USE_FAKE_CLIENTS: booleanFlag
	}),
	// Real clients need real credentials. Fail on start, not on the first notification.
	v.forward(
		v.check(
			(c) => c.USE_FAKE_CLIENTS || (c.TELEGRAM_BOT_TOKEN !== '' && c.TELEGRAM_OWNER_CHAT_ID !== ''),
			'telegram credentials required when USE_FAKE_CLIENTS=false'
		),
		['TELEGRAM_BOT_TOKEN']
	)
);

export type AppConfig = v.InferOutput<typeof configSchema>;

function load(): AppConfig {
	const result = v.safeParse(configSchema, { ...privateEnv, ...publicEnv });
	if (!result.success) {
		const details = result.issues
			.map((issue) => `${v.getDotPath(issue) ?? '<root>'}: ${issue.message}`)
			.join('; ');
		throw new Error(`invalid environment: ${details}`);
	}
	return result.output;
}

/** Read once on module load so a broken environment stops the process before it serves traffic. */
export const config: AppConfig = load();
