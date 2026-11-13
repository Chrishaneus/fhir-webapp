<script lang="ts">
	import { resolve } from '$app/paths';
	import { parseReference } from '#lib/fhir/format.js';
	import { resourceType, type Cell } from '#lib/fhir/resources.js';

	/**
	 * A table cell or summary value: text, or another resource by its name when known, linked to
	 * its page when the app shows that type.
	 */
	let { cell, names = {} }: { cell: Cell; names?: Record<string, string> } = $props();

	const target = $derived(
		typeof cell === 'string' ? null : parseReference(cell.reference.reference)
	);
	const label = $derived(
		typeof cell === 'string'
			? cell
			: (names[cell.reference.reference ?? ''] ??
					cell.reference.display ??
					cell.reference.reference)
	);
</script>

{#if target && resourceType(target.type)}
	<a
		class="underline-offset-4 hover:underline"
		href={resolve('/(app)/resources/[type]/[id]', { type: target.type, id: target.id })}
		>{label || '—'}</a
	>
{:else}
	{label || '—'}
{/if}
