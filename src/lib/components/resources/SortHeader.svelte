<script lang="ts">
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import { page } from '$app/state';
	import type { Column } from '#lib/fhir/resources.js';

	/** A column heading that sorts by it: ascending first, then descending. */
	let { column, sort }: { column: Column; sort: string | null } = $props();

	const direction = $derived(
		sort === column.sort ? 'ascending' : sort === `-${column.sort}` ? 'descending' : null
	);
	const href = $derived.by(() => {
		// A throwaway copy to build a link from, not state.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const params = new URLSearchParams(page.url.search);
		params.set('sort', direction === 'ascending' ? `-${column.sort}` : column.sort!);
		params.delete('page');
		return `${page.url.pathname}?${params}`;
	});
</script>

{#if column.sort}
	<!-- eslint-disable svelte/no-navigation-without-resolve -- this page, another sort -->
	<a
		{href}
		class="inline-flex items-center gap-1 hover:text-foreground"
		data-testid="sort-{column.sort}"
	>
		{column.label}
		{#if direction === 'ascending'}<ArrowUp class="size-3.5" /><span class="sr-only"
				>(sorted ascending)</span
			>
		{:else if direction === 'descending'}<ArrowDown class="size-3.5" /><span class="sr-only"
				>(sorted descending)</span
			>
		{:else}<ArrowUpDown class="size-3.5 opacity-40" />{/if}
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
{:else}
	{column.label}
{/if}
