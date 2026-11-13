import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { resourceType } from '#lib/fhir/resources.js';
import ResourceTable from './ResourceTable.svelte';

const observations = resourceType('Observation')!;
const row = (id: string, patient: string) => ({
	resourceType: 'Observation',
	id,
	status: 'final',
	code: { coding: [{ display: 'Heart rate' }] },
	subject: { reference: `Patient/${patient}` },
	valueQuantity: { value: 72, unit: '/min' }
});

describe('ResourceTable.svelte', () => {
	it('shows a row per resource, linking it and the resources it points at', async () => {
		render(ResourceTable, {
			columns: observations.columns,
			rows: [row('o1', 'p1'), row('o2', 'p2')],
			names: { 'Patient/p1': 'Jo Smith' }
		});
		await expect.element(page.getByTestId('resource-row').first()).toBeVisible();
		expect(page.getByTestId('resource-row').all()).toHaveLength(2);
		// The first text column opens the observation itself.
		await expect
			.element(page.getByRole('link', { name: 'Heart rate' }).first())
			.toHaveAttribute('href', '/resources/Observation/o1');
		// The patient by name when known, else by reference, linked either way.
		await expect
			.element(page.getByRole('link', { name: 'Jo Smith' }))
			.toHaveAttribute('href', '/resources/Patient/p1');
		await expect
			.element(page.getByRole('link', { name: 'Patient/p2' }))
			.toHaveAttribute('href', '/resources/Patient/p2');
		await expect.element(page.getByText('72 /min').first()).toBeVisible();
	});

	it('says when there is nothing', async () => {
		render(ResourceTable, { columns: observations.columns, rows: [], empty: 'Nothing matches.' });
		await expect.element(page.getByText('Nothing matches.')).toBeVisible();
	});
});
