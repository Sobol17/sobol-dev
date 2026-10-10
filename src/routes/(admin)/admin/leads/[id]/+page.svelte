<script lang="ts">
	import { Button, EmptyState, Skeleton } from '$lib/ui';
	import { getLead } from '../leads.remote';
	import LeadDetails from '../_components/lead-details.svelte';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
	const detail = $derived(getLead(data.id));
</script>

{#snippet card(result: Awaited<ReturnType<typeof getLead>>)}
	{#key result.lead.id}<LeadDetails detail={result} />{/key}
{/snippet}

{#if detail.error}
	<EmptyState
		title="Не удалось загрузить заявку"
		description="Обновите страницу или войдите снова."
	>
		{#snippet action()}<Button href="/login" variant="secondary">Войти в CRM</Button>{/snippet}
	</EmptyState>
{:else if detail.ready}
	{@render card(detail.current)}
{:else}
	{#await detail}
		<Skeleton variant="block" />
	{:then result}
		{@render card(result)}
	{/await}
{/if}
