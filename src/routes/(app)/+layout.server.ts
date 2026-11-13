import { error } from '@sveltejs/kit';
import { FORBIDDEN } from '#lib/auth/access.js';
import type { LayoutServerLoad } from './$types';

/**
 * A page the user's role doesn't allow, shown as a 403 on the app's error page. The hook has
 * already refused anything other than viewing it.
 */
export const load: LayoutServerLoad = ({ locals }) => {
	if (locals.forbidden) error(403, FORBIDDEN);
};
