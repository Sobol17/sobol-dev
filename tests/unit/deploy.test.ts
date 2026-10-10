import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync, readlinkSync } from 'node:fs';
import { join } from 'node:path';
import { createDeployFixture } from '../helpers/deploy';

let host: ReturnType<typeof createDeployFixture>;
afterEach(() => host?.dispose());

describe('VPS release lifecycle', () => {
	it('builds in the production environment, isolates its database and backs up before restarting', () => {
		host = createDeployFixture();
		const result = host.run('deploy.sh');
		expect(result.status, result.stderr).toBe(0);
		const release = readlinkSync(join(host.root, 'current'));
		expect(release).not.toBe(join(host.root, 'releases/old'));
		expect(host.events()).toContain(`build:${release}/var/build.db`);
		expect(host.events().indexOf('backup')).toBeLessThan(
			host.events().indexOf('systemctl:restart')
		);
		expect(readlinkSync(join(host.root, 'previous'))).toBe(join(host.root, 'releases/old'));
		expect(readFileSync(join(host.data, 'app.db'), 'utf8')).toBe('persistent data');
	});

	it('leaves the old release running when the build fails', () => {
		host = createDeployFixture();
		const result = host.run('deploy.sh', { A5_BUILD_FAIL: '1' });
		expect(result.status).not.toBe(0);
		expect(readlinkSync(join(host.root, 'current'))).toBe(join(host.root, 'releases/old'));
		expect(host.events()).not.toContain('systemctl');
		expect(host.events()).not.toContain('backup');
	});

	it('restores the previous release when the candidate fails its health check', () => {
		host = createDeployFixture();
		const result = host.run('deploy.sh', { A5_HEALTH_FAIL: '1' });
		expect(result.status).not.toBe(0);
		expect(result.stderr).toContain('previous release restored');
		expect(readlinkSync(join(host.root, 'current'))).toBe(join(host.root, 'releases/old'));
		expect(readFileSync(join(host.data, 'app.db'), 'utf8')).toBe('persistent data');
	});

	it('supports an explicit code rollback without restoring the database', () => {
		host = createDeployFixture();
		expect(host.run('deploy.sh').status).toBe(0);
		const current = readlinkSync(join(host.root, 'current'));
		const result = host.run('rollback.sh');
		expect(result.status, result.stderr).toBe(0);
		expect(readlinkSync(join(host.root, 'current'))).toBe(join(host.root, 'releases/old'));
		expect(readlinkSync(join(host.root, 'previous'))).toBe(current);
		expect(readFileSync(join(host.data, 'app.db'), 'utf8')).toBe('persistent data');
	});
});
