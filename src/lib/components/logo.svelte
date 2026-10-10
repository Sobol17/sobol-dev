<script lang="ts">
	let { class: className = 'size-8' }: { class?: string } = $props();
</script>

<svg viewBox="0 0 32 32" class={className} aria-hidden="true"
	><path fill="var(--color-accent)" d="M3 3h10v10H3zM19 3h10v10H19zM3 19h10v10H3z" /><circle
		cx="24"
		cy="24"
		r="6"
		fill="var(--color-ink)"
	/></svg
>
