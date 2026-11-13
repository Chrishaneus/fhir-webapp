import { expect, test } from '@playwright/test';
import { heartRates } from './fixtures';
import { open, signIn } from './helpers';

test.beforeEach(async ({ page }) => {
	await signIn(page, 'viewer');
});

test('the dashboard counts what the server holds', async ({ page }) => {
	const count = async (type: string) =>
		Number(
			(
				await page
					.locator(`[data-testid=count][data-type=${type}] [data-testid=count-value]`)
					.innerText()
			).replace(/\D/g, '')
		);
	// The fixtures, and maybe more that other tests created.
	expect(await count('Patient')).toBeGreaterThanOrEqual(3);
	expect(await count('Observation')).toBeGreaterThanOrEqual(3);
	await expect(page.getByTestId('change').first()).toBeVisible();
});

test('patients can be searched and sorted', async ({ page }) => {
	await open(page, '/resources/Patient');
	await page.getByLabel('Family name').fill('Quillf');
	await page.getByRole('button', { name: 'Search' }).click();
	await expect(page).toHaveURL(/family=Quillf/);
	await expect(page.getByTestId('page-range')).toHaveText('1–2 of 2');

	await page.getByLabel('Gender').selectOption('male');
	await page.getByRole('button', { name: 'Search' }).click();
	await expect(page.getByTestId('resource-row')).toHaveCount(1);
	await expect(page.getByTestId('resource-row')).toContainText('Bo Quillfeather');

	// Clear, then sort by birth date, youngest first.
	await page.getByRole('link', { name: 'Clear' }).click();
	// Wait for Clear's page before typing, or the new page would empty the field again.
	await expect(page).toHaveURL(/\/resources\/Patient\?$/);
	await expect(page.getByLabel('Family name')).toHaveValue('');
	await page.getByLabel('Family name').fill('Quillf');
	await page.getByRole('button', { name: 'Search' }).click();
	await page.getByTestId('sort-birthdate').click();
	await page.getByTestId('sort-birthdate').click();
	await expect(page).toHaveURL(/sort=-birthdate/);
	await expect(page.getByTestId('resource-row').first()).toContainText('Ada Quillfeather');
});

test('a patient’s page shows their records, and the list of them', async ({ page }) => {
	await open(page, '/resources/Patient');
	await page.getByLabel('Family name').fill('Quillf');
	await page.getByLabel('Given name').fill('Ada');
	await page.getByRole('button', { name: 'Search' }).click();
	await page.getByRole('link', { name: 'Ada Quillfeather' }).click();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ada Quillfeather');
	await expect(page.getByTestId('summary')).toContainText('Apr 12, 1985');

	await page.getByRole('tab', { name: 'Records' }).click();
	const observations = page.locator('[data-testid=record-count][data-type=Observation]');
	await expect(observations).toContainText(String(heartRates.length));
	await observations.click();
	await expect(page).toHaveURL(/\/resources\/Observation\?patient=e2e-ada$/);
	await expect(page.getByTestId('patient-filter')).toContainText('Ada Quillfeather');
	// Newest first, with the values and the patient's name.
	const rows = page.getByTestId('resource-row');
	await expect(rows).toHaveCount(heartRates.length);
	await expect(rows.first()).toContainText(`${heartRates.at(-1)!.value} /min`);
	await expect(rows.first()).toContainText('Ada Quillfeather');

	// Within her records, filter by date.
	await page.getByLabel('Taken from').fill('2026-02-01');
	await page.getByRole('button', { name: 'Search' }).click();
	await expect(page).toHaveURL(/patient=e2e-ada/);
	await expect(rows).toHaveCount(2);
});

test('a resource shows its JSON, and an unknown one is not found', async ({ page }) => {
	await open(page, '/resources/Observation/e2e-hr-1');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Heart rate');
	await page.getByRole('tab', { name: 'FHIR JSON' }).click();
	await expect(page.getByTestId('resource-json')).toContainText('"id": "e2e-hr-1"');
	await page.getByTestId('summary').getByRole('link', { name: 'Ada Quillfeather' }).isVisible();

	const missing = await page.goto('/resources/Patient/e2e-nobody');
	expect(missing!.status()).toBe(404);
	expect((await page.goto('/resources/Bundle'))!.status()).toBe(404);
});
