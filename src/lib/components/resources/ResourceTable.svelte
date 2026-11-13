<script lang="ts">
	import type { Snippet } from 'svelte';
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
				{#each columns as column (column.label)}
					<Table.Cell><CellValue cell={column.value(row)} {names} /></Table.Cell>
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
