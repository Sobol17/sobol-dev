import { FakeNotifier } from '$lib/server/clients/notifier.fake';
import { SqliteUnitOfWork } from '$lib/server/db/unit-of-work';
import { FixedClock } from '$lib/server/domain/clock';
import { LeadService } from '$lib/server/domain/lead.service';
import { RateLimitService } from '$lib/server/domain/rate-limit.service';
import { LeadRepository } from '$lib/server/repositories/lead.repository';
import { OutboxRepository } from '$lib/server/repositories/outbox.repository';
import { leadSubmittedHandler } from '$lib/server/queue/handlers/lead-submitted';
import { outboxDispatchHandler } from '$lib/server/queue/handlers/outbox-dispatch';
import { SqliteJobQueue } from '$lib/server/queue/queue';
import { JobRunner, type JobHandlers } from '$lib/server/queue/runner';
import { TOPICS } from '$lib/server/queue/topics';
import { createLogger } from '$lib/server/log';
import type { LeadInput, RequestMeta } from '$lib/types';
import { createTestDb, type TestDb } from './db';

export const OWNER_CHAT_ID = 'owner-chat';
export const SITE_URL = 'https://example.test';

/** The reference vertical wired end to end against fakes. Every test builds its own. */
export function createLeadSlice(now = new Date('2026-03-01T10:00:00.000Z')) {
	const db: TestDb = createTestDb();
	const clock = new FixedClock(now);
	const log = createLogger('silent');

	const uow = new SqliteUnitOfWork(db.db);
	const queue = new SqliteJobQueue(db.db, clock);
	const leadRepository = new LeadRepository(db.db);
	const outboxRepository = new OutboxRepository(db.db);
	const notifier = new FakeNotifier();

	const leads = new LeadService(leadRepository, queue, uow, new RateLimitService(clock), clock);

	const handlers: JobHandlers = {
		[TOPICS.LEAD_SUBMITTED]: leadSubmittedHandler({
			leads: leadRepository,
			outbox: outboxRepository,
			queue,
			uow,
			ownerChatId: OWNER_CHAT_ID,
			siteUrl: SITE_URL
		}),
		[TOPICS.OUTBOX_DISPATCH]: outboxDispatchHandler({ outbox: outboxRepository, notifier, clock })
	};

	const runner = new JobRunner(db.db, handlers, log, { clock: () => clock.now() });

	return {
		db,
		clock,
		queue,
		runner,
		handlers,
		notifier,
		leads,
		leadRepository,
		outboxRepository,
		dispose: () => db.drop()
	};
}

export function leadInput(overrides: Partial<LeadInput> = {}): LeadInput {
	return {
		type: 'web',
		goal: 'Нужен интернет-магазин на тридцать товаров с оплатой и выгрузкой в 1С',
		budget: '3k_10k',
		timeline: '1_3m',
		contactName: 'Игорь',
		contactTelegram: '@client',
		...overrides
	};
}

export function requestMeta(overrides: Partial<RequestMeta> = {}): RequestMeta {
	return {
		ipHash: 'ip-hash-1',
		userAgent: 'vitest',
		referrer: null,
		// Long enough before the clock to clear the minimum fill duration.
		submittedAtMs: new Date('2026-03-01T09:59:00.000Z').getTime(),
		honeypot: '',
		...overrides
	};
}
