import { browser } from '$app/environment';

const STORAGE_KEY = 'sd-theme';

export type Theme = 'light' | 'dark';

/**
 * Mirrors the class that `static/theme-init.js` already applied before paint.
 * The DOM is the source of truth, so hydration never fights the pre-paint script.
 */
export class ThemeStore {
	current = $state<Theme>('light');

	constructor() {
		if (browser) {
			this.current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
		}
	}

	toggle(): void {
		this.set(this.current === 'dark' ? 'light' : 'dark');
	}

	set(theme: Theme): void {
		this.current = theme;
		if (!browser) return;
		document.documentElement.classList.toggle('dark', theme === 'dark');
		try {
			localStorage.setItem(STORAGE_KEY, theme);
		} catch {
			// Storage denied. The choice lasts for this page only, which is acceptable.
		}
	}
}
