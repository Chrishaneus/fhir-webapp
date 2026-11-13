<script lang="ts">
	import Pager from '#lib/components/resources/Pager.svelte';
	import ResourceTable from '#lib/components/resources/ResourceTable.svelte';
	import * as Card from '#lib/components/ui/card/index.js';
	import { resourceType } from '#lib/fhir/resources.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const config = $derived(resourceType(data.type)!);
</script>

<svelte:head>
	<title>{config.plural} · FHIR Chart</title>
</svelte:head>

<div class="flex items-center gap-3">
	<config.icon class="size-6 text-muted-foreground" />
	<h1 class="text-2xl font-semibold tracking-tight">{config.plural}</h1>
</div>

<Card.Root>
	<Card.Content class="flex flex-col gap-4">
		<ResourceTable columns={config.columns} rows={data.rows} names={data.names} />
		<Pager page={data.page} pageSize={data.pageSize} total={data.total} />
	</Card.Content>
</Card.Root>
