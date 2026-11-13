/**
 * The parts of FHIR R5 the app reads. Resources come back as JSON with many optional fields, so
 * these are deliberately loose: only what the app displays is typed.
 */
export interface Meta {
	versionId?: string;
	lastUpdated?: string;
	security?: Coding[];
}

export interface Resource {
	resourceType: string;
	id?: string;
	meta?: Meta;
	[key: string]: unknown;
}

export interface Coding {
	system?: string;
	code?: string;
	display?: string;
}

export interface CodeableConcept {
	coding?: Coding[];
	text?: string;
}

export interface HumanName {
	use?: string;
	text?: string;
	family?: string;
	given?: string[];
	prefix?: string[];
	suffix?: string[];
}

export interface Reference {
	reference?: string;
	display?: string;
}

export interface Quantity {
	value?: number;
	unit?: string;
	code?: string;
}

export interface Period {
	start?: string;
	end?: string;
}

export interface BundleLink {
	relation: string;
	url: string;
}

export interface BundleEntry<R extends Resource = Resource> {
	fullUrl?: string;
	resource?: R;
	request?: { method?: string; url?: string };
	response?: { status?: string };
}

export interface Bundle<R extends Resource = Resource> {
	resourceType: 'Bundle';
	type: string;
	total?: number;
	link?: BundleLink[];
	entry?: BundleEntry<R>[];
}

/** The resources in a bundle, skipping entries without one (e.g. deletions in a history). */
export const resourcesOf = <R extends Resource>(bundle: Bundle<R>): R[] =>
	(bundle.entry ?? []).flatMap((e) => (e.resource ? [e.resource] : []));
