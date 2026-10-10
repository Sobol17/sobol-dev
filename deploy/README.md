# VPS deployment

Run one Node 22 process under systemd and put Caddy in front of it. This application has one SQLite database and no external integrations. Docker would add image and volume management to the same two-process setup.

The scripts prepare a dedicated Linux VPS with systemd. They do not connect to a server automatically. No live deployment has been performed.

## Host prerequisites

Install Node 22 system-wide from [the official Node distributions](https://nodejs.org/en/download), then install pnpm 10.11.0 globally. Both must be available to the service user through `/usr/local/bin` or `/usr/bin`; a personal nvm installation is insufficient.

```bash
sudo npm install --global pnpm@10.11.0
sudo apt-get update
sudo apt-get install -y git caddy build-essential python3 curl openssl sqlite3
node --version
pnpm --version
sudo systemctl enable --now caddy
```

Caddy also provides [official installation instructions](https://caddyserver.com/docs/install). Point the site's DNS records at the VPS and allow incoming TCP ports 80 and 443. Node listens only on loopback; expose neither port 3000 nor the database directory. If another proxy sits ahead of Caddy, revise the trusted proxy configuration before using it.

Clone the repository as your SSH user. Use a checkout of `main` whose CI gate passed. For the private repository, use an existing SSH key with read access.

```bash
git clone git@github.com:Sobol17/sobol-dev.git
cd sobol-dev
sudo bash deploy/install.sh your-domain.example
sudo bash deploy/deploy.sh
```

Replace the hostname with the real public domain. The installer creates the service user, private data directories, two separate random secrets and `/etc/agency-site/app.env`. It preserves an existing environment file. It adds the site's fragment to `/etc/caddy/sites/agency-site.caddy` and imports that directory from the existing Caddyfile; other site blocks remain. Review the existing Caddy configuration for overlapping domain blocks before installing.

The environment uses plain `KEY=value` assignments compatible with Bash and systemd. Keep it owned by `root:agency-site` with mode `0640`. The scripts source this trusted file. Never commit it or publish server build directories: static private environment values are compiled into the server bundle.

## Create the owner account

Create the account interactively after the first release. Stop the app while the account script writes to the same database. Do not run the demonstration seed in production.

```bash
sudo systemctl stop agency-site
sudo runuser -u agency-site -- bash -c 'set -a; source /etc/agency-site/app.env; set +a; cd /srv/agency-site/current; pnpm db:create-admin'
sudo systemctl start agency-site
```

Enter the email, password and display name at the prompts; do not pass the password as a command argument. Sign in at `https://your-domain.example/login`.

## Update

```bash
git switch main
git pull --ff-only
sudo bash deploy/deploy.sh
```

The checkout must have no tracked changes. The script archives its exact commit into a new release, installs from the lockfile as the service user and builds on the VPS. Native dependencies therefore match the host. Build and dependency failures leave the current release running.

Build-time secrets and public address come from the service environment. The build uses a temporary SQLite path inside its own release. At startup the service overrides only `DATABASE_FILE` with `/var/lib/agency-site/app.db`, keeping migrations away from the live database during the build. Secrets remain static. Their rotation and public-domain changes require a rebuild; previous code releases retain their earlier configuration.

After a successful build, the script creates and verifies a snapshot of an existing live database, atomically switches `current`, restarts the service and waits for `/healthz`. Migrations run on application startup. If startup or the health check fails, the script switches back and attempts to start the old release. On a failed first deployment, it stops the failed service and removes the active link. The database is never restored automatically.

Successful deployment saves the old target in `previous` and starts the daily backup timer. Old release directories remain available for inspection. Remove unreferenced releases when reclaiming disk space; keep `current` and `previous` targets.

## Code rollback

```bash
sudo bash deploy/rollback.sh
```

This takes a snapshot, activates `previous`, checks its health and preserves the newer target for a return. It leaves the database unchanged. Before deploying a future destructive schema change, establish a data-compatible rollback plan; a code rollback does not reverse migrations.

## Backups and restore

The daily timer runs `VACUUM INTO` through a read-only connection to the live database. Snapshots include committed WAL data, pass integrity and foreign-key checks and have mode `0600`. Automatically named snapshots expire after fourteen days; other files remain untouched. Backups on the same VPS help with code and data mistakes but do not survive loss of that VPS. Copy verified snapshots to your chosen off-host storage when the server is ready.

```bash
sudo systemctl start agency-site-backup.service
sudo systemctl list-timers agency-site-backup.timer
sudo journalctl -u agency-site-backup.service --no-pager
```

To restore a selected verified snapshot, first take a snapshot of current data, then stop the service and timer. Replace `BACKUP.db` with the full path to the selected snapshot.

```bash
sudo systemctl start agency-site-backup.service
sudo systemctl stop agency-site agency-site-backup.timer
sudo mv /var/lib/agency-site/app.db /var/lib/agency-site/app.db.before-restore
sudo rm -f /var/lib/agency-site/app.db-wal /var/lib/agency-site/app.db-shm
sudo install -m 0600 -o agency-site -g agency-site BACKUP.db /var/lib/agency-site/app.db
sudo systemctl start agency-site
sudo systemctl start agency-site-backup.timer
```

Check health, login, the restored lead and its notes. Perform this rehearsal on the server before relying on the backup schedule. Never copy a live database file with `cp`: WAL sidecars carry committed data that the main file may not contain.

## Smoke checks and diagnostics

```bash
curl --fail https://your-domain.example/healthz
curl -I https://your-domain.example/
sudo systemctl status agency-site caddy
sudo journalctl -u agency-site -n 100 --no-pager
sudo journalctl -u caddy -n 100 --no-pager
```

Submit a real test brief, verify `/thanks`, sign in, find it in the workspace and change its status. Confirm HTTPS, security headers, the existing CSP, login/logout and a working custom 404 under the real domain. Application logs carry request IDs and no submission bodies. Caddy uses its official service; the supplied site block does not enable access logs that would record query-based search terms.

`ORIGIN` is the public HTTPS address. `ADDRESS_HEADER=x-forwarded-for` and `XFF_DEPTH=1` trust one proxy, with Node bound to `127.0.0.1`. Caddy preserves the SvelteKit-generated CSP. These settings follow the [adapter-node deployment contract](https://svelte.dev/docs/kit/adapter-node), [Caddy service guidance](https://caddyserver.com/docs/running) and [reverse proxy defaults](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy). Snapshot behavior follows [SQLite's VACUUM INTO contract](https://www.sqlite.org/lang_vacuum.html).

CI validates Bash syntax, ShellCheck, Caddyfile and systemd unit files, then runs real-database backup tests and release-switch tests with simulated host services. It also builds and starts the production application with different build/runtime database paths. Live certificate issuance, systemd startup and the domain smoke checks remain to be verified after a VPS is supplied.
