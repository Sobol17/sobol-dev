import { leadSubmittedHandler, type LeadSubmittedDeps } from './lead-submitted';
import { outboxDispatchHandler, type OutboxDispatchDeps } from './outbox-dispatch';
import { TOPICS, type Topic } from '../topics';
import type { JobHandler } from '../runner';

export function createHandlers(
	deps: LeadSubmittedDeps & OutboxDispatchDeps
): Record<Topic, JobHandler> {
	return {
		[TOPICS.LEAD_SUBMITTED]: leadSubmittedHandler(deps),
		[TOPICS.OUTBOX_DISPATCH]: outboxDispatchHandler(deps)
	};
}
