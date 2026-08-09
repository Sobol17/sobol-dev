<script lang="ts">
	import '../app.css';
	import { Toast } from '$lib/ui';
	import { setToastStore } from '$lib/state/toast.svelte';

	let { children } = $props();

	setToastStore();
</script>

{@render children()}

<Toast />
