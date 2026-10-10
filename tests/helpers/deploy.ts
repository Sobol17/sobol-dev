import { execFileSync, spawnSync } from 'node:child_process';
import {
	cpSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const STUBS: Record<string, string> = {
	id: 'echo 0',
	flock: 'exit 0',
	chown: 'exit 0',
	runuser: 'while [[ $1 != -- ]]; do shift; done; shift; exec "$@"',
	sleep: 'exit 0',
	systemctl:
		'printf "systemctl:%s:%s\\n" "$1" "$(readlink "$AGENCY_SITE_ROOT/current" || true)" >> "$A5_EVENTS"',
	curl: 'target=$(readlink "$AGENCY_SITE_ROOT/current"); if [[ ${A5_HEALTH_FAIL:-0} == 1 && $target != */old ]]; then exit 22; fi; printf \'{"status":"ok"}\\n\'',
	pnpm: `case "$1" in
install) if [[ \${NODE_ENV:-} == production && " $* " != *' --prod=false '* ]]; then echo 'build dependencies omitted' >&2; exit 1; fi; printf 'install\\n' >> "$A5_EVENTS" ;;
build) printf 'build:%s\\n' "$DATABASE_FILE" >> "$A5_EVENTS"; [[ \${A5_BUILD_FAIL:-0} != 1 ]] || exit 1; mkdir -p build; touch build/index.js ;;
exec) printf 'backup\\n' >> "$A5_EVENTS" ;;
esac`
};

/** Fake only the host services and package build; keep Git, files and atomic symlink changes real. */
export function createDeployFixture() {
	const directory = mkdtempSync(join(tmpdir(), 'agency-deploy-'));
	const source = join(directory, 'source');
	const root = join(directory, 'site');
	const data = join(directory, 'data');
	const bin = join(directory, 'bin');
	const envFile = prepareDirectories(directory, source, root, data, bin);

	prepareCommands(bin, source);

	return {
		root,
		data,
		events: () => readFileSync(join(directory, 'events'), 'utf8'),
		run(script: string, overrides: Record<string, string> = {}) {
			return spawnSync('bash', [join(source, 'deploy', script)], {
				cwd: source,
				encoding: 'utf8',
				env: {
					...process.env,
					PATH: bin + ':' + process.env.PATH,
					AGENCY_SITE_ROOT: root,
					AGENCY_DATA_DIR: data,
					AGENCY_ENV_FILE: envFile,
					A5_EVENTS: join(directory, 'events'),
					...overrides
				}
			});
		},
		dispose: () => rmSync(directory, { recursive: true, force: true })
	};
}

function prepareCommands(bin: string, source: string): void {
	for (const [name, content] of Object.entries(STUBS))
		writeFileSync(join(bin, name), '#!/usr/bin/env bash\nset -e\n' + content + '\n', {
			mode: 0o755
		});
	for (const args of [
		['init', '-q'],
		['config', 'user.name', 'Sobol17'],
		['config', 'user.email', 'sobolinskiii@mail.ru'],
		['add', '.'],
		['commit', '-qm', 'chore(deploy): add the test release']
	])
		execFileSync('git', args, { cwd: source });
}

function prepareDirectories(
	directory: string,
	source: string,
	root: string,
	data: string,
	bin: string
): string {
	for (const path of [source, data, bin, join(root, 'releases/old/build')])
		mkdirSync(path, { recursive: true });
	cpSync(resolve('deploy'), join(source, 'deploy'), { recursive: true });
	writeFileSync(join(root, 'releases/old/build/index.js'), 'old release');
	symlinkSync(join(root, 'releases/old'), join(root, 'current'));
	writeFileSync(join(data, 'app.db'), 'persistent data');
	const envFile = join(directory, 'app.env');
	writeFileSync(
		envFile,
		`DATABASE_FILE=${data}/app.db\nNODE_ENV=production\nHOST=127.0.0.1\nPORT=3000\nPUBLIC_SITE_URL=https://example.test\nORIGIN=https://example.test\n`
	);
	return envFile;
}
