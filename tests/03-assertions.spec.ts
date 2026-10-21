import { test, expect } from '@playwright/test';
import { HEATH, toCents } from './helpers';

/**
 * Module 3 – Assertions. Same flow as ACT-01, now verifying the expected results.
 * Expected results of the test case:
 *   ER1 The user is signed in and the "Remember me" option is checked.
 *   ER2 Pay stays disabled until the amount and the note are entered.
 *   ER3 The amount field shows the formatted value "$5".
 *   ER4 The payment wizard opens on /transaction/new and the page title is the app title.
 *   ER5 After paying, the confirmation shows "Paid $5.00 for <note>".
 *   ER6 The balance decreases by exactly $5.00 and the contact search is no longer shown.
 */
test('AST-01 send a payment and verify state, text, value, page and balance', async ({ page }) => {
  const note = `Workshop assertions ${Date.now()}`;

  await page.goto('/signin');
  await expect(page).toHaveTitle('Cypress Real World App');                        // (c) page – ER4
  await page.getByLabel('Username').fill(HEATH.username);
  await page.getByLabel('Password').fill(HEATH.password);
  const remember = page.getByRole('checkbox', { name: 'Remember me' });
  await remember.check();
  await expect(remember).toBeChecked();                                            // (a) state – ER1
  await page.getByLabel('Password').press('Enter');

  const balance = page.getByTestId('sidenav-user-balance');
  await expect(page.getByTestId('sidenav-username')).toHaveText(`@${HEATH.username}`); // (b) text – ER1
  const before = toCents(await balance.textContent());

  await page.getByRole('link', { name: 'New' }).click();
  await expect(page).toHaveURL(/\/transaction\/new$/);                             // (c) page – ER4
  await page.getByPlaceholder('Search...').fill('Ruthie');
  await page.getByText('Ruthie Prosacco').hover();
  await page.getByText('Ruthie Prosacco').click();

  const pay = page.getByRole('button', { name: 'Pay' });
  await expect(pay).toBeDisabled();                                                // (a) state – ER2
  await page.getByPlaceholder('Amount').fill('5');
  await expect(page.getByPlaceholder('Amount')).toHaveValue('$5');                 // (b) value – ER3
  await page.getByPlaceholder('Add a note').fill(note);
  await expect(pay).toBeEnabled();                                                 // (a) state – ER2
  await pay.click();

  await expect(page.getByRole('heading', { name: /^Paid / })).toHaveText(`Paid $5.00 for ${note}`); // (b) text – ER5
  await expect(page.getByPlaceholder('Search...')).not.toBeVisible();              // (d) negative – ER6
  await test.info().attach('payment-confirmation', { body: await page.screenshot(), contentType: 'image/png' });

  await page.getByRole('link', { name: 'Return To Transactions' }).click();
  // (d) generic – ER6: toBe() is a generic matcher; expect.poll re-evaluates it until the sidebar refreshes.
  await expect.poll(async () => toCents(await balance.textContent())).toBe(before - 500);
});

test('AST-02 .not and expect.soft examples on the sign-in page', async ({ page }) => {
  await page.goto('/signin');
  // .not – negates any matcher: before any input no error alert is shown.
  await expect(page.getByTestId('signin-error')).not.toBeVisible();
  // expect.soft – records a failure but lets the test continue to check more things.
  await expect.soft(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await expect.soft(page.getByRole('link', { name: "Don't have an account? Sign Up" })).toBeVisible();
  // Stop here if any soft assertion failed.
  expect(test.info().errors).toHaveLength(0);
});
