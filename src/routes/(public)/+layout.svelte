<script lang="ts">
	import type { Snippet } from 'svelte';
	import PublicShell from '$lib/components/public-shell.svelte';
	let { children }: { children: Snippet } = $props();
</script>

<PublicShell>{@render children()}</PublicShell>
