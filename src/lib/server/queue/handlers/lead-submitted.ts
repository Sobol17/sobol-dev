import type { JobQueue, LeadSubmittedPayload } from '$lib/types';
import { TEMPLATE_KEYS, type LeadNewPayload } from '../../clients/templates';
import type { LeadRepository } from '../../repositories/lead.repository';
import type { OutboxRepository } from '../../repositories/outbox.repository';
import type { UnitOfWork } from '../../db/unit-of-work';
import { TOPICS } from '../topics';
import type { JobHandler } from '../runner';

export interface LeadSubmittedDeps {
	leads: LeadRepository;
	outbox: OutboxRepository;
	queue: JobQueue;
	uow: UnitOfWork;
	ownerChatId: string;
	siteUrl: string;
}

/**
 * Turns a stored lead into one outbox message for the owner.
 *
 * Idempotent twice over: the outbox insert conflicts on `dedupeKey`, and the follow-up
 * dispatch job carries the message id as its unique key.
 */
export function leadSubmittedHandler(deps: LeadSubmittedDeps): JobHandler {
	return (payload) => {
		const { leadId } = payload as unknown as LeadSubmittedPayload;
		const lead = deps.leads.findById(leadId);
		if (!lead) throw new Error(`lead ${leadId} not found`);

		// Spam is stored for review but never reaches the owner's chat.
		if (lead.status === 'spam') return;

		const messagePayload: LeadNewPayload = {
			publicId: lead.publicId,
			type: lead.type,
			budget: lead.budget,
			timeline: lead.timeline,
			contactName: lead.contactName,
			contact: lead.contactTelegram ?? lead.contactEmail ?? '',
			goal: lead.goal,
			adminUrl: `${deps.siteUrl}/admin/leads/${lead.id}`
		};

		deps.uow.transaction(() => {
			const message = deps.outbox.enqueue({
				channel: 'telegram',
				templateKey: TEMPLATE_KEYS.LEAD_NEW,
				recipient: deps.ownerChatId,
				payload: messagePayload,
				dedupeKey: `telegram:${TEMPLATE_KEYS.LEAD_NEW}:${lead.id}`
			});

			deps.queue.publish(
				TOPICS.OUTBOX_DISPATCH,
				{ messageId: message.id },
				{ uniqueKey: `${TOPICS.OUTBOX_DISPATCH}:${message.id}` }
			);
		});
	};
}
