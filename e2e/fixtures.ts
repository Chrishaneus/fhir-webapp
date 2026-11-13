/** The users and data every end-to-end test can rely on; global-setup.ts creates them. */
export const API_PORT = Number(process.env.FHIR_E2E_API_PORT ?? 58000);
export const API_URL = `http://localhost:${API_PORT}`;
export const APP_URL = 'http://localhost:4173';

export const PASSWORD = 'e2e-password-1';
/** One user per role. The admin is the first user, the others are added by it. */
export const users = {
	admin: 'e2e-admin',
	clinician: 'e2e-clinician',
	viewer: 'e2e-viewer'
} as const;

/** Patients with names no generated data has, and fixed ids (created with PUT). */
export const patients = [
	{
		id: 'e2e-ada',
		family: 'Quillfeather',
		given: 'Ada',
		gender: 'female',
		birthDate: '1985-04-12'
	},
	{ id: 'e2e-bo', family: 'Quillfeather', given: 'Bo', gender: 'male', birthDate: '1952-09-30' },
	{ id: 'e2e-cy', family: 'Marchbank', given: 'Cy', gender: 'other', birthDate: '2001-01-05' }
] as const;

/** Ada's heart rates, oldest first. */
export const heartRates = [
	{ id: 'e2e-hr-1', value: 61, when: '2026-01-10T09:00:00Z' },
	{ id: 'e2e-hr-2', value: 74, when: '2026-03-02T09:00:00Z' },
	{ id: 'e2e-hr-3', value: 88, when: '2026-05-20T09:00:00Z' }
] as const;
