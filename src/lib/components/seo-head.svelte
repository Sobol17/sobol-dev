<script lang="ts">
	import { page } from '$app/state';
	import { jsonLdScript } from '$lib/utils/seo';

	interface Props {
		title: string;
		description: string;
		/** Absolute or root-relative image for social cards. */
		image?: string;
		noindex?: boolean;
		/** Structured data for the page. Serialized here, never assembled in markup. */
		jsonLd?: Record<string, unknown>;
	}

	let { title, description, image, noindex = false, jsonLd }: Props = $props();

	const url = $derived(page.url.href);
	const absoluteImage = $derived(image ? new URL(image, page.url).href : undefined);

	const structuredData = $derived(jsonLd ? jsonLdScript(jsonLd) : undefined);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	{#if noindex}
		<meta name="robots" content="noindex, nofollow" />
	{/if}

	<meta property="og:type" content="website" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	{#if absoluteImage}<meta property="og:image" content={absoluteImage} />{/if}

	<meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />

	<!-- Serialized by `jsonLdScript`, which escapes every `<` in the payload. -->
	{#if structuredData}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html structuredData}
	{/if}
</svelte:head>
