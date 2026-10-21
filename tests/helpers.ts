import { expect, type Page, type APIRequestContext } from '@playwright/test';

export const API_URL = process.env.RWA_API_URL ?? 'http://localhost:3001';
/** Seeded user from data/database.json (all seeded users share the password "s3cret"). */
export const HEATH = { username: 'Heath93', password: 's3cret', fullName: 'Ted P' };

/** Signs in through the UI and waits for the home feed. */
export async function signIn(page: Page, username: string, password: string) {
  await page.goto('/signin');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
}

/** Precondition helper: creates a brand-new user (no bank account) through the API. */
export async function createUser(request: APIRequestContext, prefix = 'pw') {
  const username = `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const response = await request.post(`${API_URL}/users`, {
    data: { firstName: 'Playwright', lastName: 'Student', username, password: 's3cret', confirmPassword: 's3cret' },
  });
  await expect(response).toBeOK();
  return { username, password: 's3cret' };
}

/** "$1,509.53" -> 150953 (cents), to compare balances without floating-point errors. */
export function toCents(text: string | null): number {
  return Math.round(Number((text ?? '').replace(/[^0-9.-]/g, '')) * 100);
}
