declare global {
	namespace App {
		interface Locals {
			requestId: string;
			user: { id: string; email: string; displayName: string } | null;
		}

		interface PageData {
			user?: { id: string; displayName: string } | null;
		}

		interface Error {
			message: string;
			requestId?: string;
		}
	}
}

export {};
