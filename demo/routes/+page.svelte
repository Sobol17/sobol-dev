<script lang="ts">
	import { onMount } from 'svelte';
	import { SITE } from '$lib/site';
	import SeoHead from '$lib/components/seo-head.svelte';
	import { LABELS } from '../../src/routes/(public)/landing-content';
	import Hero from '../../src/routes/(public)/_components/hero.svelte';
	import Cases from '../../src/routes/(public)/_components/cases.svelte';
	import Benefits from '../../src/routes/(public)/_components/benefits.svelte';
	import Services from '../../src/routes/(public)/_components/services.svelte';
	import Partnership from '../../src/routes/(public)/_components/partnership.svelte';
	import Process from '../../src/routes/(public)/_components/process.svelte';
	import Faq from '../../src/routes/(public)/_components/faq.svelte';
	import Brief from '../components/brief.svelte';
	import PublicShell from '$lib/components/public-shell.svelte';

	onMount(() => {
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		let cleanup: (() => void) | undefined;
		let active = true;
		import('../../src/routes/(public)/_components/motion')
			.then(({ mountMotion }) => {
				if (active) cleanup = mountMotion();
			})
			.catch(() => {
				/* Content stays visible if the optional motion chunk cannot load. */
			});
		return () => {
			active = false;
			cleanup?.();
		};
	});
</script>

<SeoHead
	title={`${SITE.name} · ${LABELS.metaTitle}`}
	description={LABELS.metaDescription}
	noindex
	jsonLd={{
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: SITE.name,
		email: SITE.email,
		sameAs: [SITE.telegram.href],
		description: LABELS.metaDescription
	}}
/>
<PublicShell
	><Hero /><Cases /><Benefits /><Services /><Partnership /><Process /><Faq /><Brief /></PublicShell
>
