import type { OutboxDispatchPayload } from '$lib/types';
import type { Notifier } from '../../clients/notifier';
import { renderTemplate } from '../../clients/templates';
import type { OutboxRepository } from '../../repositories/outbox.repository';
import type { Clock } from '../../domain/clock';
import type { JobHandler } from '../runner';

export interface OutboxDispatchDeps {
	outbox: OutboxRepository;
	notifier: Notifier;
	clock: Clock;
}

/**
 * Delivers one outbox message.
 *
 * The conditional `pending -> sent` update is the idempotency point: only the caller that
 * wins the transition sends, so a repeated job is a no-op instead of a second message.
 */
export function outboxDispatchHandler(deps: OutboxDispatchDeps): JobHandler {
	return async (payload) => {
		const { messageId } = payload as unknown as OutboxDispatchPayload;

		const claimed = deps.outbox.claimPending(messageId, deps.clock.now());
		if (!claimed) return;

		try {
			await deps.notifier.send({
				recipient: claimed.recipient,
				text: renderTemplate(claimed.templateKey, claimed.payload)
			});
		} catch (error) {
			// Put the message back so the runner's backoff owns the retry schedule.
			const message = error instanceof Error ? error.message : String(error);
			deps.outbox.release(messageId, message);
			throw error;
		}
	};
}
