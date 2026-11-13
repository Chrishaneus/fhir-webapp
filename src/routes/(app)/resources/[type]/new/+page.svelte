<script lang="ts">
	import { resolve } from '$app/paths';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import JsonEditor from '#lib/components/resources/JsonEditor.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { resourceType } from '#lib/fhir/resources.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const config = $derived(resourceType(data.type)!);
</script>

<svelte:head>
	<title>New {config.label} · FHIR Chart</title>
</svelte:head>

<div class="flex flex-col gap-2">
	<Button
		variant="ghost"
		size="sm"
		class="self-start"
		href={resolve('/(app)/resources/[type]', { type: data.type })}
		><ArrowLeft />{config.plural}</Button
	>
	<h1 class="text-2xl font-semibold tracking-tight">New {config.label.toLowerCase()}</h1>
	<p class="text-muted-foreground">
		Fill in its FHIR JSON. Validate checks it with the server; the server gives it an id when it's
		saved.
	</p>
</div>

{#key data.type}
	<JsonEditor json={data.json} result={form} saveLabel="Create" />
{/key}
