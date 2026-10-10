<script lang="ts">
	import { SITE } from '$lib/site';
	import SeoHead from '$lib/components/seo-head.svelte';
	import Logo from '$lib/components/logo.svelte';
	import { Button, Card, Field, Input } from '$lib/ui';
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();
</script>

<SeoHead
	title={`Вход в CRM · ${SITE.name}`}
	description={`Работа с заявками ${SITE.name}.`}
	noindex
/>

<div class="workspace">
	<header class="border-b border-line bg-surface">
		<div class="wrap flex items-center justify-between gap-4 py-6">
			<a href="/" class="brand"><Logo class="brand-mark" />{SITE.name}</a><Button
				href="/"
				variant="ghost"
				size="sm"
				class="min-h-11">На сайт</Button
			>
		</div>
	</header>
	<main class="auth-stage wrap">
		<div class="auth-layout">
			<Card
				class="flex flex-col justify-between gap-10 border-night bg-night p-8 text-white sm:p-10"
			>
				<svg
					class="hidden size-12 text-white sm:block"
					viewBox="0 0 48 48"
					fill="none"
					aria-hidden="true"
					><rect
						x="10"
						y="20"
						width="28"
						height="23"
						rx="4"
						stroke="currentColor"
						stroke-width="1.5"
					/><path
						d="M16 20v-7a8 8 0 0 1 16 0v7M24 29v6"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
					/></svg
				>
				<div>
					<h1 class="auth-title">Вход в CRM</h1>
					<p class="mt-6 max-w-[46ch] text-base leading-relaxed text-white/75">
						Рабочее пространство команды {SITE.name}. Войдите, чтобы просматривать заявки с сайта.
					</p>
				</div>
			</Card>
			<Card class="border-0 p-8 sm:p-10">
				<h2 class="mb-8 text-2xl font-semibold tracking-[-.02em]">Ваш аккаунт</h2>
				<form method="POST" class="grid gap-6">
					<Field label="Почта" for="email" required
						><Input
							name="email"
							type="email"
							autocomplete="username"
							required
							invalid={Boolean(form?.error)}
						/></Field
					>
					<Field label="Пароль" for="password" error={form?.error} required
						><Input
							name="password"
							type="password"
							autocomplete="current-password"
							required
							invalid={Boolean(form?.error)}
						/></Field
					>
					<Button type="submit" size="lg" class="mt-2 w-full">Войти</Button>
				</form>
			</Card>
		</div>
	</main>
</div>
