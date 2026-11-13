<script lang="ts">
	import { resolve } from '$app/paths';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { page } from '$app/state';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { enhance } from '$app/forms';
	import { can } from '#lib/auth/roles.js';
	import * as AlertDialog from '#lib/components/ui/alert-dialog/index.js';
	import CellValue from '#lib/components/resources/CellValue.svelte';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Tabs from '#lib/components/ui/tabs/index.js';
	import * as Table from '#lib/components/ui/table/index.js';
	import { formatDate, timeAgo } from '#lib/fhir/format.js';
	import { versionsOf } from '#lib/fhir/history.js';
	import { resourceType } from '#lib/fhir/resources.js';
	import { displayTitle } from '#lib/fhir/title.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let deleting = $state(false);
	const config = $derived(resourceType(data.type)!);
	const resource = $derived(data.resource);
	const title = $derived(displayTitle(config, resource));
	const json = $derived(JSON.stringify(resource, null, 2));

	const versions = $derived(data.history ? versionsOf(data.history) : []);
	let picked = $state<string | null>(null);
	/** The version shown under the history: the one picked, else the latest. */
	const shown = $derived(versions.find((v) => v.versionId === picked) ?? versions[0]);
	const changeLabels = { created: 'Created', updated: 'Updated', deleted: 'Deleted' } as const;
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
		<div class="ml-auto flex items-center gap-2">
			{#if can(data.user, 'update')}
				<Button
					variant="outline"
					href={resolve('/(app)/resources/[type]/[id]/edit', {
						type: config.type,
						id: resource.id ?? ''
					})}><Pencil />Edit</Button
				>
			{/if}
			{#if can(data.user, 'delete')}
				<AlertDialog.Root>
					<AlertDialog.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props}><Trash2 />Delete</Button>
						{/snippet}
					</AlertDialog.Trigger>
					<AlertDialog.Content>
						<AlertDialog.Header>
							<AlertDialog.Title>Delete {title}?</AlertDialog.Title>
							<AlertDialog.Description>
								It disappears from searches. Its earlier versions stay in its history.
							</AlertDialog.Description>
						</AlertDialog.Header>
						<AlertDialog.Footer>
							<AlertDialog.Cancel>Keep it</AlertDialog.Cancel>
							<form
								method="POST"
								action="?/delete"
								use:enhance={() => {
									deleting = true;
									return async ({ update }) => {
										await update();
										deleting = false;
									};
								}}
							>
								<Button type="submit" variant="destructive" disabled={deleting}
									>{deleting ? 'Deleting…' : 'Delete'}</Button
								>
							</form>
						</AlertDialog.Footer>
					</AlertDialog.Content>
				</AlertDialog.Root>
			{/if}
		</div>
	</div>
	{#if page.url.searchParams.has('saved')}
		<Alert.Root data-testid="saved">
			<Alert.Title>Saved as version {resource.meta?.versionId}</Alert.Title>
		</Alert.Root>
	{/if}
	{#if form?.deleteError}
		<p role="alert" class="text-sm text-destructive">Deleting failed: {form.deleteError}</p>
	{/if}
	<p class="font-mono text-xs text-muted-foreground">{resource.resourceType}/{resource.id}</p>
</div>

<Tabs.Root value="summary">
	<Tabs.List>
		<Tabs.Trigger value="summary">Summary</Tabs.Trigger>
		{#if data.records}
			<Tabs.Trigger value="records">Records</Tabs.Trigger>
		{/if}
		<Tabs.Trigger value="json">FHIR JSON</Tabs.Trigger>
		<Tabs.Trigger value="history">History ({versions.length})</Tabs.Trigger>
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
	{#if data.records}
		<Tabs.Content value="records">
			<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="records">
				{#each data.records as record (record.type)}
					{@const recordType = resourceType(record.type)!}
					<a
						href={resolve(
							`/(app)/resources/[type]?patient=${encodeURIComponent(resource.id ?? '')}`,
							{
								type: record.type
							}
						)}
						class="rounded-lg border p-4 transition-colors hover:bg-muted/50"
						data-testid="record-count"
						data-type={record.type}
					>
						<div class="flex items-center justify-between text-sm text-muted-foreground">
							{recordType.plural}<recordType.icon class="size-4" />
						</div>
						<p class="mt-2 text-2xl font-semibold tabular-nums">{record.total ?? '—'}</p>
					</a>
				{/each}
			</div>
		</Tabs.Content>
	{/if}
	<Tabs.Content value="json">
		<Card.Root>
			<Card.Content>
				<pre
					class="max-h-[32rem] overflow-auto rounded-md bg-muted p-4 font-mono text-xs leading-5"
					data-testid="resource-json">{json}</pre>
			</Card.Content>
		</Card.Root>
	</Tabs.Content>
	<Tabs.Content value="history">
		<Card.Root>
			<Card.Content class="flex flex-col gap-4">
				{#if !data.history}
					<p class="text-sm text-muted-foreground">The history couldn’t be loaded.</p>
				{:else}
					<Table.Root data-testid="history">
						<Table.Header>
							<Table.Row>
								<Table.Head>Version</Table.Head>
								<Table.Head>Change</Table.Head>
								<Table.Head>When</Table.Head>
								<Table.Head>Fields changed</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each versions as version (version.versionId)}
								<Table.Row
									data-testid="version"
									data-state={shown?.versionId === version.versionId ? 'selected' : undefined}
								>
									<Table.Cell>
										<button
											type="button"
											class="font-medium underline-offset-4 hover:underline"
											aria-pressed={shown?.versionId === version.versionId}
											onclick={() => (picked = version.versionId)}>{version.versionId}</button
										>
									</Table.Cell>
									<Table.Cell>{changeLabels[version.change]}</Table.Cell>
									<Table.Cell class="text-muted-foreground">
										{formatDate(version.lastUpdated) || '—'}
									</Table.Cell>
									<Table.Cell class="text-sm">
										{version.changed.length ? version.changed.join(', ') : '—'}
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
					{#if shown?.resource}
						<div class="flex flex-col gap-2">
							<p class="text-sm font-medium">Version {shown.versionId}</p>
							<pre
								class="max-h-[24rem] overflow-auto rounded-md bg-muted p-4 font-mono text-xs leading-5"
								data-testid="version-json">{JSON.stringify(shown.resource, null, 2)}</pre>
						</div>
					{/if}
				{/if}
			</Card.Content>
		</Card.Root>
	</Tabs.Content>
</Tabs.Root>
