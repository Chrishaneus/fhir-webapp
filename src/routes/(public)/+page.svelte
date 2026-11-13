<script lang="ts">
	import Activity from '@lucide/svelte/icons/activity';
	import History from '@lucide/svelte/icons/history';
	import Search from '@lucide/svelte/icons/search';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import * as Card from '#lib/components/ui/card/index.js';

	const features = [
		{
			icon: Search,
			title: 'Search every resource',
			text: 'Find patients by name, gender or birth date, and browse encounters, observations, conditions, medications and more, a page at a time.'
		},
		{
			icon: Activity,
			title: 'A dashboard of the data',
			text: 'See how many patients, encounters and observations the server holds, and the latest activity at a glance.'
		},
		{
			icon: History,
			title: 'Every version kept',
			text: 'Open any resource to read it field by field or as FHIR JSON, and step through its earlier versions.'
		},
		{
			icon: ShieldCheck,
			title: 'Access by role',
			text: 'Viewers read, clinicians also create and update, admins can delete. Each role only sees what it may do.'
		}
	];
</script>

<svelte:head>
	<title>FHIR Chart: browse FHIR R5 records</title>
</svelte:head>

<section class="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-20 text-center">
	<Badge variant="secondary">FHIR R5 · fhir-rest-api</Badge>
	<h1 class="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
		Clinical records, readable at a glance
	</h1>
	<p class="max-w-2xl text-lg text-balance text-muted-foreground">
		A web app for the FHIR REST API: search patients and their records, follow what changed, and
		work within what your role allows.
	</p>
</section>

<section class="mx-auto grid max-w-6xl gap-4 px-4 pb-20 sm:grid-cols-2 lg:grid-cols-4">
	{#each features as feature (feature.title)}
		<Card.Root>
			<Card.Header>
				<feature.icon class="mb-2 size-5 text-muted-foreground" />
				<Card.Title>{feature.title}</Card.Title>
				<Card.Description>{feature.text}</Card.Description>
			</Card.Header>
		</Card.Root>
	{/each}
</section>
