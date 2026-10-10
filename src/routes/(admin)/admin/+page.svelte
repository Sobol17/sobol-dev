<script lang="ts">
	import LeadOverview from '../_components/lead-overview.svelte';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<LeadOverview {data} />
