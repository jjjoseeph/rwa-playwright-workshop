import { test, expect } from '@playwright/test';
import { HEATH, signIn } from './helpers';

/**
 * Module 1 – Locators.
 * Four different elements of RWA located with four strategies:
 * getByRole, getByLabel, getByPlaceholder and getByTestId (+ getByText for a non-interactive item).
 */
test.describe('Module 1 – Locators', () => {
  test('LOC-01 sign-in form elements are found by role and label', async ({ page }) => {
    await page.goto('/signin');

    // Element 1 – Username field: a form control with a visible <label>, so getByLabel is the natural choice.
    const username = page.getByLabel('Username');
    // Element 2 – Sign In button: an interactive control, located by its ARIA role + accessible name.
    const signInButton = page.getByRole('button', { name: 'Sign In' });

    await expect(username).toBeVisible();
    await expect(signInButton).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('link', { name: "Don't have an account? Sign Up" })).toHaveAttribute('href', '/signup');
  });

  test('LOC-02 payment form and balance are found by placeholder, text and test id', async ({ page }) => {
    await signIn(page, HEATH.username, HEATH.password);

    // Element 3 – Account balance: dynamic text with no role or label; the app exposes an explicit test contract.
    const balance = page.getByTestId('sidenav-user-balance');
    await expect(balance).toHaveText(/^\$[\d,]+\.\d{2}$/);

    await page.getByRole('link', { name: 'New' }).click();
    // The contact search has no <label>, only a placeholder.
    await page.getByPlaceholder('Search...').fill('Ruthie');
    // Contact row: non-interactive text, so getByText is the recommended locator.
    await page.getByText('Ruthie Prosacco').click();

    // Element 4 – Amount field: no <label> either, so getByPlaceholder is the closest user-facing locator.
    const amount = page.getByPlaceholder('Amount');
    await expect(amount).toBeEditable();
    await expect(page.getByPlaceholder('Add a note')).toBeEditable();
  });

  test('LOC-03 strictness: an ambiguous locator throws instead of guessing', async ({ page }) => {
    await signIn(page, HEATH.username, HEATH.password);
    await expect(page.getByTestId('sidenav-user-balance')).toBeVisible();

    const anyButton = page.getByRole('button'); // matches many buttons on the home page
    // Multiple-element operations are allowed...
    expect(await anyButton.count()).toBeGreaterThan(1);
    // ...but an action that needs ONE target fails with a strict mode violation.
    await expect(anyButton.click({ timeout: 2_000 })).rejects.toThrow(/strict mode violation/);

    // The fix is a more specific locator, not .first(): role + accessible name identifies one element.
    await expect(page.getByRole('button', { name: 'Logout' })).toHaveCount(1);
  });
});
