<script lang="ts">
	import SeoHead from '$lib/components/seo-head.svelte';
	import Logo from '$lib/components/logo.svelte';
	import { Button, Card, Field, Input } from '$lib/ui';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<SeoHead title="Вход — SobolDev" description="Административная панель SobolDev." noindex />

<main class="grid min-h-screen place-items-center px-5 py-16">
	<div class="w-full max-w-[420px]">
		<div class="mb-8 flex items-center justify-center gap-2.5">
			<Logo class="size-6 text-ink" />
			<span class="font-display text-[17px] tracking-[-.02em]" style="font-weight:700">
				SobolDev
			</span>
		</div>

		<Card padding="lg">
			<h1 class="mb-6 font-display text-[22px] tracking-[-.02em]" style="font-weight:600">Вход</h1>

			<form method="POST" class="grid gap-5">
				<Field label="Почта" for="email" required>
					<Input name="email" type="email" autocomplete="username" invalid={Boolean(form?.error)} />
				</Field>

				<Field label="Пароль" for="password" error={form?.error} required>
					<Input
						name="password"
						type="password"
						autocomplete="current-password"
						invalid={Boolean(form?.error)}
					/>
				</Field>

				<Button type="submit" size="lg" class="mt-2 w-full">Войти</Button>
			</form>
		</Card>
	</div>
</main>
