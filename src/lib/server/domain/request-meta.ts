import type { RequestMeta } from '$lib/types';
import { hashIp } from '../security/ip';
import type { Clock } from './clock';

export interface RawRequestSignals {
	ip: string | null;
	userAgent: string | null;
	referrer: string | null;
	/** Honeypot value and form render timestamp, both posted by the form itself. */
	honeypot?: string;
	submittedAtMs?: number;
}

/** Takes primitives, not a Request: the domain layer stays free of HTTP types. */
export class RequestMetaFactory {
	constructor(
		private readonly ipSalt: string,
		private readonly clock: Clock
	) {}

	from(signals: RawRequestSignals): RequestMeta {
		return {
			ipHash: hashIp(signals.ip, this.ipSalt),
			userAgent: signals.userAgent?.slice(0, 500) ?? null,
			referrer: signals.referrer?.slice(0, 500) ?? null,
			submittedAtMs: signals.submittedAtMs ?? this.clock.now().getTime(),
			honeypot: signals.honeypot ?? ''
		};
	}
}
