// Placeholder secrets so `$lib/server/config` can be imported in tests that need it.
// Tests that touch the database build their own handle through `tests/helpers/db.ts`.
process.env.DATABASE_FILE ??= './var/test/app.db';
process.env.SESSION_SECRET ??= 'test-session-secret-not-used-in-production-000';
process.env.IP_HASH_SALT ??= 'test-ip-hash-salt-not-used-in-production-0000';
process.env.UPLOADS_DIR ??= './var/test/uploads';
process.env.USE_FAKE_CLIENTS ??= 'true';
