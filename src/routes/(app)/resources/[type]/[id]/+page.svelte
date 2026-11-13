<script lang="ts">
	import { resolve } from '$app/paths';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import CellValue from '#lib/components/resources/CellValue.svelte';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Tabs from '#lib/components/ui/tabs/index.js';
	import { formatDate, timeAgo } from '#lib/fhir/format.js';
	import { resourceType } from '#lib/fhir/resources.js';
	import { displayTitle } from '#lib/fhir/title.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const config = $derived(resourceType(data.type)!);
	const resource = $derived(data.resource);
	const title = $derived(displayTitle(config, resource));
	const json = $derived(JSON.stringify(resource, null, 2));
</script>

<svelte:head>
	<title>{title} · {config.label} · FHIR Chart</title>
</svelte:head>

<div class="flex flex-col gap-2">
	<Button
		variant="ghost"
		size="sm"
		class="self-start"
		href={resolve('/(app)/resources/[type]', { type: config.type })}
		><ArrowLeft />{config.plural}</Button
	>
	<div class="flex flex-wrap items-center gap-3">
		<config.icon class="size-6 text-muted-foreground" />
		<h1 class="text-2xl font-semibold tracking-tight">{title}</h1>
		<Badge variant="secondary">{config.label}</Badge>
	</div>
	<p class="font-mono text-xs text-muted-foreground">{resource.resourceType}/{resource.id}</p>
</div>

<Tabs.Root value="summary">
	<Tabs.List>
		<Tabs.Trigger value="summary">Summary</Tabs.Trigger>
		<Tabs.Trigger value="json">FHIR JSON</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="summary">
		<Card.Root>
			<Card.Content>
				<dl class="grid gap-x-6 gap-y-4 sm:grid-cols-[12rem_1fr]" data-testid="summary">
					{#each config.columns as column (column.label)}
						<dt class="text-sm text-muted-foreground">{column.label}</dt>
						<dd><CellValue cell={column.value(resource)} names={data.names} /></dd>
					{/each}
					<dt class="text-sm text-muted-foreground">Version</dt>
					<dd>{resource.meta?.versionId ?? '—'}</dd>
					<dt class="text-sm text-muted-foreground">Last updated</dt>
					<dd>
						{#if resource.meta?.lastUpdated}
							{formatDate(resource.meta.lastUpdated)}
							<span class="text-muted-foreground">({timeAgo(resource.meta.lastUpdated)})</span>
						{:else}—{/if}
					</dd>
					{#if resource.meta?.security?.length}
						<dt class="text-sm text-muted-foreground">Security labels</dt>
						<dd class="flex flex-wrap gap-1">
							{#each resource.meta.security as label, i (i)}
								<Badge variant="outline">{label.display ?? label.code}</Badge>
							{/each}
						</dd>
					{/if}
				</dl>
			</Card.Content>
		</Card.Root>
	</Tabs.Content>
	<Tabs.Content value="json">
		<Card.Root>
			<Card.Content>
				<pre
					class="max-h-[32rem] overflow-auto rounded-md bg-muted p-4 font-mono text-xs leading-5"
					data-testid="resource-json">{json}</pre>
			</Card.Content>
		</Card.Root>
	</Tabs.Content>
</Tabs.Root>
