<script lang="ts">
	import { page } from '$app/state';

	interface Props {
		title: string;
		description: string;
		/** Absolute or root-relative image for social cards. */
		image?: string;
		noindex?: boolean;
	}

	let { title, description, image, noindex = false }: Props = $props();

	const url = $derived(page.url.href);
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
	{#if image}<meta property="og:image" content={image} />{/if}

	<meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
</svelte:head>
