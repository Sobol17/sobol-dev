import { getContext, setContext } from 'svelte';

export type ToastTone = 'neutral' | 'success' | 'danger';

export interface Toast {
	id: number;
	tone: ToastTone;
	text: string;
}

const DEFAULT_TTL_MS = 5000;
const CONTEXT_KEY = Symbol('toast-store');

/**
 * Shared reactive state lives in a class, not in exported `$state`: an exported rune
 * variable loses reactivity across the module boundary.
 */
export class ToastStore {
	items = $state<Toast[]>([]);
	private nextId = 1;

	push(text: string, tone: ToastTone = 'neutral', ttlMs = DEFAULT_TTL_MS): number {
		const id = this.nextId++;
		this.items.push({ id, tone, text });
		if (ttlMs > 0) setTimeout(() => this.dismiss(id), ttlMs);
		return id;
	}

	success(text: string): number {
		return this.push(text, 'success');
	}

	error(text: string): number {
		return this.push(text, 'danger');
	}

	dismiss(id: number): void {
		this.items = this.items.filter((item) => item.id !== id);
	}

	clear(): void {
		this.items = [];
	}
}

export function setToastStore(store = new ToastStore()): ToastStore {
	return setContext(CONTEXT_KEY, store);
}

export function getToastStore(): ToastStore {
	const store = getContext<ToastStore | undefined>(CONTEXT_KEY);
	if (!store) throw new Error('ToastStore is missing: call setToastStore in a parent layout');
	return store;
}
