import { NotifierError, type NotifyMessage, type Notifier } from './notifier';

/**
 * Development and test double. Keeps every call in memory and fails on demand, so the
 * error path of a slice is testable without a bot token.
 */
export class FakeNotifier implements Notifier {
	readonly sent: NotifyMessage[] = [];
	failNext = 0;
	failAlways = false;

	async send(message: NotifyMessage): Promise<void> {
		if (!message.recipient) throw new NotifierError('recipient is required');
		if (!message.text.trim()) throw new NotifierError('text is required');

		if (this.failAlways || this.failNext > 0) {
			if (this.failNext > 0) this.failNext -= 1;
			throw new NotifierError('fake notifier failure', 500);
		}

		this.sent.push(message);
	}

	reset(): void {
		this.sent.length = 0;
		this.failNext = 0;
		this.failAlways = false;
	}
}
