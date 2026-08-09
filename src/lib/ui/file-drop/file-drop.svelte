<script lang="ts">
	import { cn } from '../cn';

	interface Props {
		accept: string;
		maxSizeMb: number;
		multiple?: boolean;
		onfiles: (files: File[]) => void;
		class?: string;
	}

	let { accept, maxSizeMb, multiple = false, onfiles, class: className }: Props = $props();

	let dragging = $state(false);
	let rejected = $state<string[]>([]);
	let input: HTMLInputElement | null = $state(null);

	const maxBytes = $derived(maxSizeMb * 1024 * 1024);

	/** Client-side size check is a courtesy. The server re-checks size, mime and magic bytes. */
	function accepted(files: FileList | null): void {
		if (!files) return;
		const list = [...files];
		const tooBig = list.filter((file) => file.size > maxBytes);
		rejected = tooBig.map((file) => file.name);
		const ok = list.filter((file) => file.size <= maxBytes);
		if (ok.length > 0) onfiles(ok);
	}

	function onDrop(event: DragEvent): void {
		event.preventDefault();
		dragging = false;
		accepted(event.dataTransfer?.files ?? null);
	}
</script>

<div class={cn('grid gap-2', className)}>
	<div
		role="button"
		tabindex="0"
		aria-label="Загрузить файлы"
		class={cn(
			'grid cursor-pointer place-items-center gap-2 rounded-card border-2 border-dashed p-10 text-center transition',
			dragging ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:border-ink/30'
		)}
		ondragover={(event) => {
			event.preventDefault();
			dragging = true;
		}}
		ondragleave={() => (dragging = false)}
		ondrop={onDrop}
		onclick={() => input?.click()}
		onkeydown={(event) => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				input?.click();
			}
		}}
	>
		<span class="text-[15px] font-medium text-ink">Перетащите файлы или нажмите</span>
		<span class="font-mono text-[12px] text-muted">{accept} · до {maxSizeMb} МБ</span>
	</div>

	<input
		bind:this={input}
		type="file"
		{accept}
		{multiple}
		class="sr-only"
		onchange={(event) => accepted(event.currentTarget.files)}
	/>

	{#if rejected.length > 0}
		<p class="text-[13px] text-danger" role="alert">
			Слишком большие файлы: {rejected.join(', ')}
		</p>
	{/if}
</div>
