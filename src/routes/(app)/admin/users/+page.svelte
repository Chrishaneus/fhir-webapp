<script lang="ts">
	import { enhance } from '$app/forms';
	import { roleLabels, roles } from '#lib/auth/roles.js';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import * as Select from '#lib/components/ui/select/index.js';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	const errors = $derived(
		(form && 'errors' in form ? form.errors : {}) as Record<string, string | undefined>
	);
	let role = $state('clinician');
	let pending = $state(false);

	const descriptions: Record<string, string> = {
		viewer: 'Reads records.',
		clinician: 'Reads, creates and updates records.',
		admin: 'Everything, including deleting records and adding users.'
	};
</script>

<svelte:head>
	<title>Users · FHIR Chart</title>
</svelte:head>

<div class="flex max-w-xl flex-col gap-6">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">Add a user</h1>
		<p class="text-muted-foreground">
			People who sign up themselves become viewers. Here you can create accounts with any role.
		</p>
	</div>

	{#if form && 'created' in form && form.created}
		<Alert.Root data-testid="user-created">
			<Alert.Title>{form.created.username} was added</Alert.Title>
			<Alert.Description>
				As {roleLabels[form.created.role as keyof typeof roleLabels]}. Give them their password
				another way; the app doesn't send it.
			</Alert.Description>
		</Alert.Root>
	{/if}

	<Card.Root>
		<Card.Content>
			<form
				method="POST"
				class="flex flex-col gap-4"
				novalidate
				use:enhance={() => {
					pending = true;
					return async ({ update }) => {
						await update();
						pending = false;
					};
				}}
			>
				<div class="grid gap-2">
					<Label for="username">Username</Label>
					<Input
						id="username"
						name="username"
						autocomplete="off"
						value={form && 'username' in form ? form.username : ''}
						aria-invalid={!!errors.username}
					/>
					{#if errors.username}<p class="text-sm text-destructive">{errors.username}</p>{/if}
				</div>
				<div class="grid gap-2">
					<Label for="password">Password</Label>
					<Input
						id="password"
						name="password"
						type="password"
						autocomplete="new-password"
						aria-invalid={!!errors.password}
					/>
					{#if errors.password}<p class="text-sm text-destructive">{errors.password}</p>{/if}
				</div>
				<div class="grid gap-2">
					<Label for="role">Role</Label>
					<input type="hidden" name="role" value={role} />
					<Select.Root type="single" bind:value={role}>
						<Select.Trigger id="role" class="w-full"
							>{roleLabels[role as keyof typeof roleLabels]}</Select.Trigger
						>
						<Select.Content>
							{#each roles as r (r)}
								<Select.Item value={r} label={roleLabels[r]}>
									<span class="flex flex-col">
										<span>{roleLabels[r]}</span>
										<span class="text-xs text-muted-foreground">{descriptions[r]}</span>
									</span>
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					{#if errors.role}<p class="text-sm text-destructive">{errors.role}</p>{/if}
				</div>
				{#if errors.form}<p role="alert" class="text-sm text-destructive">{errors.form}</p>{/if}
				<Button type="submit" class="self-start" disabled={pending}
					>{pending ? 'Adding…' : 'Add user'}</Button
				>
			</form>
		</Card.Content>
	</Card.Root>
</div>
