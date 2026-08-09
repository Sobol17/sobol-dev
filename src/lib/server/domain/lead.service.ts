import type { JobQueue, LeadInput, LeadListItem, RequestMeta } from '$lib/types';
import { generatePublicId } from '$lib/utils/public-id';
import { isSpam, scoreSpam } from '$lib/utils/spam';
import type { UnitOfWork } from '../db/unit-of-work';
import type { LeadRepository, LeadRow } from '../repositories/lead.repository';
import { TOPICS } from '../queue/topics';
import type { Clock } from './clock';
import { RATE_LIMITS, type RateLimitService } from './rate-limit.service';

const PUBLIC_ID_ATTEMPTS = 5;

export class LeadService {
	constructor(
		private readonly leads: LeadRepository,
		private readonly queue: JobQueue,
		private readonly uow: UnitOfWork,
		private readonly rateLimit: RateLimitService,
		private readonly clock: Clock
	) {}

	/**
	 * Persists a lead and schedules owner notification. The insert and the job commit together,
	 * so a lead can never exist without its notification job or the other way round.
	 */
	async submit(input: LeadInput, meta: RequestMeta): Promise<LeadRow> {
		const now = this.clock.now();
		const recentFromIp = meta.ipHash
			? this.leads.countRecentByIp(meta.ipHash, this.rateLimit.windowStart(RATE_LIMITS.leadSubmit))
			: 0;

		// Scored here, not in the job: the honeypot and the fill duration exist only on the request.
		const spamScore = scoreSpam({
			input,
			meta,
			fillDurationMs: now.getTime() - meta.submittedAtMs,
			recentFromIp
		});

		if (!input.contactEmail && !input.contactTelegram) {
			throw new Error('lead needs at least one contact channel');
		}

		return this.uow.transaction(() => {
			const lead = this.leads.insert({
				publicId: this.nextPublicId(),
				type: input.type,
				goal: input.goal,
				budget: input.budget,
				timeline: input.timeline,
				contactName: input.contactName,
				contactEmail: input.contactEmail ?? null,
				contactTelegram: input.contactTelegram ?? null,
				status: isSpam(spamScore) ? 'spam' : 'new',
				utm: input.utm ?? {},
				referrer: meta.referrer,
				ipHash: meta.ipHash,
				userAgent: meta.userAgent,
				spamScore,
				createdAt: now,
				updatedAt: now
			});

			this.queue.publish(
				TOPICS.LEAD_SUBMITTED,
				{ leadId: lead.id },
				{ uniqueKey: `${TOPICS.LEAD_SUBMITTED}:${lead.id}` }
			);

			return lead;
		});
	}

	listRecent(limit = 20): LeadListItem[] {
		return this.leads.listRecent(limit);
	}

	stats(): { total: number; fresh: number } {
		return { total: this.leads.count(), fresh: this.leads.countByStatus('new') };
	}

	/** Collisions are astronomically unlikely but the column is unique, so retry instead of throwing. */
	private nextPublicId(): string {
		for (let attempt = 0; attempt < PUBLIC_ID_ATTEMPTS; attempt += 1) {
			const candidate = generatePublicId();
			if (!this.leads.findByPublicId(candidate)) return candidate;
		}
		throw new Error('could not allocate a unique public lead id');
	}
}
