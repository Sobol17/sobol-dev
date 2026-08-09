/**
 * Scripts run outside Vite, so `$env/static/private` is not available to them. They read the
 * process environment here, once, and nowhere else. Application code keeps using `lib/server/config`.
 */
export function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) throw new Error(`missing environment variable: ${name}`);
	return value;
}

export function databaseFile(): string {
	return requireEnv('DATABASE_FILE');
}
