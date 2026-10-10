import { dev } from '$app/environment';
import { config } from './config';
import { createDb, type DbHandle } from './db/index';
import { SqliteUnitOfWork } from './db/unit-of-work';
import { createLogger, type Logger } from './log';
import { LeadRepository } from './repositories/lead.repository';
import { SessionRepository } from './repositories/session.repository';
import { AuthService } from './domain/auth.service';
import { LeadService } from './domain/lead.service';
import { RateLimitService } from './domain/rate-limit.service';
import { RequestMetaFactory } from './domain/request-meta';
import { systemClock, type Clock } from './domain/clock';

export interface Container {
	db: DbHandle;
	log: Logger;
	clock: Clock;
	leads: LeadService;
	auth: AuthService;
	meta: RequestMetaFactory;
}

/** Wire one database and one synchronous application process. */
export function buildContainer(): Container {
	const log = createLogger(dev ? 'debug' : 'info');
	const db = createDb(config.DATABASE_FILE);
	const clock = systemClock;
	const uow = new SqliteUnitOfWork(db.db);
	const rateLimit = new RateLimitService(clock);
	return {
		db,
		log,
		clock,
		leads: new LeadService(new LeadRepository(db.db), uow, rateLimit, clock),
		auth: new AuthService(new SessionRepository(db.db), rateLimit, clock),
		meta: new RequestMetaFactory(config.IP_HASH_SALT, clock)
	};
}

export const container: Container = buildContainer();
