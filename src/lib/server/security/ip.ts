import { createHash } from 'node:crypto';

/**
 * Raw IP never reaches storage. The salt makes the hash useless outside this deployment,
 * so a leaked database does not turn into a list of visitor addresses.
 */
export function hashIp(ip: string | null, salt: string): string | null {
	if (!ip) return null;
	return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}
