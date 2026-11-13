<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	let pending = $state(false);
	const errors = $derived((form?.errors ?? {}) as Record<string, string | undefined>);
</script>

<svelte:head>
	<title>Create an account · FHIR Chart</title>
</svelte:head>

{#snippet fieldError(name: string)}
	{#if errors[name]}
		<p id="{name}-error" class="text-sm text-destructive">{errors[name]}</p>
	{/if}
{/snippet}

<div class="mx-auto flex max-w-sm flex-col gap-4 px-4 py-16">
	<Card.Root>
		<Card.Header>
			<Card.Title><h1>Create an account</h1></Card.Title>
			<Card.Description>
				New accounts can read the records. An admin can give you a clinician or admin role.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<form
				method="POST"
				class="flex flex-col gap-4"
				novalidate
				use:enhance={() => {
					pending = true;
					return async ({ update }) => {
						await update({ reset: false });
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
						value={form?.username ?? ''}
						aria-invalid={!!errors.username}
						aria-describedby={errors.username ? 'username-error' : undefined}
					/>
					{@render fieldError('username')}
				</div>
				<div class="grid gap-2">
					<Label for="email">Email <span class="text-muted-foreground">(optional)</span></Label>
					<Input
						id="email"
						name="email"
						type="email"
						autocomplete="email"
						value={form?.email ?? ''}
						aria-invalid={!!errors.email}
						aria-describedby={errors.email ? 'email-error' : undefined}
					/>
					{@render fieldError('email')}
				</div>
				<div class="grid gap-2">
					<Label for="password">Password</Label>
					<Input
						id="password"
						name="password"
						type="password"
						autocomplete="new-password"
						aria-invalid={!!errors.password}
						aria-describedby={errors.password ? 'password-error' : undefined}
					/>
					{@render fieldError('password')}
				</div>
				<div class="grid gap-2">
					<Label for="confirm">Confirm password</Label>
					<Input
						id="confirm"
						name="confirm"
						type="password"
						autocomplete="new-password"
						aria-invalid={!!errors.confirm}
						aria-describedby={errors.confirm ? 'confirm-error' : undefined}
					/>
					{@render fieldError('confirm')}
				</div>
				{#if errors.form}
					<p role="alert" class="text-sm text-destructive">{errors.form}</p>
				{/if}
				<Button type="submit" disabled={pending}
					>{pending ? 'Creating account…' : 'Create account'}</Button
				>
			</form>
		</Card.Content>
		<Card.Footer class="text-sm text-muted-foreground">
			Already have one?&nbsp;<a class="underline" href={resolve('/(public)/login')}>Sign in</a>
		</Card.Footer>
	</Card.Root>
</div>
