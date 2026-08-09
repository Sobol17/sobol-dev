import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		experimental: {
			remoteFunctions: true
		},
		// Origin check stays on its default (enabled). Do not weaken it.
		csp: {
			// `auto` lets SvelteKit nonce its own inline scripts, so no 'unsafe-inline' for scripts.
			mode: 'auto',
			directives: {
				'default-src': ['self'],
				'script-src': ['self'],
				// Svelte writes inline styles for transitions; fonts come from Google Fonts.
				'style-src': ['self', 'unsafe-inline', 'https://fonts.googleapis.com'],
				'font-src': ['self', 'https://fonts.gstatic.com'],
				'img-src': ['self', 'data:'],
				'connect-src': ['self'],
				'object-src': ['none'],
				'base-uri': ['self'],
				'form-action': ['self'],
				'frame-ancestors': ['none']
			}
		}
	},
	compilerOptions: {
		runes: true,
		experimental: {
			async: true
		}
	}
};

export default config;
