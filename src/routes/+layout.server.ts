import type { LayoutServerLoad } from './$types';

/** Who's signed in, for every page (from the session cookie, see hooks.server.ts). */
export const load: LayoutServerLoad = ({ locals }) => ({ user: locals.user });
