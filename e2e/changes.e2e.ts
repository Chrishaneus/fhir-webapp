import { expect, test } from '@playwright/test';
import { PASSWORD } from './fixtures';
import { hydrated, open, signIn } from './helpers';

test('a clinician edits a patient, checked by the server, and the change is in the history', async ({
	page
}) => {
	await signIn(page, 'clinician');
	await open(page, '/resources/Patient/e2e-cy');
	await page.getByRole('link', { name: 'Edit' }).click();
	await hydrated(page);
	const editor = page.getByTestId('json-editor');
	const original = await editor.inputValue();

	await editor.fill(original.replace('"2001-01-05"', '"the fifth of January"'));
	await page.getByRole('button', { name: 'Validate' }).click();
	await expect(page.getByTestId('editor-problem')).toContainText('birthDate');

	await editor.fill(original.replace('"active": true', '"active": false'));
	await page.getByRole('button', { name: 'Validate' }).click();
	await expect(page.getByTestId('editor-valid')).toBeVisible();
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(page.getByTestId('saved')).toHaveText('Saved as version 2');
	await expect(page.getByTestId('summary')).toContainText('No');

	await page.getByRole('tab', { name: 'History (2)' }).click();
	await expect(page.getByTestId('version').first()).toContainText('Updated');
	await expect(page.getByTestId('version').first()).toContainText('active');
});

test('a save after someone else’s is refused, not overwritten', async ({ browser }) => {
	const mine = await browser.newPage();
	await signIn(mine, 'clinician');
	await open(mine, '/resources/Patient/e2e-bo/edit');

	const theirs = await browser.newPage();
	await signIn(theirs, 'admin');
	await open(theirs, '/resources/Patient/e2e-bo/edit');
	await theirs.getByRole('button', { name: 'Save' }).click();
	await expect(theirs.getByTestId('saved')).toBeVisible();

	await mine.getByRole('button', { name: 'Save' }).click();
	await expect(mine.getByTestId('editor-problem')).toContainText('Someone saved a newer version');
});

test('a clinician records an observation for a patient, and an admin deletes it', async ({
	page
}) => {
	await signIn(page, 'clinician');
	await open(page, '/resources/Observation?patient=e2e-cy');
	await page.getByRole('link', { name: 'New observation' }).click();
	await hydrated(page);
	const editor = page.getByTestId('json-editor');
	expect(await editor.inputValue()).toContain('"reference": "Patient/e2e-cy"');
	await editor.fill(
		JSON.stringify({
			resourceType: 'Observation',
			status: 'final',
			code: { coding: [{ system: 'http://loinc.org', code: '29463-7', display: 'Body weight' }] },
			subject: { reference: 'Patient/e2e-cy' },
			effectiveDateTime: '2026-06-01T10:00:00Z',
			valueQuantity: { value: 71, unit: 'kg' }
		})
	);
	await page.getByRole('button', { name: 'Create' }).click();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Body weight');
	const url = page.url();

	await page.context().clearCookies();
	await signIn(page, 'admin');
	await open(page, url);
	await page.getByRole('button', { name: 'Delete' }).click();
	await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
	await expect(page.getByTestId('deleted')).toContainText('was deleted');
	expect((await page.goto(url))!.status()).toBe(404);
});

test('an admin adds a clinician, who can then sign in as one', async ({ page }) => {
	const username = `e2e-nurse-${Date.now()}`;
	await signIn(page, 'admin');
	await open(page, '/admin/users');
	await page.getByLabel('Username').fill(username);
	await page.getByLabel('Password').fill(PASSWORD);
	await page.getByRole('button', { name: 'Add user' }).click();
	await expect(page.getByTestId('user-created')).toContainText(`${username} was added`);

	await page.context().clearCookies();
	await open(page, '/login');
	await page.getByLabel('Username').fill(username);
	await page.getByLabel('Password').fill(PASSWORD);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page.getByTestId('user-role')).toHaveText('Clinician');
});
