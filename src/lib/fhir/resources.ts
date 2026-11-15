import type { Component } from 'svelte';
import Activity from '@lucide/svelte/icons/activity';
import CalendarCheck from '@lucide/svelte/icons/calendar-check';
import CalendarClock from '@lucide/svelte/icons/calendar-clock';
import CalendarDays from '@lucide/svelte/icons/calendar-days';
import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';
import ClipboardList from '@lucide/svelte/icons/clipboard-list';
import FileStack from '@lucide/svelte/icons/file-stack';
import FolderHeart from '@lucide/svelte/icons/folder-heart';
import HeartHandshake from '@lucide/svelte/icons/heart-handshake';
import IdCard from '@lucide/svelte/icons/id-card';
import ListTodo from '@lucide/svelte/icons/list-todo';
import MapPin from '@lucide/svelte/icons/map-pin';
import MessageSquare from '@lucide/svelte/icons/message-square';
import MessageSquarePlus from '@lucide/svelte/icons/message-square-plus';
import NotebookText from '@lucide/svelte/icons/notebook-text';
import PillBottle from '@lucide/svelte/icons/pill-bottle';
import Receipt from '@lucide/svelte/icons/receipt';
import ScanLine from '@lucide/svelte/icons/scan-line';
import Send from '@lucide/svelte/icons/send';
import ShieldCheck from '@lucide/svelte/icons/shield-check';
import ShieldPlus from '@lucide/svelte/icons/shield-plus';
import Syringe from '@lucide/svelte/icons/syringe';
import Tablets from '@lucide/svelte/icons/tablets';
import Target from '@lucide/svelte/icons/target';
import TestTube from '@lucide/svelte/icons/test-tube';
import Utensils from '@lucide/svelte/icons/utensils';
import UsersRound from '@lucide/svelte/icons/users-round';
import Building2 from '@lucide/svelte/icons/building-2';
import FileText from '@lucide/svelte/icons/file-text';
import Pill from '@lucide/svelte/icons/pill';
import Scissors from '@lucide/svelte/icons/scissors';
import ShieldAlert from '@lucide/svelte/icons/shield-alert';
import Stethoscope from '@lucide/svelte/icons/stethoscope';
import Thermometer from '@lucide/svelte/icons/thermometer';
import UserRound from '@lucide/svelte/icons/user-round';
import Users from '@lucide/svelte/icons/users';
import {
	ageFrom,
	formatConcept,
	formatDate,
	formatName,
	formatPeriod,
	formatQuantity
} from './format.js';
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

/** The kinds of records, in the order the app lists them. */
export const resourceGroups = [
	{ id: 'people', label: 'People and places' },
	{ id: 'clinical', label: 'Clinical' },
	{ id: 'medications', label: 'Medications' },
	{ id: 'care', label: 'Care plans and orders' },
	{ id: 'scheduling', label: 'Scheduling' },
	{ id: 'documents', label: 'Documents and messages' },
	{ id: 'billing', label: 'Coverage and billing' }
] as const;

export type ResourceGroup = (typeof resourceGroups)[number]['id'];

