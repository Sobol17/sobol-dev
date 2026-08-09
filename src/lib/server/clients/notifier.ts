export interface NotifyMessage {
	/** Telegram chat id of the owner. Never a client contact: this channel is internal. */
	recipient: string;
	text: string;
}

export interface Notifier {
	send(message: NotifyMessage): Promise<void>;
}

/** Raised when the channel is temporarily unavailable. The runner retries on it. */
export class NotifierError extends Error {
	constructor(
		message: string,
		readonly status?: number
	) {
		super(message);
		this.name = 'NotifierError';
	}
}
