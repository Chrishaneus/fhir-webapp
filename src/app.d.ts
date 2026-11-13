// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { SessionUser } from '#lib/auth/roles.js';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			/** Who's signed in, from the session cookie; null when nobody is. */
			user: SessionUser | null;
			/** Their access token for the FHIR API (server only, never sent to the page). */
			token: string | null;
			/** The user's role may not open this page (see #lib/auth/access). */
			forbidden: boolean;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
