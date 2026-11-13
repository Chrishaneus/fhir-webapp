import type { CodeableConcept, HumanName, Period, Quantity, Reference } from './types.js';

/** A person's name for display: its text, else "Given Family", preferring the official one. */
export function formatName(names: HumanName[] | undefined): string {
	if (!names?.length) return '';
	const name = names.find((n) => n.use === 'official') ?? names[0];
	if (name.text) return name.text;
	return [...(name.prefix ?? []), ...(name.given ?? []), name.family, ...(name.suffix ?? [])]
		.filter(Boolean)
		.join(' ');
}

/** A coded value for display: its text, else the first coding's display, else its code. */
export function formatConcept(concept: CodeableConcept | CodeableConcept[] | undefined): string {
	const first = Array.isArray(concept) ? concept[0] : concept;
	if (!first) return '';
	if (first.text) return first.text;
	const coding = first.coding?.find((c) => c.display) ?? first.coding?.[0];
	return coding?.display ?? coding?.code ?? '';
}

/** A reference for display: its display text, else "Type/id". */
export function formatReference(reference: Reference | undefined): string {
	return reference?.display ?? reference?.reference ?? '';
}

/** "Patient/123" → { type: 'Patient', id: '123' }; null for anything else (URLs, contained). */
export function parseReference(reference: string | undefined): { type: string; id: string } | null {
	const match = /^([A-Z][A-Za-z]+)\/([A-Za-z0-9\-.]{1,64})$/.exec(reference ?? '');
	return match ? { type: match[1], id: match[2] } : null;
}

export function formatQuantity(quantity: Quantity | undefined): string {
	if (quantity?.value === undefined) return '';
	return [quantity.value, quantity.unit ?? quantity.code].filter((v) => v !== undefined).join(' ');
}

const dateFormat = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });
const dateTimeFormat = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' });

/**
 * A FHIR date or dateTime for display. Partial dates ("2024", "2024-05") stay as they are; a
 * date without a time is shown without one, so no time zone can shift it to another day.
 */
export function formatDate(value: string | undefined): string {
	if (!value) return '';
	if (/^\d{4}(-\d{2})?$/.test(value)) return value;
	if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		const [y, m, d] = value.split('-').map(Number);
		return dateFormat.format(new Date(Date.UTC(y, m - 1, d, 12)));
	}
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? value : dateTimeFormat.format(date);
}

export function formatPeriod(period: Period | undefined): string {
	if (!period?.start && !period?.end) return '';
	if (!period.end) return `from ${formatDate(period.start)}`;
	if (!period.start) return `until ${formatDate(period.end)}`;
	return `${formatDate(period.start)} – ${formatDate(period.end)}`;
}

/** Age in whole years on `today` for a FHIR birth date; null when it can't be read. */
export function ageFrom(birthDate: string | undefined, today = new Date()): number | null {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate ?? '');
	if (!match) return null;
	const [, y, m, d] = match.map(Number);
	let age = today.getUTCFullYear() - y;
	const month = today.getUTCMonth() + 1;
	if (month < m || (month === m && today.getUTCDate() < d)) age -= 1;
	return age >= 0 ? age : null;
}

/** "2 minutes ago", "3 days ago": how long ago an instant was. */
export function timeAgo(value: string | undefined, now = Date.now()): string {
	if (!value) return '';
	const seconds = Math.round((new Date(value).getTime() - now) / 1000);
	if (Number.isNaN(seconds)) return '';
	const units: [Intl.RelativeTimeFormatUnit, number][] = [
		['year', 31_536_000],
		['month', 2_592_000],
		['day', 86_400],
		['hour', 3_600],
		['minute', 60]
	];
	const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
	for (const [unit, size] of units) {
		if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
	}
	return rtf.format(seconds, 'second');
}
