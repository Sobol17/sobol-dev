<script lang="ts">
	import Workspace from './_components/workspace.svelte';
	import type { LayoutData } from './$types';
	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();
</script>

<Workspace user={data.user}>{@render children()}</Workspace>
