<script lang="ts">
	import type { Cell } from '#lib/fhir/resources.js';

	/** A table cell or summary value: text, or another resource by its name when known. */
	let { cell, names = {} }: { cell: Cell; names?: Record<string, string> } = $props();
</script>

{#if typeof cell === 'string'}
	{cell || '—'}
{:else}
	{names[cell.reference.reference ?? ''] ??
		cell.reference.display ??
		cell.reference.reference ??
		'—'}
{/if}
