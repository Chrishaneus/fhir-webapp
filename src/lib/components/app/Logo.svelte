<script lang="ts">
	import HeartPulse from '@lucide/svelte/icons/heart-pulse';
	import { cn } from '#lib/utils.js';

	let { class: className }: { class?: string } = $props();
</script>

<span class={cn('flex items-center gap-2 font-semibold', className)}>
	<span
		class="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground"
	>
		<HeartPulse class="size-4" />
	</span>
	FHIR Chart
</span>
