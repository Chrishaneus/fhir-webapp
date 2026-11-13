import { expect, type Page } from '@playwright/test';
import { PASSWORD, users } from './fixtures';

/** Wait until the page has hydrated, so forms and links handled by the app work. */
export async function hydrated(page: Page) {
	await expect(page.locator('html[data-hydrated]')).toHaveCount(1);
}

export async function open(page: Page, path: string) {
	await page.goto(path);
	await hydrated(page);
}

/** Sign in through the sign-in page as one of the fixture users. */
export async function signIn(page: Page, role: keyof typeof users) {
	await open(page, '/login');
	await page.getByLabel('Username').fill(users[role]);
	await page.getByLabel('Password').fill(PASSWORD);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await page.waitForURL('**/dashboard');
	await hydrated(page);
}
