<script lang="ts">
	interface Props {
		class?: string;
	}

	let { class: className = 'size-6' }: Props = $props();
</script>

<svg viewBox="0 0 24 24" class={className} fill="currentColor" aria-hidden="true">
	<path
		d="M12 1.5c.55 5.4 4.6 9.45 10 10-5.4.55-9.45 4.6-10 10-.55-5.4-4.6-9.45-10-10 5.4-.55 9.45-4.6 10-10z"
	/>
</svg>
