import { test, expect, type Page } from '@playwright/test';
import { createUser, signIn } from './helpers';

/**
 * Module 5 – State transition testing (ISTQB CTFL 4.0.1, 4.2.4).
 * Model: user onboarding (src/machines/userOnboardingMachine.ts + UserOnboardingContainer.tsx).
 *   S0 Signed out · S1 Welcome · S2 Create Bank Account · S3 Finished · S4 Home (onboarded)
 *   T1 S0 -sign in [no bank account]-> S1    T2 S1 -Next-> S2
 *   T3 S2 -Save [valid data] / create bank account-> S3    T4 S3 -Done-> S4
 *   T5 S4 -Logout-> S0    T6 S0 -sign in [has bank account]-> S4
 *   T7 S1 -Logout-> S0    T8 S2 -Logout-> S0    T9 S3 -Logout-> S0
 * Invalid transition attempted: Dismiss (Escape key) in S1, S2 and S3 — the dialog must stay open.
 */
const dialog = (page: Page) => page.getByRole('dialog');

async function expectState(page: Page, state: 'S0' | 'S1' | 'S2' | 'S3' | 'S4') {
  switch (state) {
    case 'S0':
      await expect(page).toHaveURL(/\/signin$/);
      await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
      break;
    case 'S1':
      await expect(dialog(page)).toBeVisible();
      await expect(dialog(page).getByRole('heading')).toHaveText('Get Started with Real World App');
      await expect(dialog(page).getByRole('button', { name: 'Next' })).toBeVisible();
      break;
    case 'S2':
      await expect(dialog(page).getByRole('heading')).toHaveText('Create Bank Account');
      await expect(dialog(page).getByPlaceholder('Bank Name')).toBeVisible();
      break;
    case 'S3':
      await expect(dialog(page).getByRole('heading')).toHaveText('Finished');
      await expect(dialog(page)).toContainText("You're all set!");
      break;
    case 'S4':
      await expect(dialog(page)).toBeHidden();
      await expect(page).toHaveURL('/');
      await expect(page.getByTestId('sidenav-user-balance')).toBeVisible();
      break;
  }
}

async function saveBankAccount(page: Page) {
  await dialog(page).getByPlaceholder('Bank Name').fill('Workshop Bank');
  await dialog(page).getByPlaceholder('Routing Number').fill('123456789');
  await dialog(page).getByPlaceholder('Account Number').fill('987654321');
  await dialog(page).getByRole('button', { name: 'Save' }).click();
}

test.describe('Module 5 – Onboarding state model', () => {
  test('ST-01 valid sequence S0→S1→S2→S3→S4→S0→S4 (T1–T6)', async ({ page, request }) => {
    const user = await createUser(request, 'st01');

    await signIn(page, user.username, user.password);                       // T1
    await expectState(page, 'S1');
    await dialog(page).getByRole('button', { name: 'Next' }).click();        // T2
    await expectState(page, 'S2');
    await saveBankAccount(page);                                              // T3 (action: account created)
    await expectState(page, 'S3');
    await test.info().attach('state-S3-finished', { body: await page.screenshot(), contentType: 'image/png' });
    await dialog(page).getByRole('button', { name: 'Done' }).click();        // T4
    await expectState(page, 'S4');

    await page.getByRole('link', { name: 'Bank Accounts' }).click();
    await expect(page.getByTestId('bankaccount-list')).toContainText('Workshop Bank'); // the T3 action persisted

    await page.getByRole('button', { name: 'Logout' }).click();             // T5
    await expectState(page, 'S0');
    await signIn(page, user.username, user.password);                       // T6 (guard: has bank account)
    await expectState(page, 'S4');
  });

  const dismissCases = [
    { from: 'S1' as const, steps: 0 },
    { from: 'S2' as const, steps: 1 },
  ];
  for (const c of dismissCases) {
    test(`ST-02 invalid transition: Dismiss (Escape) in ${c.from} keeps the onboarding dialog open`, async ({ page, request }) => {
      const user = await createUser(request, 'st02');
      await signIn(page, user.username, user.password);
      for (let i = 0; i < c.steps; i++) await dialog(page).getByRole('button', { name: 'Next' }).click();
      await expectState(page, c.from);

      await page.keyboard.press('Escape');                                    // invalid event for this state

      await expectState(page, c.from);                                        // state did not change
      await test.info().attach(`after-escape-in-${c.from}`, { body: await page.screenshot(), contentType: 'image/png' });
      // The page behind the modal stays inert: its links are hidden from the accessibility tree.
      await expect(page.getByRole('link', { name: 'Bank Accounts' })).toHaveCount(0);
    });
  }

  const logoutCases = [
    { id: 'T7', from: 'S1' as const, steps: 0 },
    { id: 'T8', from: 'S2' as const, steps: 1 },
  ];
  for (const c of logoutCases) {
    test(`ST-03 ${c.id} Logout from ${c.from} returns to S0`, async ({ page, request }) => {
      const user = await createUser(request, 'st03');
      await signIn(page, user.username, user.password);
      for (let i = 0; i < c.steps; i++) await dialog(page).getByRole('button', { name: 'Next' }).click();
      await expectState(page, c.from);
      await dialog(page).getByRole('button', { name: 'Logout' }).click();
      await expectState(page, 'S0');
    });
  }

  test('ST-03 T9 Logout from S3 returns to S0', async ({ page, request }) => {
    const user = await createUser(request, 'st03');
    await signIn(page, user.username, user.password);
    await dialog(page).getByRole('button', { name: 'Next' }).click();
    await saveBankAccount(page);
    await expectState(page, 'S3');
    await dialog(page).getByRole('button', { name: 'Logout' }).click();
    await expectState(page, 'S0');
  });
});
