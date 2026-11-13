import { redirect } from '@sveltejs/kit';
import { clearSession } from '#lib/server/session.js';
import type { Actions, PageServerLoad } from './$types';

// Signing out is a POST (a form), so a link or prefetch can't sign anyone out.
export const load: PageServerLoad = () => redirect(303, '/');

export const actions: Actions = {
	default: ({ cookies }) => {
		clearSession(cookies);
		redirect(303, '/');
	}
};
