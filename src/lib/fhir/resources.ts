import type { Component } from 'svelte';
import Activity from '@lucide/svelte/icons/activity';
import Building2 from '@lucide/svelte/icons/building-2';
import FileText from '@lucide/svelte/icons/file-text';
import Pill from '@lucide/svelte/icons/pill';
import Scissors from '@lucide/svelte/icons/scissors';
import ShieldAlert from '@lucide/svelte/icons/shield-alert';
import Stethoscope from '@lucide/svelte/icons/stethoscope';
import Thermometer from '@lucide/svelte/icons/thermometer';
import UserRound from '@lucide/svelte/icons/user-round';
import Users from '@lucide/svelte/icons/users';
import { ageFrom, formatConcept, formatDate, formatName, formatQuantity } from './format.js';
import type { CodeableConcept, HumanName, Period, Quantity, Reference, Resource } from './types.js';

/** A value in a table cell or on a resource's summary: text, or a link to another resource. */
export type Cell = string | { reference: Reference };

export interface Column {
	label: string;
	value: (resource: Resource) => Cell;
	/** The search parameter that sorts by this column, when the API can. */
	sort?: string;
}

export interface SearchField {
	/** The key in the page's address. */
	key: string;
	/** The API's search parameter. */
	param: string;
	label: string;
	kind: 'text' | 'select' | 'date';
	/** Put before the value, e.g. `ge` for "on or after". */
	prefix?: string;
	options?: string[];
	placeholder?: string;
}

export interface ResourceType {
	type: string;
	label: string;
	plural: string;
	icon: Component;
	columns: Column[];
	search: SearchField[];
	defaultSort?: string;
	/** References to fetch with the page (`_include`), so their names can be shown. */
	include?: string[];
	/** The search parameter that finds a patient's resources of this type. */
	patientParam?: string;
}

// FHIR resources are open-ended JSON; columns read the fields they show.
type Fields = Record<string, unknown>;
const f = (r: Resource) => r as Fields;
const concept = (v: unknown) => formatConcept(v as CodeableConcept | CodeableConcept[]);
const ref = (v: unknown): Cell => (v ? { reference: v as Reference } : '');
const date = (v: unknown) => formatDate(v as string | undefined);
const start = (v: unknown) => formatDate((v as Period | undefined)?.start);
const text = (v: unknown) => (v === undefined || v === null ? '' : String(v));
/** FHIR leaves `active` out when it's unknown; that isn't "yes". */
const active = (v: unknown) => (v === true ? 'Yes' : v === false ? 'No' : '');

const fromTo = (param: string, label: string): SearchField[] => [
	{ key: 'from', param, label: `${label} from`, kind: 'date', prefix: 'ge' },
	{ key: 'to', param, label: `${label} until`, kind: 'date', prefix: 'le' }
];

