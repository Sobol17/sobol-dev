import { FakeImageProcessor } from '$lib/server/clients/image-processor.fake';
import { FakeStorage } from '$lib/server/clients/storage.fake';
import { SqliteUnitOfWork } from '$lib/server/db/unit-of-work';
import { FixedClock } from '$lib/server/domain/clock';
import { MediaService } from '$lib/server/domain/media.service';
import { ProjectService } from '$lib/server/domain/project.service';
import { createLogger } from '$lib/server/log';
import { mediaProcessHandler } from '$lib/server/queue/handlers/media-process';
import { SqliteJobQueue } from '$lib/server/queue/queue';
import { JobRunner, type JobHandlers } from '$lib/server/queue/runner';
import { TOPICS } from '$lib/server/queue/topics';
import { MediaRepository } from '$lib/server/repositories/media.repository';
import { ProjectRepository } from '$lib/server/repositories/project.repository';
import { createTestDb, type TestDb } from './db';

/** The media slice wired against fakes: no disk, no encoder, no waiting. */
export function createMediaSlice(now = new Date('2026-04-02T12:00:00.000Z')) {
	const db: TestDb = createTestDb();
	const clock = new FixedClock(now);
	const log = createLogger('silent');

	const uow = new SqliteUnitOfWork(db.db);
	const queue = new SqliteJobQueue(db.db, clock);
	const storage = new FakeStorage();
	const images = new FakeImageProcessor();

	const mediaRepository = new MediaRepository(db.db);
	const projectRepository = new ProjectRepository(db.db);

	const media = new MediaService(mediaRepository, storage, queue, uow, clock);
	const projects = new ProjectService(projectRepository, uow, clock);

	const handlers: JobHandlers = {
		[TOPICS.MEDIA_PROCESS]: mediaProcessHandler({ media: mediaRepository, storage, images })
	};

	const runner = new JobRunner(db.db, handlers, log, { clock: () => clock.now() });

	return {
		db,
		clock,
		queue,
		runner,
		handlers,
		storage,
		images,
		media,
		projects,
		mediaRepository,
		projectRepository,
		dispose: () => db.drop()
	};
}

/** Smallest byte sequence that passes the magic-byte check for a PNG. */
export function pngBytes(payload = 64): Uint8Array {
	const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
	return new Uint8Array([...signature, ...new Array(payload).fill(0x2a)]);
}

export function jpegBytes(): Uint8Array {
	return new Uint8Array([0xff, 0xd8, 0xff, ...new Array(32).fill(0x11)]);
}
