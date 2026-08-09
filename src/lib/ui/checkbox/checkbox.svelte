<script lang="ts">
	import { cn } from '../cn';

	interface Props {
		checked?: boolean;
		name: string;
		label: string;
		disabled?: boolean;
		class?: string;
	}

	let {
		checked = $bindable(false),
		name,
		label,
		disabled = false,
		class: className
	}: Props = $props();
</script>

<label class={cn('flex cursor-pointer items-center gap-3 text-[14px] text-ink', className)}>
	<input
		type="checkbox"
		{name}
		id={name}
		{disabled}
		bind:checked
		class="size-4 rounded accent-accent"
	/>
	{label}
</label>
