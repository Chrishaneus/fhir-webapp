<script lang="ts">
	import { resolve } from '$app/paths';
	import Logo from '#lib/components/app/Logo.svelte';
	import ThemeToggle from '#lib/components/app/ThemeToggle.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

<!-- Pages anyone can see: the landing page and signing in. -->
<div class="flex min-h-svh flex-col">
	<header class="border-b">
		<div class="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
			<a href={resolve('/(public)')} aria-label="Home"><Logo /></a>
			<div class="ml-auto flex items-center gap-2">
				<ThemeToggle />
				{#if data.user}
					<Button href={resolve('/(app)/dashboard')} size="sm">Open the dashboard</Button>
				{:else}
					<Button href={resolve('/(public)/login')} variant="ghost" size="sm">Sign in</Button>
					<Button href={resolve('/(public)/register')} size="sm">Create an account</Button>
				{/if}
			</div>
		</div>
	</header>
	<main class="flex-1">{@render children()}</main>
	<footer class="border-t py-6 text-center text-sm text-muted-foreground">
		Synthetic data only. Not for real patient information.
	</footer>
</div>
