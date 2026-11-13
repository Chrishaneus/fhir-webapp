<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { page as current } from '$app/state';
	import { Button } from '#lib/components/ui/button/index.js';

	/** "21–40 of 200" with previous and next links that keep the rest of the address. */
	let { page, pageSize, total }: { page: number; pageSize: number; total: number } = $props();

	const pages = $derived(Math.max(1, Math.ceil(total / pageSize)));
	const first = $derived(total === 0 ? 0 : (page - 1) * pageSize + 1);
	const last = $derived(Math.min(page * pageSize, total));

	function hrefFor(target: number) {
		// A throwaway copy to build a link from, not state: nothing needs to react to it.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const params = new URLSearchParams(current.url.search);
		if (target === 1) params.delete('page');
		else params.set('page', String(target));
		const query = params.toString();
		return `${current.url.pathname}${query ? `?${query}` : ''}`;
	}
</script>

<nav class="flex items-center justify-between gap-2" aria-label="Pages">
	<p class="text-sm text-muted-foreground" data-testid="page-range">
		{first.toLocaleString('en')}–{last.toLocaleString('en')} of {total.toLocaleString('en')}
	</p>
	<div class="flex items-center gap-2">
		<!-- eslint-disable svelte/no-navigation-without-resolve -- the current page, other query -->
		<Button
			variant="outline"
			size="sm"
			href={page > 1 ? hrefFor(page - 1) : undefined}
			disabled={page <= 1}
			aria-label="Previous page"><ChevronLeft />Previous</Button
		>
		<span class="text-sm tabular-nums">Page {page} of {pages}</span>
		<Button
			variant="outline"
			size="sm"
			href={page < pages ? hrefFor(page + 1) : undefined}
			disabled={page >= pages}
			aria-label="Next page">Next<ChevronRight /></Button
		>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	</div>
</nav>
