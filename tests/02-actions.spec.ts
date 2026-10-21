import { test } from '@playwright/test';
import { HEATH } from './helpers';

/**
 * Module 2 – Actions (first version of the flow, actions only).
 * Flow: sign in and send a $5.00 payment to Ruthie Prosacco.
 * Actions used: fill, check, press, hover, click.
 * NOTE: this version has no assertions on purpose. It is improved in 03-assertions.spec.ts.
 */
test('ACT-01 send a payment using fill, check, press, hover and click', async ({ page }) => {
  await page.goto('/signin');
  await page.getByLabel('Username').fill(HEATH.username);           // fill(): plain text input
  await page.getByLabel('Password').fill(HEATH.password);           // fill(): no key-by-key handling needed
  await page.getByRole('checkbox', { name: 'Remember me' }).check(); // check(): checkbox
  await page.getByLabel('Password').press('Enter');                  // press(): submits the form with the keyboard

  await page.getByRole('link', { name: 'New' }).click();             // click(): navigation link
  await page.getByPlaceholder('Search...').fill('Ruthie');           // fill(): the search reacts to the input event
  await page.getByText('Ruthie Prosacco').hover();                   // hover(): highlights the contact row
  await page.getByText('Ruthie Prosacco').click();                   // click(): selects the contact

  await page.getByPlaceholder('Amount').fill('5');
  await page.getByPlaceholder('Add a note').fill('Workshop actions flow');
  await page.getByRole('button', { name: 'Pay' }).click();           // click(): submits the payment
});
