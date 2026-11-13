<script lang="ts">
	import { resolve } from '$app/paths';
	import Logo from '#lib/components/app/Logo.svelte';
	import ThemeToggle from '#lib/components/app/ThemeToggle.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<!-- Pages anyone can see: the landing page and signing in. -->
<div class="flex min-h-svh flex-col">
	<header class="border-b">
		<div class="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
			<a href={resolve('/(public)')} aria-label="Home"><Logo /></a>
			<div class="ml-auto flex items-center gap-2">
				<ThemeToggle />
			</div>
		</div>
	</header>
	<main class="flex-1">{@render children()}</main>
	<footer class="border-t py-6 text-center text-sm text-muted-foreground">
		Synthetic data only. Not for real patient information.
	</footer>
</div>
