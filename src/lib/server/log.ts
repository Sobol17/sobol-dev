import pino, { type Logger } from 'pino';

/**
 * Structured logs, no PII. Lead bodies, contacts, session tokens and proposal tokens never
 * reach a log line: redaction here is the last defence, the call sites are the first.
 */
export function createLogger(level: pino.Level = 'info'): Logger {
	return pino({
		level,
		redact: {
			paths: ['*.password', '*.token', '*.goal', '*.contactEmail', '*.contactTelegram'],
			censor: '[redacted]'
		}
	});
}

export type { Logger };
