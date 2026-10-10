# agency-site

A digital agency landing page with an embedded brief, confirmation page, custom 404 and authenticated lead workspace. SvelteKit, TypeScript, Drizzle and SQLite. Submissions persist synchronously; the application has no notification integration or background worker.

Read [`tech.md`](tech.md) for contracts and [`CLAUDE.md`](CLAUDE.md) for development rules. [`AGENTS.md`](AGENTS.md) points to the same rules.

## Local development

```bash
pnpm install --frozen-lockfile
cp .env.example .env
# Set SESSION_SECRET and IP_HASH_SALT to separate values from openssl rand -hex 32.
pnpm db:seed
pnpm dev
```

The seed creates demonstration leads and an account. Use `pnpm db:create-admin` to create or update the owner's account. Production deployment never runs the demonstration seed.

## Checks

```bash
pnpm lint
pnpm check
pnpm exec vitest run
pnpm test:e2e
pnpm check:demo
pnpm test:demo
```

Generate migrations with `pnpm db:generate`; never edit an applied migration. Create a verified SQLite snapshot with `pnpm db:backup <directory>`.

## Deployment

Use [the VPS runbook](deploy/README.md): Node 22 under systemd, Caddy for HTTPS, one persistent SQLite database outside the release directories. Docker is not required. After the initial host setup, each deployment builds the checked-out commit, backs up the live database, switches the release and checks `/healthz`. A failed health check restores the previous code release.

Secrets use `$env/static/private` and must be present during the server-side build. `DATABASE_FILE` can be overridden at startup, allowing the build to use an isolated database while the service uses its persistent file. Rotate secrets or change the public site address by rebuilding; previous releases retain their build-time configuration.

Historical `jobs` and `outbox_messages` tables remain for data compatibility. Application routes do not read or write them, and old jobs never resume. Client Telegram contacts and Telegram Mini App services remain ordinary website data.
