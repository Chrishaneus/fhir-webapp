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
	<title>Edit {config.label} · FHIR Chart</title>
</svelte:head>

<div class="flex flex-col gap-2">
	<Button
		variant="ghost"
		size="sm"
		class="self-start"
		href={resolve('/(app)/resources/[type]/[id]', { type: data.type, id: data.id })}
		><ArrowLeft />Back</Button
	>
	<h1 class="text-2xl font-semibold tracking-tight">Edit {config.label.toLowerCase()}</h1>
	<p class="text-muted-foreground">
		Version {data.version ?? '?'} of {data.type}/{data.id}. Saving makes a new version; the old one
		stays in the history.
	</p>
</div>

<!-- A fresh editor for each resource, so its text never carries over. -->
{#key `${data.type}/${data.id}`}
	<JsonEditor json={data.json} version={data.version} result={form} />
{/key}
