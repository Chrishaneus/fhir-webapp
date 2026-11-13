<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Button } from '#lib/components/ui/button/index.js';

	/** What each status means for the person seeing it. */
	const titles: Record<number, string> = {
		403: 'Not for your role',
		404: 'Page not found',
		500: 'Something went wrong',
		503: 'The FHIR server isn’t available'
	};
	const title = $derived(titles[page.status] ?? 'Something went wrong');
</script>

<svelte:head>
	<title>{title} · FHIR Chart</title>
</svelte:head>

<div
	class="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center gap-4 px-4 text-center"
>
	<p class="text-sm font-medium text-muted-foreground">Error {page.status}</p>
	<h1 class="text-2xl font-semibold tracking-tight">{title}</h1>
	{#if page.error?.message}
		<p class="text-muted-foreground" data-testid="error-message">{page.error.message}</p>
	{/if}
	<div class="flex gap-2">
		{#if page.data.user}
			<Button href={resolve('/(app)/dashboard')}>Back to the dashboard</Button>
		{:else}
			<Button href={resolve('/(public)')}>Back to the start</Button>
		{/if}
	</div>
</div>
