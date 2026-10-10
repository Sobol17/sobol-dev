<script lang="ts">
	import { onMount } from 'svelte';
	import { SITE } from '$lib/site';
	import SeoHead from '$lib/components/seo-head.svelte';
	import { LABELS } from './landing-content';
	import Hero from './_components/hero.svelte';
	import Cases from './_components/cases.svelte';
	import Benefits from './_components/benefits.svelte';
	import Services from './_components/services.svelte';
	import Partnership from './_components/partnership.svelte';
	import Process from './_components/process.svelte';
	import Faq from './_components/faq.svelte';
	import Brief from './_components/brief.svelte';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
	onMount(() => {
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		let cleanup: (() => void) | undefined;
		let active = true;
		import('./_components/motion')
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
	image="/og-home.png"
	jsonLd={{
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: SITE.name,
		email: SITE.email,
		sameAs: [SITE.telegram.href],
		description: LABELS.metaDescription
	}}
/>
<Hero /><Cases /><Benefits /><Services /><Partnership /><Process /><Faq /><Brief
	initialType={data.initialType}
/>
