import adapter from '@sveltejs/adapter-node';
import staticAdapter from '@sveltejs/adapter-static';

const demo = process.env.BUILD_DEMO === 'true';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: demo
			? staticAdapter({ pages: 'build-demo', assets: 'build-demo', fallback: '404.html' })
			: adapter(),
		...(demo
			? {
					outDir: '.svelte-kit-demo',
					paths: { base: '/sobol-dev', relative: false },
					files: {
						routes: 'demo/routes',
						appTemplate: 'demo/app.html',
						hooks: {
							server: 'demo/hooks.server',
							client: 'demo/hooks.client',
							universal: 'demo/hooks'
						}
					}
				}
			: {}),
		experimental: {
			remoteFunctions: true
		},
		// Origin check stays on its default (enabled). Do not weaken it.
		csp: {
			// Hashes instead of nonces: still no 'unsafe-inline' for scripts, and the browser
			// keeps honouring 'self' for modulepreload hints, which a nonce policy blocks.
			mode: 'hash',
			directives: {
				'default-src': ['self'],
				'script-src': ['self'],
				// Svelte writes inline styles for transitions; fonts are served locally.
				'style-src': ['self', 'unsafe-inline'],
				'font-src': ['self'],
				'img-src': ['self', 'data:'],
				'connect-src': ['self'],
				'object-src': ['none'],
				'base-uri': ['self'],
				'form-action': demo ? ['none'] : ['self'],
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