export const resourceTypes: ResourceType[] = [
	{
		type: 'Patient',
		label: 'Patient',
		plural: 'Patients',
		icon: Users,
		defaultSort: 'family',
		columns: [
			{ label: 'Name', value: (r) => formatName(f(r).name as HumanName[]), sort: 'family' },
			{ label: 'Gender', value: (r) => text(f(r).gender), sort: 'gender' },
			{ label: 'Birth date', value: (r) => date(f(r).birthDate), sort: 'birthdate' },
			{
				label: 'Age',
				value: (r) => text(ageFrom(f(r).birthDate as string | undefined) ?? '')
			},
			{ label: 'Active', value: (r) => active(f(r).active) }
		],
		search: [
			{ key: 'family', param: 'family', label: 'Family name', kind: 'text' },
			{ key: 'given', param: 'given', label: 'Given name', kind: 'text' },
			{
				key: 'gender',
				param: 'gender',
				label: 'Gender',
				kind: 'select',
				options: ['female', 'male', 'other', 'unknown']
			},
			...fromTo('birthdate', 'Born')
		]
	},
	{
		type: 'Practitioner',
		label: 'Practitioner',
		plural: 'Practitioners',
		icon: UserRound,
		defaultSort: 'family',
		columns: [
			{ label: 'Name', value: (r) => formatName(f(r).name as HumanName[]), sort: 'family' },
			{
				label: 'Qualification',
				value: (r) => concept((f(r).qualification as { code?: unknown }[] | undefined)?.[0]?.code)
			},
			{ label: 'Active', value: (r) => active(f(r).active) }
		],
		search: [
			{ key: 'family', param: 'family', label: 'Family name', kind: 'text' },
			{ key: 'given', param: 'given', label: 'Given name', kind: 'text' }
		]
	},
	{
		type: 'Organization',
		label: 'Organization',
		plural: 'Organizations',
		icon: Building2,
		defaultSort: 'name',
		columns: [
			{ label: 'Name', value: (r) => text(f(r).name), sort: 'name' },
			{ label: 'Type', value: (r) => concept(f(r).type) },
			{ label: 'Active', value: (r) => active(f(r).active) }
		],
		search: [{ key: 'name', param: 'name', label: 'Name', kind: 'text' }]
	},
	{
		type: 'Encounter',
		label: 'Encounter',
		plural: 'Encounters',
		icon: Stethoscope,
		defaultSort: '-date',
		include: ['Encounter:subject'],
		patientParam: 'patient',
		columns: [
			{ label: 'Patient', value: (r) => ref(f(r).subject) },
			{ label: 'Class', value: (r) => concept(f(r).class) },
			{ label: 'Status', value: (r) => text(f(r).status), sort: 'status' },
			{ label: 'Started', value: (r) => start(f(r).actualPeriod ?? f(r).period), sort: 'date' }
		],
		search: [
			{
				key: 'status',
				param: 'status',
				label: 'Status',
				kind: 'select',
				options: [
					'planned',
					'in-progress',
					'on-hold',
					'discharged',
					'completed',
					'cancelled',
					'discontinued',
					'entered-in-error',
					'unknown'
				]
			},
			...fromTo('date', 'Started')
		]
	},
	{
		type: 'Observation',
		label: 'Observation',
		plural: 'Observations',
		icon: Thermometer,
		defaultSort: '-date',
		include: ['Observation:subject'],
		patientParam: 'patient',
		columns: [
			{ label: 'Patient', value: (r) => ref(f(r).subject) },
			{ label: 'Observation', value: (r) => concept(f(r).code) },
			{
				label: 'Value',
				value: (r) =>
					formatQuantity(f(r).valueQuantity as Quantity | undefined) ||
					concept(f(r).valueCodeableConcept) ||
					text(f(r).valueString)
			},
			{ label: 'Status', value: (r) => text(f(r).status), sort: 'status' },
			{ label: 'When', value: (r) => date(f(r).effectiveDateTime), sort: 'date' }
		],
		search: [
			{ key: 'code', param: 'code', label: 'Code', kind: 'text', placeholder: 'e.g. 8867-4' },
			{
				key: 'category',
				param: 'category',
				label: 'Category',
				kind: 'select',
				options: ['vital-signs', 'laboratory', 'social-history', 'imaging', 'survey', 'exam']
			},
			{
				key: 'status',
				param: 'status',
				label: 'Status',
				kind: 'select',
				options: [
					'registered',
					'preliminary',
					'final',
					'amended',
					'corrected',
					'cancelled',
					'entered-in-error',
					'unknown'
				]
			},
			...fromTo('date', 'Taken')
		]
	},
	{
		type: 'Condition',
		label: 'Condition',
		plural: 'Conditions',
		icon: Activity,
		defaultSort: '-recorded-date',
		include: ['Condition:subject'],
		patientParam: 'patient',
		columns: [
			{ label: 'Patient', value: (r) => ref(f(r).subject) },
			{ label: 'Condition', value: (r) => concept(f(r).code) },
			{ label: 'Clinical status', value: (r) => concept(f(r).clinicalStatus) },
			{ label: 'Recorded', value: (r) => date(f(r).recordedDate), sort: 'recorded-date' }
		],
		search: [
			{ key: 'code', param: 'code', label: 'Code', kind: 'text', placeholder: 'e.g. 64859006' },
			{
				key: 'clinical-status',
				param: 'clinical-status',
				label: 'Clinical status',
				kind: 'select',
				options: ['active', 'recurrence', 'relapse', 'inactive', 'remission', 'resolved', 'unknown']
			}
		]
	},
	{
		type: 'AllergyIntolerance',
		label: 'Allergy',
		plural: 'Allergies',
		icon: ShieldAlert,
		include: ['AllergyIntolerance:patient'],
		patientParam: 'patient',
		columns: [
			{ label: 'Patient', value: (r) => ref(f(r).patient) },
			{ label: 'Substance', value: (r) => concept(f(r).code) },
			{ label: 'Criticality', value: (r) => text(f(r).criticality), sort: 'criticality' },
			{ label: 'Clinical status', value: (r) => concept(f(r).clinicalStatus) },
			{ label: 'Recorded', value: (r) => date(f(r).recordedDate) }
		],
		search: [
			{
				key: 'criticality',
				param: 'criticality',
				label: 'Criticality',
				kind: 'select',
				options: ['low', 'high', 'unable-to-assess']
			},
			{
				key: 'clinical-status',
				param: 'clinical-status',
				label: 'Clinical status',
				kind: 'select',
				options: ['active', 'inactive', 'resolved']
			}
		]
	},
	{
		type: 'MedicationRequest',
		label: 'Medication request',
		plural: 'Medication requests',
		icon: Pill,
		defaultSort: '-authoredon',
		include: ['MedicationRequest:subject'],
		patientParam: 'patient',
		columns: [
			{ label: 'Patient', value: (r) => ref(f(r).subject) },
			{
				label: 'Medication',
				value: (r) => concept((f(r).medication as { concept?: unknown } | undefined)?.concept)
			},
			{ label: 'Status', value: (r) => text(f(r).status), sort: 'status' },
			{ label: 'Intent', value: (r) => text(f(r).intent) },
			{ label: 'Prescriber', value: (r) => ref(f(r).requester) },
			{ label: 'Authored', value: (r) => date(f(r).authoredOn), sort: 'authoredon' }
		],
		search: [
			{
				key: 'status',
				param: 'status',
				label: 'Status',
				kind: 'select',
				options: [
					'active',
					'on-hold',
					'ended',
					'stopped',
					'completed',
					'cancelled',
					'entered-in-error',
					'draft',
					'unknown'
				]
			},
			{
				key: 'intent',
				param: 'intent',
				label: 'Intent',
				kind: 'select',
				options: [
					'proposal',
					'plan',
					'order',
					'original-order',
					'reflex-order',
					'filler-order',
					'instance-order',
					'option'
				]
			}
		]
	},
	{
		type: 'DiagnosticReport',
		label: 'Diagnostic report',
		plural: 'Diagnostic reports',
		icon: FileText,
		defaultSort: '-date',
		include: ['DiagnosticReport:subject'],
		patientParam: 'patient',
		columns: [
			{ label: 'Patient', value: (r) => ref(f(r).subject) },
			{ label: 'Report', value: (r) => concept(f(r).code) },
			{ label: 'Category', value: (r) => concept(f(r).category) },
			{ label: 'Status', value: (r) => text(f(r).status), sort: 'status' },
			{ label: 'Effective', value: (r) => date(f(r).effectiveDateTime), sort: 'date' }
		],
		search: [
			{ key: 'code', param: 'code', label: 'Code', kind: 'text', placeholder: 'e.g. 24323-8' },
			{
				key: 'status',
				param: 'status',
				label: 'Status',
				kind: 'select',
				options: [
					'registered',
					'partial',
					'preliminary',
					'final',
					'amended',
					'corrected',
					'cancelled',
					'entered-in-error'
				]
			}
		]
	},
	{
		type: 'Procedure',
		label: 'Procedure',
		plural: 'Procedures',
		icon: Scissors,
		defaultSort: '-date',
		include: ['Procedure:subject'],
		patientParam: 'patient',
		columns: [
			{ label: 'Patient', value: (r) => ref(f(r).subject) },
			{ label: 'Procedure', value: (r) => concept(f(r).code) },
			{ label: 'Status', value: (r) => text(f(r).status), sort: 'status' },
			{ label: 'Performed', value: (r) => date(f(r).occurrenceDateTime), sort: 'date' }
		],
		search: [
			{ key: 'code', param: 'code', label: 'Code', kind: 'text', placeholder: 'e.g. 16310003' },
			{
				key: 'status',
				param: 'status',
				label: 'Status',
				kind: 'select',
				options: [
					'preparation',
					'in-progress',
					'not-done',
					'on-hold',
					'stopped',
					'completed',
					'entered-in-error',
					'unknown'
				]
			}
		]
	}
];

const byType = new Map(resourceTypes.map((t) => [t.type, t]));

/** The configuration for a resource type, or undefined when the app doesn't show it. */
export const resourceType = (type: string) => byType.get(type);
