<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import * as Table from '#lib/components/ui/table/index.js';
	import type { Column } from '#lib/fhir/resources.js';
	import type { Resource } from '#lib/fhir/types.js';
	import CellValue from './CellValue.svelte';

	/** Resources as rows, one column per configured field. */
	let {
		columns,
		rows,
		names = {},
		header,
		empty = 'Nothing found.'
	}: {
		columns: Column[];
		rows: Resource[];
		names?: Record<string, string>;
		/** Renders a column's heading, e.g. as a sort link; its label by default. */
		header?: Snippet<[Column]>;
		empty?: string;
	} = $props();
</script>

<Table.Root data-testid="resource-table">
	<Table.Header>
		<Table.Row>
			{#each columns as column (column.label)}
				<Table.Head>
					{#if header}{@render header(column)}{:else}{column.label}{/if}
				</Table.Head>
			{/each}
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each rows as row (row.id)}
			<Table.Row data-testid="resource-row" data-id={row.id}>
				{@const cells = columns.map((column) => column.value(row))}
				<!-- The first text column (a name, a code) opens the row's resource. -->
				{@const linkAt = cells.findIndex((cell) => typeof cell === 'string')}
				{#each columns as column, i (column.label)}
					{@const cell = cells[i]}
					<Table.Cell>
						{#if i === linkAt && typeof cell === 'string'}
							<a
								class="font-medium underline-offset-4 hover:underline"
								href={resolve('/(app)/resources/[type]/[id]', {
									type: row.resourceType,
									id: row.id ?? ''
								})}>{cell || row.id}</a
							>
						{:else}
							<CellValue {cell} {names} />
						{/if}
					</Table.Cell>
				{/each}
			</Table.Row>
		{:else}
			<Table.Row>
				<Table.Cell colspan={columns.length} class="py-8 text-center text-muted-foreground"
					>{empty}</Table.Cell
				>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
