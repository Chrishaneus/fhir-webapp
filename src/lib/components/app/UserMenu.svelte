<script lang="ts">
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Moon from '@lucide/svelte/icons/moon';
	import { toggleMode } from 'mode-watcher';
	import { roleLabels, type SessionUser } from '#lib/auth/roles.js';
	import * as Avatar from '#lib/components/ui/avatar/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';

	/** Who's signed in, their role, the theme and signing out. */
	let { user }: { user: SessionUser } = $props();
	const initials = $derived(user.username.slice(0, 2).toUpperCase());
	let signOut = $state<HTMLFormElement>();
</script>

<!-- A real form, so signing out is a POST that works without JavaScript too. -->
<form method="POST" action="/logout" bind:this={signOut} class="hidden"></form>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Sidebar.MenuButton size="lg" {...props} data-testid="user-menu">
						<Avatar.Root class="size-8 rounded-md">
							<Avatar.Fallback class="rounded-md">{initials}</Avatar.Fallback>
						</Avatar.Root>
						<div class="grid flex-1 text-left text-sm leading-tight">
							<span class="truncate font-medium">{user.username}</span>
							<span class="truncate text-xs text-muted-foreground" data-testid="user-role"
								>{roleLabels[user.role]}</span
							>
						</div>
						<ChevronsUpDown class="ml-auto size-4" />
					</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="w-56" side="top" align="start">
				<DropdownMenu.Label class="flex items-center gap-2">
					<span class="truncate">{user.username}</span>
					<Badge variant="secondary" class="ml-auto">{roleLabels[user.role]}</Badge>
				</DropdownMenu.Label>
				<DropdownMenu.Separator />
				<DropdownMenu.Item onSelect={toggleMode}><Moon />Toggle dark mode</DropdownMenu.Item>
				<DropdownMenu.Item onSelect={() => signOut?.requestSubmit()}>
					<LogOut />Sign out
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>
