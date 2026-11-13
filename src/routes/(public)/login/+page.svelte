<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let pending = $state(false);
</script>

<svelte:head>
	<title>Sign in · FHIR Chart</title>
</svelte:head>

<div class="mx-auto flex max-w-sm flex-col gap-4 px-4 py-16">
	{#if data.expired}
		<Alert.Root>
			<Alert.Title>Your session ended</Alert.Title>
			<Alert.Description>Sign in again to continue where you were.</Alert.Description>
		</Alert.Root>
	{/if}
	{#if data.registered}
		<Alert.Root>
			<Alert.Title>Account created</Alert.Title>
			<Alert.Description>Sign in with your new username and password.</Alert.Description>
		</Alert.Root>
	{/if}
	<Card.Root>
		<Card.Header>
			<Card.Title><h1>Sign in</h1></Card.Title>
			<Card.Description>With your account on the FHIR server.</Card.Description>
		</Card.Header>
		<Card.Content>
			<form
				method="POST"
				class="flex flex-col gap-4"
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
						autocomplete="username"
						required
						value={form?.username ?? ''}
					/>
				</div>
				<div class="grid gap-2">
					<Label for="password">Password</Label>
					<Input
						id="password"
						name="password"
						type="password"
						autocomplete="current-password"
						required
					/>
				</div>
				{#if form?.error}
					<p role="alert" class="text-sm text-destructive">{form.error}</p>
				{/if}
				<Button type="submit" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</Button>
			</form>
		</Card.Content>
	</Card.Root>
</div>
