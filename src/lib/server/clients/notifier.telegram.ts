import { NotifierError, type NotifyMessage, type Notifier } from './notifier';

/** Telegram Bot API over plain fetch. No SDK: one endpoint, one payload shape. */
export class TelegramNotifier implements Notifier {
	constructor(
		private readonly botToken: string,
		private readonly fetchImpl: typeof fetch = fetch
	) {}

	async send(message: NotifyMessage): Promise<void> {
		const response = await this.fetchImpl(
			`https://api.telegram.org/bot${this.botToken}/sendMessage`,
			{
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					chat_id: message.recipient,
					text: message.text,
					parse_mode: 'HTML',
					disable_web_page_preview: true
				})
			}
		);

		if (!response.ok) {
			// Body may carry the Telegram description, but it can also echo the message back.
			throw new NotifierError(`telegram sendMessage failed`, response.status);
		}
	}
}
