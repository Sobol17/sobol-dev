import type { Clock } from './clock';

export interface RateLimitPolicy {
	limit: number;
	windowMs: number;
}

/** Single source for every rate limit in the product. */
export const RATE_LIMITS = {
	login: { limit: 5, windowMs: 15 * 60 * 1000 },
	leadSubmit: { limit: 3, windowMs: 60 * 60 * 1000 },
	proposalView: { limit: 30, windowMs: 60 * 60 * 1000 }
} as const satisfies Record<string, RateLimitPolicy>;

/**
 * Counting is left to whoever owns the data, so a limit survives a restart instead of
 * living in process memory. This service holds the policy and the window arithmetic.
 */
export class RateLimitService {
	constructor(private readonly clock: Clock) {}

	windowStart(policy: RateLimitPolicy): Date {
		return new Date(this.clock.now().getTime() - policy.windowMs);
	}

	exceeded(count: number, policy: RateLimitPolicy): boolean {
		return count >= policy.limit;
	}
}
