import { BackupService } from '../src/lib/server/db/backup';
import { systemClock } from '../src/lib/server/domain/clock';
import { databaseFile } from './env';

const directory = process.argv[2];
if (!directory) throw new Error('usage: pnpm db:backup <directory>');
const backup = new BackupService(databaseFile(), directory, systemClock).create();
console.log(`backup verified at ${backup}`);