export interface ResourceType {
	type: string;
	group: ResourceGroup;
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
	/**
	 * The fields that make a new resource a patient's, when it's started from their records.
	 * By default its `subject`.
	 */
	forPatient?: (patient: Reference) => Record<string, unknown>;
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
const period = (v: unknown) => formatPeriod(v as Period | undefined);
const first = (v: unknown) => (Array.isArray(v) ? v[0] : v);
/** A CodeableReference's concept, e.g. the medication a request is for. */
const conceptOf = (v: unknown) => concept((v as { concept?: unknown } | undefined)?.concept);
const quantity = (v: unknown) => formatQuantity(v as Quantity | undefined);
/** Money reads like a quantity, with the currency as its unit. */
const money = (v: unknown) => {
	const m = v as { value?: number; currency?: string } | undefined;
	return m ? formatQuantity({ value: m.value, unit: m.currency }) : '';
};

const fromTo = (param: string, label: string): SearchField[] => [
	{ key: 'from', param, label: `${label} from`, kind: 'date', prefix: 'ge' },
	{ key: 'to', param, label: `${label} until`, kind: 'date', prefix: 'le' }
];
const status = (options: string[]): SearchField => ({
	key: 'status',
	param: 'status',
	label: 'Status',
	kind: 'select',
	options
});
const activeField: SearchField = {
	key: 'active',
	param: 'active',
	label: 'Active',
	kind: 'select',
	options: ['true', 'false']
};

/** An appointment's patient: the participant who is one. */
const appointmentPatient = (r: Resource): Cell => {
	const participants = (f(r).participant as { actor?: Reference }[] | undefined) ?? [];
	return ref(participants.find((p) => p.actor?.reference?.startsWith('Patient/'))?.actor);
};

export const resourceTypes: ResourceType[] = [
	{
		type: 'Patient',
		group: 'people',
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
		group: 'people',
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
		group: 'people',
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
		group: 'clinical',
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
		group: 'clinical',
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
		group: 'clinical',
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
		group: 'clinical',
		label: 'Allergy',
		plural: 'Allergies',
		icon: ShieldAlert,
		include: ['AllergyIntolerance:patient'],
		patientParam: 'patient',
		forPatient: (patient) => ({ patient }),
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
		group: 'medications',
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
		group: 'clinical',
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
		group: 'clinical',
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
	},

	// People and places
	{
		type: 'PractitionerRole',
		group: 'people',
		label: 'Practitioner role',
		plural: 'Practitioner roles',
		icon: IdCard,
		include: ['PractitionerRole:practitioner', 'PractitionerRole:organization'],
		columns: [
			{ label: 'Role', value: (r) => concept(first(f(r).code)) },
			{ label: 'Practitioner', value: (r) => ref(f(r).practitioner) },
			{ label: 'Organization', value: (r) => ref(f(r).organization) },
			{ label: 'Active', value: (r) => active(f(r).active) }
		],
		search: [
			{ key: 'role', param: 'role', label: 'Role code', kind: 'text', placeholder: 'e.g. doctor' },
			activeField
		]
	},
	{
		type: 'RelatedPerson',
		group: 'people',
		label: 'Related person',
		plural: 'Related people',
		icon: HeartHandshake,
		defaultSort: 'name',
		include: ['RelatedPerson:patient'],
		patientParam: 'patient',
		forPatient: (patient) => ({ patient }),
		columns: [
			{ label: 'Name', value: (r) => formatName(f(r).name as HumanName[]), sort: 'name' },
			{ label: 'Patient', value: (r) => ref(f(r).patient) },
			{ label: 'Relationship', value: (r) => concept(f(r).relationship) },
			{ label: 'Active', value: (r) => active(f(r).active) }
		],
		search: [{ key: 'name', param: 'name', label: 'Family name', kind: 'text' }]
	},
	{
		type: 'Location',
		group: 'people',
		label: 'Location',
		plural: 'Locations',
		icon: MapPin,
		defaultSort: 'name',
		include: ['Location:managingOrganization'],
		columns: [
			{ label: 'Name', value: (r) => text(f(r).name), sort: 'name' },
			{ label: 'Type', value: (r) => concept(f(r).type) },
			{ label: 'Organization', value: (r) => ref(f(r).managingOrganization) },
			{ label: 'Status', value: (r) => text(f(r).status), sort: 'status' }
		],
		search: [
			{ key: 'name', param: 'name', label: 'Name', kind: 'text' },
			status(['active', 'suspended', 'inactive'])
		]
	},

	// Clinical
	{
		type: 'EpisodeOfCare',
		group: 'clinical',
		label: 'Episode of care',
		plural: 'Episodes of care',
		icon: FolderHeart,
		defaultSort: '-date',
		include: ['EpisodeOfCare:patient', 'EpisodeOfCare:managingOrganization'],
		patientParam: 'patient',
		forPatient: (patient) => ({ patient }),
		columns: [
			{ label: 'Patient', value: (r) => ref(f(r).patient) },
			{ label: 'Type', value: (r) => concept(f(r).type) },
			{ label: 'Organization', value: (r) => ref(f(r).managingOrganization) },
			{ label: 'Status', value: (r) => text(f(r).status), sort: 'status' },
			{ label: 'Started', value: (r) => start(f(r).period), sort: 'date' }
		],
		search: [
			status([
				'planned',
				'waitlist',
				'active',
				'onhold',
				'finished',
				'cancelled',
				'entered-in-error'
			]),
			...fromTo('date', 'Started')
		]
	},
	{
		type: 'FamilyMemberHistory',
		group: 'clinical',
		label: 'Family history',
		plural: 'Family histories',
		icon: UsersRound,
		include: ['FamilyMemberHistory:patient'],
		patientParam: 'patient',
		forPatient: (patient) => ({ patient }),
		columns: [
			{ label: 'Patient', value: (r) => ref(f(r).patient) },
			{ label: 'Relationship', value: (r) => concept(f(r).relationship) },
			{
				label: 'Conditions',
				value: (r) =>
					((f(r).condition as { code?: CodeableConcept }[] | undefined) ?? [])
						.map((c) => concept(c.code))
						.filter(Boolean)
						.join(', ')
			},
			{ label: 'Status', value: (r) => text(f(r).status), sort: 'status' },
			{ label: 'Recorded', value: (r) => date(f(r).date) }
		],
		search: [
			{
				key: 'relationship',
				param: 'relationship',
				label: 'Relationship code',
				kind: 'text',
				placeholder: 'e.g. MTH'
			},
			status(['partial', 'completed', 'entered-in-error', 'health-unknown'])
		]
	},
	{
		type: 'Immunization',
		group: 'clinical',
		label: 'Immunization',
		plural: 'Immunizations',
		icon: ShieldPlus,
		defaultSort: '-date',
		include: ['Immunization:patient'],
		patientParam: 'patient',
		forPatient: (patient) => ({ patient }),
		columns: [
			{ label: 'Patient', value: (r) => ref(f(r).patient) },
			{ label: 'Vaccine', value: (r) => concept(f(r).vaccineCode) },
			{ label: 'Status', value: (r) => text(f(r).status), sort: 'status' },
			{ label: 'Given', value: (r) => date(f(r).occurrenceDateTime), sort: 'date' }
		],
		search: [
			{
				key: 'vaccine',
				param: 'vaccine-code',
				label: 'Vaccine code',
				kind: 'text',
				placeholder: 'e.g. 140'
			},
			status(['completed', 'entered-in-error', 'not-done']),
			...fromTo('date', 'Given')
		]
	},
	{
		type: 'Specimen',
		group: 'clinical',
		label: 'Specimen',
		plural: 'Specimens',
		icon: TestTube,
		defaultSort: '-collected',
		include: ['Specimen:subject'],
		patientParam: 'patient',
		columns: [
			{ label: 'Patient', value: (r) => ref(f(r).subject) },
			{ label: 'Type', value: (r) => concept(f(r).type) },
			{
				label: 'Quantity',
				value: (r) => quantity((f(r).collection as { quantity?: unknown } | undefined)?.quantity)
			},
			{ label: 'Status', value: (r) => text(f(r).status), sort: 'status' },
			{
				label: 'Collected',
				value: (r) =>
					date((f(r).collection as { collectedDateTime?: unknown } | undefined)?.collectedDateTime),
				sort: 'collected'
			}
		],
		search: [
			{
				key: 'type',
				param: 'type',
				label: 'Type code',
				kind: 'text',
				placeholder: 'e.g. 119297000'
			},
			status(['available', 'unavailable', 'unsatisfactory', 'entered-in-error']),
			...fromTo('collected', 'Collected')
		]
	},
	{
		type: 'ImagingStudy',
		group: 'clinical',
		label: 'Imaging study',
		plural: 'Imaging studies',
		icon: ScanLine,
		defaultSort: '-started',
		include: ['ImagingStudy:subject'],
		patientParam: 'patient',
		columns: [
			{ label: 'Patient', value: (r) => ref(f(r).subject) },
			{ label: 'Study', value: (r) => text(f(r).description) },
			{
				label: 'Modality',
				value: (r) =>
					concept(f(r).modality) ||
					concept((first(f(r).series) as { modality?: unknown } | undefined)?.modality)
			},
			{ label: 'Status', value: (r) => text(f(r).status), sort: 'status' },
			{ label: 'Started', value: (r) => date(f(r).started), sort: 'started' }
		],
		search: [
			status(['registered', 'available', 'cancelled', 'entered-in-error', 'unknown', 'inactive']),
			...fromTo('started', 'Started')
		]
	},

	// Medications
	{
		type: 'Medication',
		group: 'medications',
		label: 'Medication',
		plural: 'Medications',
		icon: PillBottle,
		columns: [
			{ label: 'Medication', value: (r) => concept(f(r).code) },
			{ label: 'Form', value: (r) => concept(f(r).doseForm) },
			{ label: 'Status', value: (r) => text(f(r).status), sort: 'status' }
		],
		search: [
			{ key: 'code', param: 'code', label: 'Code', kind: 'text', placeholder: 'e.g. 197361' },
			status(['active', 'inactive', 'entered-in-error'])
		]
	},
	{
		type: 'MedicationStatement',
		group: 'medications',
		label: 'Medication statement',
		plural: 'Medication statements',
		icon: ClipboardCheck,
		defaultSort: '-effective',
		include: ['MedicationStatement:subject'],
		patientParam: 'patient',
		columns: [
			{ label: 'Patient', value: (r) => ref(f(r).subject) },
			{ label: 'Medication', value: (r) => conceptOf(f(r).medication) },
			{ label: 'Status', value: (r) => text(f(r).status), sort: 'status' },
			{
				label: 'Taken',
				value: (r) => date(f(r).effectiveDateTime) || start(f(r).effectivePeriod),
				sort: 'effective'
			}
		],
		search: [status(['recorded', 'entered-in-error', 'draft']), ...fromTo('effective', 'Taken')]
	},
	{
		type: 'MedicationDispense',
		group: 'medications',
		label: 'Medication dispense',
		plural: 'Medication dispenses',
		icon: Tablets,
		defaultSort: '-whenhandedover',
		include: ['MedicationDispense:subject'],
		patientParam: 'patient',
		columns: [
			{ label: 'Patient', value: (r) => ref(f(r).subject) },
			{ label: 'Medication', value: (r) => conceptOf(f(r).medication) },
			{ label: 'Quantity', value: (r) => quantity(f(r).quantity) },
			{ label: 'Status', value: (r) => text(f(r).status), sort: 'status' },
			{ label: 'Handed over', value: (r) => date(f(r).whenHandedOver), sort: 'whenhandedover' }
		],
		search: [
			status([
				'preparation',
				'in-progress',
				'cancelled',
				'on-hold',
				'completed',
				'entered-in-error',
				'unfulfilled',
				'declined',
				'unknown'
			]),
			...fromTo('whenhandedover', 'Handed over')
		]
	},
	{
		type: 'MedicationAdministration',
		group: 'medications',
		label: 'Medication administration',
		plural: 'Medication administrations',
		icon: Syringe,
		defaultSort: '-date',
		include: ['MedicationAdministration:subject'],
		patientParam: 'patient',
		columns: [
			{ label: 'Patient', value: (r) => ref(f(r).subject) },
			{ label: 'Medication', value: (r) => conceptOf(f(r).medication) },
			{
				label: 'Dose',
				value: (r) => quantity((f(r).dosage as { dose?: unknown } | undefined)?.dose)
			},
			{ label: 'Status', value: (r) => text(f(r).status), sort: 'status' },
			{
				label: 'Given',
				// R5 spells it with one "r".
				value: (r) => date(f(r).occurenceDateTime ?? f(r).occurrenceDateTime),
				sort: 'date'
			}
		],
		search: [
			status([
				'in-progress',
				'not-done',
				'on-hold',
				'completed',
				'entered-in-error',
				'stopped',
				'unknown'
			]),
			...fromTo('date', 'Given')
		]
	},

	// Care plans and orders
	{
		type: 'CarePlan',
		group: 'care',
		label: 'Care plan',
		plural: 'Care plans',
		icon: ClipboardList,
		include: ['CarePlan:subject'],
		patientParam: 'patient',
		columns: [
			{ label: 'Patient', value: (r) => ref(f(r).subject) },
			{ label: 'Title', value: (r) => text(f(r).title) },
			{ label: 'Status', value: (r) => text(f(r).status), sort: 'status' },
			{ label: 'Intent', value: (r) => text(f(r).intent) },
			{ label: 'Period', value: (r) => period(f(r).period) }
		],
		search: [
			status(['draft', 'active', 'on-hold', 'revoked', 'completed', 'entered-in-error', 'unknown'])
		]
	},
	{
		type: 'Goal',
		group: 'care',
		label: 'Goal',
		plural: 'Goals',
		icon: Target,
		defaultSort: '-start-date',
		include: ['Goal:subject'],
		patientParam: 'patient',
		columns: [
			{ label: 'Patient', value: (r) => ref(f(r).subject) },
			{ label: 'Goal', value: (r) => concept(f(r).description) },
			{ label: 'Status', value: (r) => text(f(r).lifecycleStatus), sort: 'lifecycle-status' },
			{ label: 'Starts', value: (r) => date(f(r).startDate), sort: 'start-date' }
		],
		search: [
			{
				key: 'status',
				param: 'lifecycle-status',
				label: 'Status',
				kind: 'select',
				options: [
					'proposed',
					'planned',
					'accepted',
					'active',
					'on-hold',
					'completed',
					'cancelled',
					'entered-in-error',
					'rejected'
				]
			},
			...fromTo('start-date', 'Starts')
		]
	},
	{
		type: 'ServiceRequest',
		group: 'care',
		label: 'Service request',
		plural: 'Service requests',
		icon: Send,
		defaultSort: '-authored',
		include: ['ServiceRequest:subject'],
		patientParam: 'patient',
		columns: [
			{ label: 'Patient', value: (r) => ref(f(r).subject) },
			{ label: 'Service', value: (r) => conceptOf(f(r).code) },
			{ label: 'Status', value: (r) => text(f(r).status), sort: 'status' },
			{ label: 'Requester', value: (r) => ref(f(r).requester) },
			{ label: 'Authored', value: (r) => date(f(r).authoredOn), sort: 'authored' }
		],
		search: [
			status(['draft', 'active', 'on-hold', 'revoked', 'completed', 'entered-in-error', 'unknown']),
			...fromTo('authored', 'Authored')
		]
	},
	{
		type: 'Task',
		group: 'care',
		label: 'Task',
		plural: 'Tasks',
		icon: ListTodo,
		defaultSort: '-authored-on',
		columns: [
			{ label: 'Task', value: (r) => text(f(r).description) },
			{ label: 'Status', value: (r) => text(f(r).status), sort: 'status' },
			{ label: 'Intent', value: (r) => text(f(r).intent), sort: 'intent' },
			{ label: 'Owner', value: (r) => ref(f(r).owner) },
			{ label: 'Authored', value: (r) => date(f(r).authoredOn), sort: 'authored-on' }
		],
		search: [
			status([
				'draft',
				'requested',
				'received',
				'accepted',
				'rejected',
				'ready',
				'cancelled',
				'in-progress',
				'on-hold',
				'failed',
				'completed',
				'entered-in-error'
			]),
			{
				key: 'intent',
				param: 'intent',
				label: 'Intent',
				kind: 'select',
				options: [
					'unknown',
					'proposal',
					'plan',
					'order',
					'original-order',
					'reflex-order',
					'filler-order',
					'instance-order',
					'option'
				]
			},
			...fromTo('authored-on', 'Authored')
		]
	},
	{
		type: 'NutritionOrder',
		group: 'care',
		label: 'Nutrition order',
		plural: 'Nutrition orders',
		icon: Utensils,
		include: ['NutritionOrder:subject'],
		patientParam: 'patient',
		columns: [
			{ label: 'Patient', value: (r) => ref(f(r).subject) },
			{
				label: 'Diet',
				value: (r) => concept((f(r).oralDiet as { type?: unknown } | undefined)?.type)
			},
			{ label: 'Status', value: (r) => text(f(r).status), sort: 'status' },
			{ label: 'Ordered', value: (r) => date(f(r).dateTime) }
		],
		search: [
			status(['draft', 'active', 'on-hold', 'revoked', 'completed', 'entered-in-error', 'unknown'])
		]
	},

	// Scheduling
	{
		type: 'Appointment',
		group: 'scheduling',
		label: 'Appointment',
		plural: 'Appointments',
		icon: CalendarCheck,
		defaultSort: '-date',
		include: ['Appointment:participant'],
		patientParam: 'patient',
		forPatient: (patient) => ({ participant: [{ actor: patient, status: 'needs-action' }] }),
		columns: [
			{ label: 'Patient', value: appointmentPatient },
			{ label: 'Description', value: (r) => text(f(r).description) },
			{ label: 'Status', value: (r) => text(f(r).status), sort: 'status' },
			{ label: 'Starts', value: (r) => date(f(r).start), sort: 'date' }
		],
		search: [
			status([
				'proposed',
				'pending',
				'booked',
				'arrived',
				'fulfilled',
				'cancelled',
				'noshow',
				'entered-in-error',
				'checked-in',
				'waitlist'
			]),
			...fromTo('date', 'Starts')
		]
	},
	{
		type: 'Schedule',
		group: 'scheduling',
		label: 'Schedule',
		plural: 'Schedules',
		icon: CalendarDays,
		columns: [
			{ label: 'Name', value: (r) => text(f(r).name) },
			{ label: 'For', value: (r) => ref(first(f(r).actor)) },
			{ label: 'Planning horizon', value: (r) => period(f(r).planningHorizon) },
			{ label: 'Active', value: (r) => active(f(r).active) }
		],
		search: [activeField]
	},
	{
		type: 'Slot',
		group: 'scheduling',
		label: 'Slot',
		plural: 'Slots',
		icon: CalendarClock,
		defaultSort: 'start',
		columns: [
			{ label: 'Starts', value: (r) => date(f(r).start), sort: 'start' },
			{ label: 'Ends', value: (r) => date(f(r).end) },
			{ label: 'Status', value: (r) => text(f(r).status), sort: 'status' },
			{ label: 'Schedule', value: (r) => ref(f(r).schedule) }
		],
		search: [
			status(['busy', 'free', 'busy-unavailable', 'busy-tentative', 'entered-in-error']),
			...fromTo('start', 'Starts')
		]
	},

	// Documents and messages
	{
		type: 'DocumentReference',
		group: 'documents',
		label: 'Document',
		plural: 'Documents',
		icon: FileStack,
		defaultSort: '-date',
		include: ['DocumentReference:subject'],
		patientParam: 'patient',
		columns: [
			{ label: 'Patient', value: (r) => ref(f(r).subject) },
			{ label: 'Type', value: (r) => concept(f(r).type) },
			{ label: 'Status', value: (r) => text(f(r).status), sort: 'status' },
			{ label: 'Document status', value: (r) => text(f(r).docStatus), sort: 'docstatus' },
			{ label: 'Date', value: (r) => date(f(r).date), sort: 'date' }
		],
		search: [
			{ key: 'type', param: 'type', label: 'Type code', kind: 'text', placeholder: 'e.g. 11506-3' },
			status(['current', 'superseded', 'entered-in-error']),
			...fromTo('date', 'Dated')
		]
	},
	{
		type: 'Composition',
		group: 'documents',
		label: 'Composition',
		plural: 'Compositions',
		icon: NotebookText,
		defaultSort: '-date',
		include: ['Composition:subject'],
		patientParam: 'patient',
		forPatient: (patient) => ({ subject: [patient] }),
		columns: [
			{ label: 'Patient', value: (r) => ref(first(f(r).subject)) },
			{ label: 'Title', value: (r) => text(f(r).title) },
			{ label: 'Type', value: (r) => concept(f(r).type) },
			{ label: 'Status', value: (r) => text(f(r).status), sort: 'status' },
			{ label: 'Date', value: (r) => date(f(r).date), sort: 'date' }
		],
		search: [
			{ key: 'type', param: 'type', label: 'Type code', kind: 'text', placeholder: 'e.g. 18842-5' },
			status([
				'registered',
				'partial',
				'preliminary',
				'final',
				'amended',
				'corrected',
				'appended',
				'cancelled',
				'entered-in-error',
				'deprecated',
				'unknown'
			]),
			...fromTo('date', 'Dated')
		]
	},
	{
		type: 'Communication',
		group: 'documents',
		label: 'Communication',
		plural: 'Communications',
		icon: MessageSquare,
		defaultSort: '-sent',
		include: ['Communication:subject', 'Communication:sender'],
		patientParam: 'patient',
		columns: [
			{ label: 'Patient', value: (r) => ref(f(r).subject) },
			{ label: 'Topic', value: (r) => concept(f(r).topic) },
			{ label: 'Sender', value: (r) => ref(f(r).sender) },
			{ label: 'Status', value: (r) => text(f(r).status), sort: 'status' },
			{ label: 'Sent', value: (r) => date(f(r).sent), sort: 'sent' }
		],
		search: [
			status([
				'preparation',
				'in-progress',
				'not-done',
				'on-hold',
				'stopped',
				'completed',
				'entered-in-error',
				'unknown'
			]),
			...fromTo('sent', 'Sent')
		]
	},
	{
		type: 'CommunicationRequest',
		group: 'documents',
		label: 'Communication request',
		plural: 'Communication requests',
		icon: MessageSquarePlus,
		defaultSort: '-authored',
		include: ['CommunicationRequest:subject', 'CommunicationRequest:requester'],
		patientParam: 'patient',
		columns: [
			{ label: 'Patient', value: (r) => ref(f(r).subject) },
			{ label: 'Category', value: (r) => concept(f(r).category) },
			{ label: 'Requester', value: (r) => ref(f(r).requester) },
			{ label: 'Status', value: (r) => text(f(r).status), sort: 'status' },
			{ label: 'Authored', value: (r) => date(f(r).authoredOn), sort: 'authored' }
		],
		search: [
			status(['draft', 'active', 'on-hold', 'revoked', 'completed', 'entered-in-error', 'unknown']),
			...fromTo('authored', 'Authored')
		]
	},

	// Coverage and billing
	{
		type: 'Coverage',
		group: 'billing',
		label: 'Coverage',
		plural: 'Coverages',
		icon: ShieldCheck,
		include: ['Coverage:beneficiary', 'Coverage:insurer'],
		patientParam: 'patient',
		forPatient: (patient) => ({ beneficiary: patient }),
		columns: [
			{ label: 'Patient', value: (r) => ref(f(r).beneficiary) },
			{ label: 'Type', value: (r) => concept(f(r).type) },
			{ label: 'Insurer', value: (r) => ref(f(r).insurer) },
			{ label: 'Kind', value: (r) => text(f(r).kind) },
			{ label: 'Status', value: (r) => text(f(r).status), sort: 'status' },
			{ label: 'Period', value: (r) => period(f(r).period) }
		],
		search: [status(['active', 'cancelled', 'draft', 'entered-in-error'])]
	},
	{
		type: 'Claim',
		group: 'billing',
		label: 'Claim',
		plural: 'Claims',
		icon: Receipt,
		defaultSort: '-created',
		include: ['Claim:patient', 'Claim:provider'],
		patientParam: 'patient',
		forPatient: (patient) => ({ patient }),
		columns: [
			{ label: 'Patient', value: (r) => ref(f(r).patient) },
			{ label: 'Type', value: (r) => concept(f(r).type) },
			{ label: 'Provider', value: (r) => ref(f(r).provider) },
			{
				label: 'Total',
				// Without a total, a single item's net is the total; several aren't added up here.
				value: (r) => {
					const items = (f(r).item as { net?: unknown }[] | undefined) ?? [];
					return money(f(r).total) || (items.length === 1 ? money(items[0].net) : '');
				}
			},
			{ label: 'Status', value: (r) => text(f(r).status), sort: 'status' },
			{ label: 'Created', value: (r) => date(f(r).created), sort: 'created' }
		],
		search: [
			status(['active', 'cancelled', 'draft', 'entered-in-error']),
			...fromTo('created', 'Created')
		]
	}
];

const byType = new Map(resourceTypes.map((t) => [t.type, t]));

/** The configuration for a resource type, or undefined when the app doesn't show it. */
export const resourceType = (type: string) => byType.get(type);
