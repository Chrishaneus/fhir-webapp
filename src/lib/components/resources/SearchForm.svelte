<script lang="ts">
	import Search from '@lucide/svelte/icons/search';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import * as NativeSelect from '#lib/components/ui/native-select/index.js';
	import type { SearchField } from '#lib/fhir/resources.js';

	/**
	 * A type's search fields as a GET form, so the filters live in the address: shareable, and
	 * back and forward work. Searching starts again at page 1.
	 */
	let {
		fields,
		values,
		sort,
		fixed = {}
	}: {
		fields: SearchField[];
		values: Record<string, string>;
		sort: string | null;
		/** Parameters that stay whatever the search, e.g. the patient a list is limited to. */
		fixed?: Record<string, string>;
	} = $props();
	const active = $derived(Object.keys(values).length > 0);
	// Always with "?", so it's a link even where the path is empty.
	const clearHref = $derived(`${page.url.pathname}?${new URLSearchParams(fixed)}`);

	/**
	 * Go to the filtered address, leaving out empty fields. Without JavaScript the form submits
	 * as usual, empty fields and all.
	 */
	function search(event: SubmitEvent) {
		event.preventDefault();
		// A throwaway object to build a link from, not state.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const params = new URLSearchParams();
		for (const [key, value] of new FormData(event.currentTarget as HTMLFormElement)) {
			if (typeof value === 'string' && value.trim()) params.append(key, value.trim());
		}
		const query = params.toString();
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- this page, other filters
		goto(`${page.url.pathname}${query ? `?${query}` : ''}`);
	}
</script>

<form
	method="GET"
	class="flex flex-wrap items-end gap-3"
	data-testid="search-form"
	onsubmit={search}
>
	{#each fields as field (field.key)}
		<div class="grid gap-1.5">
			<Label for="search-{field.key}" class="text-xs text-muted-foreground">{field.label}</Label>
			{#if field.kind === 'select'}
				<NativeSelect.Root id="search-{field.key}" name={field.key} value={values[field.key] ?? ''}>
					<NativeSelect.Option value="">Any</NativeSelect.Option>
					{#each field.options ?? [] as option (option)}
						<NativeSelect.Option value={option}>{option}</NativeSelect.Option>
					{/each}
				</NativeSelect.Root>
			{:else}
				<Input
					id="search-{field.key}"
					name={field.key}
					type={field.kind === 'date' ? 'date' : 'search'}
					placeholder={field.placeholder}
					value={values[field.key] ?? ''}
					class="w-44"
				/>
			{/if}
		</div>
	{/each}
	{#if sort}<input type="hidden" name="sort" value={sort} />{/if}
	{#each Object.entries(fixed) as [name, value] (name)}
		<input type="hidden" {name} {value} />
	{/each}
	<Button type="submit"><Search />Search</Button>
	{#if active}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- this page, no filters -->
		<Button variant="ghost" href={clearHref}>Clear</Button>
	{/if}
</form>
