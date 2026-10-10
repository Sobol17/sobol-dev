import { createHandlers } from './queue/handlers';
import { dev } from '$app/environment';
import { config } from './config';
import { createDb, type DbHandle } from './db/index';
import { SqliteUnitOfWork } from './db/unit-of-work';
import { createLogger, type Logger } from './log';
import { FakeNotifier } from './clients/notifier.fake';
import { TelegramNotifier } from './clients/notifier.telegram';
import type { Notifier } from './clients/notifier';
import { LeadRepository } from './repositories/lead.repository';
import { OutboxRepository } from './repositories/outbox.repository';
import { SessionRepository } from './repositories/session.repository';
import { AuthService } from './domain/auth.service';
import { LeadService } from './domain/lead.service';
import { RateLimitService } from './domain/rate-limit.service';
import { RequestMetaFactory } from './domain/request-meta';
import { systemClock, type Clock } from './domain/clock';
import { SqliteJobQueue } from './queue/queue';
import { JobRunner } from './queue/runner';
import { JobScheduler } from './queue/scheduler';

export interface Container {
	db: DbHandle;
	log: Logger;
	clock: Clock;
	notifier: Notifier;
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

	const leadRepository = new LeadRepository(db.db);
	const outboxRepository = new OutboxRepository(db.db);
	const sessionRepository = new SessionRepository(db.db);

	const rateLimit = new RateLimitService(clock);
	const leads = new LeadService(leadRepository, queue, uow, rateLimit, clock);
	const auth = new AuthService(sessionRepository, rateLimit, clock);
	const meta = new RequestMetaFactory(config.IP_HASH_SALT, clock);

	const handlers = createHandlers({
		leads: leadRepository,
		outbox: outboxRepository,
		queue,
		uow,
		notifier,
		clock,
		ownerChatId: config.TELEGRAM_OWNER_CHAT_ID,
		siteUrl: config.PUBLIC_SITE_URL
	});

	const runner = new JobRunner(db.db, handlers, log);
	const scheduler = new JobScheduler(queue, log, () => clock.now());

	let started = false;

	return {
		db,
		log,
		clock,
		notifier,
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
		},

		async stop() {
			scheduler.stop();
			await runner.stop();
			db.close();
		}
	};
}

export const container: Container = buildContainer();
