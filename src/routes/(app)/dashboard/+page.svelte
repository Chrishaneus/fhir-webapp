<script lang="ts">
	import { roleLabels } from '#lib/auth/roles.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Dashboard · FHIR Chart</title>
</svelte:head>

<h1 class="text-2xl font-semibold tracking-tight">Dashboard</h1>
{#if data.user}
	<p class="text-muted-foreground">
		Signed in as {data.user.username} ({roleLabels[data.user.role]}).
	</p>
{/if}
