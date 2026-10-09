<script lang="ts">
	import { base } from '$app/paths';
	import { SITE } from '$lib/site';
	import { Button, Card } from '$lib/ui';
	import PublicShell from '$lib/components/public-shell.svelte';
	import SeoHead from '$lib/components/seo-head.svelte';
</script>

<SeoHead
	title={`Демонстрация формы · ${SITE.name}`}
	description="Демонстрация формы без отправки и сохранения данных"
	noindex
/>
<PublicShell>
	<section class="page-stage wrap">
		<div class="page-split">
			<div>
				<h1 class="page-title">
					Так завершается <span class="text-accent">заполнение брифа</span>
				</h1>
				<p class="page-intro">
					Это демонстрация интерфейса. Заявка не отправлена, введённые данные не сохранены.
				</p>
				<div class="mt-8 flex flex-wrap gap-4">
					<Button href={`${base}/`}>На главную</Button><Button
						href={`${base}/admin/`}
						variant="secondary">Посмотреть CRM</Button
					>
				</div>
			</div>
			<Card class="border-night bg-night p-8 text-white"
				><h2 class="text-3xl leading-tight tracking-[-.03em]">Что происходит в полной версии</h2>
				<p class="mt-6 max-w-[46ch] leading-relaxed text-white/75">
					После отправки заявка получает номер и появляется в CRM. В этом демо показаны только
					заранее подготовленные вымышленные обращения.
				</p></Card
			>
		</div>
	</section>
</PublicShell>
