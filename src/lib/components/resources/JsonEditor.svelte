<script lang="ts">
	import { enhance } from '$app/forms';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';

	/**
	 * A resource's FHIR JSON to edit, with Validate (the API's $validate) and Save. The text
	 * survives a failed save, so nothing typed is lost.
	 */
	let {
		json,
		version = null,
		result,
		saveLabel = 'Save'
	}: {
		json: string;
		/** The version being edited, sent back as If-Match. */
		version?: string | null;
		result?: { problem?: string; valid?: boolean; json?: string } | null;
		saveLabel?: string;
	} = $props();

	let pending = $state<string | null>(null);
	// Starts from the server's text, then follows what's typed.
	// svelte-ignore state_referenced_locally
	let text = $state(result?.json ?? json);
</script>

<form
	method="POST"
	class="flex flex-col gap-4"
	use:enhance={({ action }) => {
		pending = action.search;
		return async ({ update }) => {
			await update({ reset: false });
			pending = null;
		};
	}}
>
	{#if version}<input type="hidden" name="version" value={version} />{/if}
	<Textarea
		name="json"
		bind:value={text}
		spellcheck={false}
		aria-label="FHIR JSON"
		class="min-h-[28rem] font-mono text-xs leading-5"
		data-testid="json-editor"
	/>
	{#if result?.problem}
		<Alert.Root variant="destructive" data-testid="editor-problem">
			<Alert.Title>Not saved</Alert.Title>
			<Alert.Description>{result.problem}</Alert.Description>
		</Alert.Root>
	{:else if result?.valid}
		<Alert.Root data-testid="editor-valid">
			<CircleCheck />
			<Alert.Title>The server accepts this resource</Alert.Title>
		</Alert.Root>
	{/if}
	<div class="flex gap-2">
		<Button type="submit" formaction="?/save" disabled={pending !== null}
			>{pending === '?/save' ? 'Saving…' : saveLabel}</Button
		>
		<Button type="submit" formaction="?/validate" variant="outline" disabled={pending !== null}
			>{pending === '?/validate' ? 'Checking…' : 'Validate'}</Button
		>
	</div>
</form>
