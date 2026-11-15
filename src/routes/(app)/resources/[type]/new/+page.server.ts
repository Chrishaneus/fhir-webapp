import { error, fail, redirect } from '@sveltejs/kit';
import { can } from '#lib/auth/roles.js';
import { resourceType } from '#lib/fhir/resources.js';
import type { Resource } from '#lib/fhir/types.js';
import { ApiError, userApi } from '#lib/server/api.js';
import { parseResourceJson } from '#lib/server/edit.js';
import type { Actions, PageServerLoad } from './$types';

/** Where a new resource starts: the fields its type usually needs. */
const templates: Record<string, Record<string, unknown>> = {
	Patient: {
		name: [{ use: 'official', family: '', given: [''] }],
		gender: 'unknown',
		active: true
	},
	Practitioner: { name: [{ family: '', given: [''] }], active: true },
	Organization: { name: '', active: true },
	Encounter: { status: 'planned', class: [{ coding: [{ code: 'AMB', display: 'ambulatory' }] }] },
	Observation: { status: 'preliminary', code: { text: '' } },
	Condition: { code: { text: '' } },
	AllergyIntolerance: { code: { text: '' } },
	MedicationRequest: { status: 'draft', intent: 'order', medication: { concept: { text: '' } } },
	DiagnosticReport: { status: 'registered', code: { text: '' } },
	Procedure: { status: 'preparation', code: { text: '' } },
	PractitionerRole: { code: [{ text: '' }], active: true },
	RelatedPerson: { name: [{ family: '', given: [''] }], active: true },
	Location: { name: '', status: 'active' },
	EpisodeOfCare: { status: 'planned' },
	FamilyMemberHistory: { status: 'partial', relationship: { text: '' } },
	Immunization: { status: 'completed', vaccineCode: { text: '' }, occurrenceDateTime: '' },
	Specimen: { status: 'available', type: { text: '' } },
	ImagingStudy: { status: 'registered', description: '' },
	Medication: { status: 'active', code: { text: '' } },
	MedicationStatement: { status: 'recorded', medication: { concept: { text: '' } } },
	MedicationDispense: { status: 'preparation', medication: { concept: { text: '' } } },
	MedicationAdministration: {
		status: 'in-progress',
		medication: { concept: { text: '' } },
		occurenceDateTime: ''
	},
	CarePlan: { status: 'draft', intent: 'plan', title: '' },
	Goal: { lifecycleStatus: 'proposed', description: { text: '' } },
	ServiceRequest: { status: 'draft', intent: 'order', code: { concept: { text: '' } } },
	Task: { status: 'draft', intent: 'order', description: '' },
	NutritionOrder: { status: 'draft', intent: 'order', dateTime: '' },
	Appointment: {
		status: 'proposed',
		description: '',
		start: '',
		end: '',
		participant: [{ actor: { reference: '' }, status: 'needs-action' }]
	},
	Schedule: { name: '', actor: [{ reference: '' }], active: true },
	Slot: { status: 'free', schedule: { reference: '' }, start: '', end: '' },
	DocumentReference: {
		status: 'current',
		type: { text: '' },
		content: [{ attachment: { contentType: 'text/plain', title: '' } }]
	},
	Composition: {
		status: 'preliminary',
		type: { text: '' },
		title: '',
		date: '',
		author: [{ reference: '' }]
	},
	Communication: { status: 'preparation' },
	CommunicationRequest: { status: 'draft', intent: 'order' },
	Coverage: { status: 'draft', kind: 'insurance' },
	Claim: { status: 'draft', use: 'claim', type: { text: '' }, created: '' }
};

export const load: PageServerLoad = ({ params, url }) => {
	const config = resourceType(params.type);
	if (!config) error(404, `The app doesn’t show ${params.type} resources.`);
	const patient = url.searchParams.get('patient');
	const resource: Record<string, unknown> = {
		resourceType: config.type,
		...templates[config.type]
	};
	// Opened from a patient's records: the new one is theirs.
	if (config.patientParam && patient && /^[A-Za-z0-9\-.]{1,64}$/.test(patient)) {
		const reference = { reference: `Patient/${patient}` };
		Object.assign(resource, config.forPatient?.(reference) ?? { subject: reference });
	}
	return { type: config.type, json: JSON.stringify(resource, null, 2) };
};

async function read(event: Parameters<Actions[string]>[0]) {
	const config = resourceType(event.params.type);
	if (!config) error(404, 'Unknown resource type.');
	if (!can(event.locals.user, 'create')) error(403, 'Your role can’t create records.');
	const json = String((await event.request.formData()).get('json') ?? '');
	return { config, json, parsed: parseResourceJson(json, config.type) };
}

export const actions: Actions = {
	validate: async (event) => {
		const { config, json, parsed } = await read(event);
		if ('problem' in parsed) return fail(400, { json, problem: parsed.problem });
		try {
			await userApi(event)(`/${config.type}/$validate`, { method: 'POST', body: parsed.resource });
			return { json, valid: true };
		} catch (e) {
			if (e instanceof ApiError) return fail(e.status, { json, problem: e.message });
			throw e;
		}
	},
	save: async (event) => {
		const { config, json, parsed } = await read(event);
		if ('problem' in parsed) return fail(400, { json, problem: parsed.problem });
		// The server assigns the id.
		const { id: _id, ...resource } = parsed.resource;
		let created: Resource;
		try {
			created = await userApi(event)<Resource>(`/${config.type}`, {
				method: 'POST',
				body: resource
			});
		} catch (e) {
			if (e instanceof ApiError) return fail(e.status, { json, problem: e.message });
			throw e;
		}
		redirect(303, `/resources/${config.type}/${encodeURIComponent(created.id ?? '')}?saved=1`);
	}
};
