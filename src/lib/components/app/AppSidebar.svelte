<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { Path } from '$app/types';
	import type { SessionUser } from '#lib/auth/roles.js';
	import Logo from '#lib/components/app/Logo.svelte';
	import UserMenu from '#lib/components/app/UserMenu.svelte';
	import { isActive, navFor } from '#lib/components/app/navigation.js';
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';

	/** The signed-in navigation: only the pages this user's role may open. */
	let { user }: { user: SessionUser } = $props();
	const sections = $derived(navFor(user));
	const href = (path: string) => resolve(path as Path);
</script>

<Sidebar.Root collapsible="icon">
	<Sidebar.Header>
		<a href={resolve('/(app)/dashboard')} class="px-2 py-1"><Logo /></a>
	</Sidebar.Header>
	<Sidebar.Content>
		{#each sections as section (section.label)}
			<Sidebar.Group>
				<Sidebar.GroupLabel>{section.label}</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						{#each section.items as item (item.path)}
							{@const active = isActive(item.path, page.url.pathname)}
							<Sidebar.MenuItem>
								<Sidebar.MenuButton isActive={active} tooltipContent={item.label}>
									{#snippet child({ props })}
										<a href={href(item.path)} aria-current={active ? 'page' : undefined} {...props}>
											<item.icon />
											<span>{item.label}</span>
										</a>
									{/snippet}
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
						{/each}
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		{/each}
	</Sidebar.Content>
	<Sidebar.Footer>
		<UserMenu {user} />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
