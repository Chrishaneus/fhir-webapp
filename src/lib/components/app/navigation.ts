import type { Component } from 'svelte';
import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
import UserPlus from '@lucide/svelte/icons/user-plus';
import { can, type Permission, type SessionUser } from '#lib/auth/roles.js';
import { resourceTypes } from '#lib/fhir/resources.js';

export interface NavItem {
	label: string;
	/** A page path; the hook enforces the same rule on the page itself. */
	path: string;
	icon: Component;
	/** Shown only to users with this permission. */
	permission: Permission;
}

export interface NavSection {
	label: string;
	items: NavItem[];
}

export const navSections: NavSection[] = [
	{
		label: 'Overview',
		items: [{ label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: 'read' }]
	},
	{
		label: 'Records',
		items: resourceTypes.map((t) => ({
			label: t.plural,
			path: `/resources/${t.type}`,
			icon: t.icon,
			permission: 'read' as const
		}))
	},
	{
		label: 'Admin',
		items: [{ label: 'Users', path: '/admin/users', icon: UserPlus, permission: 'manageUsers' }]
	}
];

/** The sections and items this user may use; empty sections are left out. */
export function navFor(user: SessionUser | null): NavSection[] {
	return navSections
		.map((section) => ({ ...section, items: section.items.filter((i) => can(user, i.permission)) }))
		.filter((section) => section.items.length > 0);
}

/** Whether a nav item is the current page or one of its sub-pages. */
export function isActive(path: string, current: string) {
	return current === path || current.startsWith(`${path}/`);
}
