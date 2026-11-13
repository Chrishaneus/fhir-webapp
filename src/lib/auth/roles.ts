/**
 * The API's roles and what each may do. The API enforces these on every request; the app uses
 * them to show only what the signed-in user can actually do.
 */
export const roles = ['viewer', 'clinician', 'admin'] as const;
export type Role = (typeof roles)[number];

export const isRole = (value: unknown): value is Role => roles.includes(value as Role);

/** Someone signed in, as read from their access token. */
export interface SessionUser {
	username: string;
	role: Role;
	/** When the token expires, in milliseconds since the epoch. */
	expiresAt: number;
}

export type Permission = 'read' | 'create' | 'update' | 'delete' | 'manageUsers';

/** Mirrors the API: viewers GET, clinicians also POST and PUT, admins also DELETE. */
const permissions: Record<Role, readonly Permission[]> = {
	viewer: ['read'],
	clinician: ['read', 'create', 'update'],
	admin: ['read', 'create', 'update', 'delete', 'manageUsers']
};

export function can(user: SessionUser | null | undefined, permission: Permission): boolean {
	return !!user && permissions[user.role].includes(permission);
}

export const roleLabels: Record<Role, string> = {
	viewer: 'Viewer',
	clinician: 'Clinician',
	admin: 'Admin'
};
