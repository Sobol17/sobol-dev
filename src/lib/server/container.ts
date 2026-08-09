import { dev } from '$app/environment';
import { config } from './config';
import { createDb, type DbHandle } from './db/index';
import { SqliteUnitOfWork } from './db/unit-of-work';
import { createLogger, type Logger } from './log';
import { FakeNotifier } from './clients/notifier.fake';
import { TelegramNotifier } from './clients/notifier.telegram';
import type { Notifier } from './clients/notifier';
import { FakeStorage } from './clients/storage.fake';
import { FsStorage } from './clients/storage.fs';
import type { Storage } from './clients/storage';
import { LeadRepository } from './repositories/lead.repository';
import { OutboxRepository } from './repositories/outbox.repository';
import { SessionRepository } from './repositories/session.repository';
import { AuthService } from './domain/auth.service';
import { LeadService } from './domain/lead.service';
import { RateLimitService } from './domain/rate-limit.service';
import { RequestMetaFactory } from './domain/request-meta';
import { systemClock, type Clock } from './domain/clock';
import { SqliteJobQueue } from './queue/queue';
import { JobRunner, type JobHandlers } from './queue/runner';
import { JobScheduler } from './queue/scheduler';
import { TOPICS } from './queue/topics';
import { leadSubmittedHandler } from './queue/handlers/lead-submitted';
import { outboxDispatchHandler } from './queue/handlers/outbox-dispatch';

export interface Container {
	db: DbHandle;
	log: Logger;
	clock: Clock;
	notifier: Notifier;
	storage: Storage;
	queue: SqliteJobQueue;
	runner: JobRunner;
	scheduler: JobScheduler;
	leads: LeadService;
	auth: AuthService;
	meta: RequestMetaFactory;
	start(): void;
	stop(): Promise<void>;
}

/**
 * Composition root. Everything is wired once here; routes ask this module for a ready service
 * and never construct infrastructure themselves.
 */
export function buildContainer(): Container {
	const log = createLogger(dev ? 'debug' : 'info');
	const db = createDb(config.DATABASE_FILE);
	const clock = systemClock;

	const uow = new SqliteUnitOfWork(db.db);
	const queue = new SqliteJobQueue(db.db, clock);

	const notifier: Notifier = config.USE_FAKE_CLIENTS
		? new FakeNotifier()
		: new TelegramNotifier(config.TELEGRAM_BOT_TOKEN);
	const storage: Storage = config.USE_FAKE_CLIENTS
		? new FakeStorage()
		: new FsStorage(config.UPLOADS_DIR);

	const leadRepository = new LeadRepository(db.db);
	const outboxRepository = new OutboxRepository(db.db);
	const sessionRepository = new SessionRepository(db.db);

	const rateLimit = new RateLimitService(clock);
	const leads = new LeadService(leadRepository, queue, uow, rateLimit, clock);
	const auth = new AuthService(sessionRepository, rateLimit, clock);
	const meta = new RequestMetaFactory(config.IP_HASH_SALT, clock);

	const handlers: JobHandlers = {
		[TOPICS.LEAD_SUBMITTED]: leadSubmittedHandler({
			leads: leadRepository,
			outbox: outboxRepository,
			queue,
			uow,
			ownerChatId: config.TELEGRAM_OWNER_CHAT_ID,
			siteUrl: config.PUBLIC_SITE_URL
		}),
		[TOPICS.OUTBOX_DISPATCH]: outboxDispatchHandler({
			outbox: outboxRepository,
			notifier,
			clock
		})
	};

	const runner = new JobRunner(db.db, handlers, log);
	const scheduler = new JobScheduler(queue, log, () => clock.now());

	let started = false;

	return {
		db,
		log,
		clock,
		notifier,
		storage,
		queue,
		runner,
		scheduler,
		leads,
		auth,
		meta,

		start() {
			if (started) return;
			started = true;
			runner.start();
			// Periodic work waits for its handler. media.gc arrives with the media slice.
			if (handlers[TOPICS.MEDIA_GC]) scheduler.start();
		},

		async stop() {
			scheduler.stop();
			await runner.stop();
			db.close();
		}
	};
}

export const container: Container = buildContainer();
