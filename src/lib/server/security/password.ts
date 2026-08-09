import { hash, verify } from '@node-rs/argon2';

/** OWASP baseline for argon2id. Raising memoryCost later invalidates nothing: the hash carries it. */
const ARGON_OPTIONS = {
	memoryCost: 19456,
	timeCost: 2,
	parallelism: 1
} as const;

export function hashPassword(password: string): Promise<string> {
	return hash(password, ARGON_OPTIONS);
}

export function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
	return verify(passwordHash, password, ARGON_OPTIONS);
}
