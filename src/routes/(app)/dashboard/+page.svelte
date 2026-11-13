<script lang="ts">
	import { BarChart } from 'layerchart/svg';
	import Activity from '@lucide/svelte/icons/activity';
	import Pill from '@lucide/svelte/icons/pill';
	import Stethoscope from '@lucide/svelte/icons/stethoscope';
	import Thermometer from '@lucide/svelte/icons/thermometer';
	import UserRound from '@lucide/svelte/icons/user-round';
	import Users from '@lucide/svelte/icons/users';
	import { roleLabels } from '#lib/auth/roles.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Chart from '#lib/components/ui/chart/index.js';
	import * as Table from '#lib/components/ui/table/index.js';
	import { formatConcept, formatDate, formatName, timeAgo } from '#lib/fhir/format.js';
	import type { CodeableConcept, HumanName, Period, Reference, Resource } from '#lib/fhir/types.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const labels: Record<string, { label: string; icon: typeof Users }> = {
		Patient: { label: 'Patients', icon: Users },
		Practitioner: { label: 'Practitioners', icon: UserRound },
		Encounter: { label: 'Encounters', icon: Stethoscope },
		Observation: { label: 'Observations', icon: Thermometer },
		Condition: { label: 'Conditions', icon: Activity },
		MedicationRequest: { label: 'Medication requests', icon: Pill }
	};

	const genderData = $derived(
		data.genders.map((g) => ({
			gender: g.gender[0].toUpperCase() + g.gender.slice(1),
			total: g.total
		}))
	);
	const chartConfig = {
		total: { label: 'Patients', color: 'var(--primary)' }
	} satisfies Chart.ChartConfig;

	type Encounter = Resource & {
		status?: string;
		class?: CodeableConcept[];
		actualPeriod?: Period;
		period?: Period;
		subject?: Reference;
	};
	const entries = $derived(data.encounters.entry ?? []);
	/** Patients the encounters point at, by reference ("Patient/id"), from _include. */
	const patients = $derived(
		new Map(
			entries
				.filter((e) => e.resource?.resourceType === 'Patient')
				.map((e) => [`Patient/${e.resource!.id}`, formatName(e.resource!.name as HumanName[])])
		)
	);
	const encounters = $derived(
		entries.flatMap((e) =>
			e.resource?.resourceType === 'Encounter' ? [e.resource as Encounter] : []
		)
	);
	const changes = $derived(data.changes.entry ?? []);
	const methodLabels: Record<string, string> = {
		POST: 'Created',
		PUT: 'Updated',
		DELETE: 'Deleted'
	};
</script>

<svelte:head>
	<title>Dashboard · FHIR Chart</title>
</svelte:head>

<div>
	<h1 class="text-2xl font-semibold tracking-tight">Dashboard</h1>
	{#if data.user}
		<p class="text-muted-foreground">
			Signed in as {data.user.username} ({roleLabels[data.user.role]}).
		</p>
	{/if}
</div>

<section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Counts">
	{#each data.counts as { type, total } (type)}
		{@const meta = labels[type]}
		<Card.Root data-testid="count" data-type={type}>
			<Card.Header class="flex flex-row items-center justify-between">
				<Card.Description>{meta.label}</Card.Description>
				<meta.icon class="size-4 text-muted-foreground" />
			</Card.Header>
			<Card.Content>
				<p class="text-3xl font-semibold tabular-nums">{total.toLocaleString('en')}</p>
			</Card.Content>
		</Card.Root>
	{/each}
</section>

<section class="grid gap-4 lg:grid-cols-5">
	<Card.Root class="lg:col-span-2">
		<Card.Header>
			<Card.Title>Patients by gender</Card.Title>
			<Card.Description>Administrative gender, as recorded.</Card.Description>
		</Card.Header>
		<Card.Content>
			<Chart.Container config={chartConfig} class="aspect-auto h-56 w-full">
				<BarChart
					data={genderData}
					x="gender"
					axis="x"
					series={[{ key: 'total', label: 'Patients', color: chartConfig.total.color }]}
					props={{ bars: { stroke: 'none', rounded: 'all', radius: 6 } }}
				>
					{#snippet tooltip()}
						<Chart.Tooltip />
					{/snippet}
				</BarChart>
			</Chart.Container>
		</Card.Content>
	</Card.Root>

	<Card.Root class="lg:col-span-3">
		<Card.Header>
			<Card.Title>Latest encounters</Card.Title>
			<Card.Description>The five most recent, by when they started.</Card.Description>
		</Card.Header>
		<Card.Content>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Patient</Table.Head>
						<Table.Head>Class</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head>When</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each encounters as encounter (encounter.id)}
						<Table.Row>
							<Table.Cell>
								{patients.get(encounter.subject?.reference ?? '') ||
									encounter.subject?.reference ||
									'—'}
							</Table.Cell>
							<Table.Cell>{formatConcept(encounter.class) || '—'}</Table.Cell>
							<Table.Cell
								><Badge variant="outline">{encounter.status ?? 'unknown'}</Badge></Table.Cell
							>
							<Table.Cell class="text-muted-foreground">
								{formatDate((encounter.actualPeriod ?? encounter.period)?.start) || '—'}
							</Table.Cell>
						</Table.Row>
					{:else}
						<Table.Row>
							<Table.Cell colspan={4} class="text-muted-foreground">No encounters yet.</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</Card.Content>
	</Card.Root>
</section>

<Card.Root>
	<Card.Header>
		<Card.Title>Recent changes</Card.Title>
		<Card.Description
			>The latest creates, updates and deletes across every resource type.</Card.Description
		>
	</Card.Header>
	<Card.Content>
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Resource</Table.Head>
					<Table.Head>Change</Table.Head>
					<Table.Head>Version</Table.Head>
					<Table.Head>When</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each changes as change, i (i)}
					{@const resource = change.resource}
					<Table.Row data-testid="change">
						<Table.Cell class="font-mono text-xs">
							{resource ? `${resource.resourceType}/${resource.id}` : change.request?.url}
						</Table.Cell>
						<Table.Cell
							>{methodLabels[change.request?.method ?? ''] ?? change.request?.method}</Table.Cell
						>
						<Table.Cell>{resource?.meta?.versionId ?? '—'}</Table.Cell>
						<Table.Cell class="text-muted-foreground"
							>{timeAgo(resource?.meta?.lastUpdated)}</Table.Cell
						>
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={4} class="text-muted-foreground">No changes yet.</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</Card.Content>
</Card.Root>
