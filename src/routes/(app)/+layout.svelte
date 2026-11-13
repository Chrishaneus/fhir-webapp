<script lang="ts">
	import AppSidebar from '#lib/components/app/AppSidebar.svelte';
	import { Separator } from '#lib/components/ui/separator/index.js';
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';
	import type { LayoutProps } from './$types';

	// The hook only lets signed-in users into these pages.
	let { data, children }: LayoutProps = $props();
</script>

{#if data.user}
	<Sidebar.Provider>
		<AppSidebar user={data.user} />
		<Sidebar.Inset>
			<header class="flex h-12 shrink-0 items-center gap-2 border-b px-4">
				<Sidebar.Trigger class="-ml-1" />
				<Separator
					orientation="vertical"
					class="mr-2 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
				/>
				<span class="text-sm text-muted-foreground">Synthetic data only</span>
			</header>
			<main class="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
				{@render children()}
			</main>
		</Sidebar.Inset>
	</Sidebar.Provider>
{/if}
