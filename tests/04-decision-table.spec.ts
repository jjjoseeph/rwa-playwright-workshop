import { test, expect } from '@playwright/test';
import { HEATH } from './helpers';

/**
 * Module 4 – Decision table testing (ISTQB CTFL 4.0.1, 4.2.3).
 * Business rule (sign-in, SignInForm.tsx + authMachine.ts):
 *   C1 Username is filled in
 *   C2 Password has at least 4 characters
 *   C3 Username and password belong to a registered user
 *   A1 "Username is required"   A2 "Password must contain at least 4 characters"
 *   A3 SIGN IN disabled          A4 alert "Username or password is invalid"   A5 user lands on the home page
 * One parameterized test per feasible column of the reduced table (5 of 5 = 100 % coverage).
 */
type Rule = {
  id: string;
  conditions: string;              // C1 C2 C3
  username: string;
  password: string;
  outcome: 'blocked' | 'rejected' | 'signedIn';
  messages?: string[];              // field validation messages expected (A1/A2)
};

const rules: Rule[] = [
  { id: 'R1', conditions: 'T T T', username: HEATH.username, password: HEATH.password, outcome: 'signedIn' },
  { id: 'R2', conditions: 'T T F', username: HEATH.username, password: 'wrong-pass', outcome: 'rejected' },
  { id: 'R3', conditions: 'T F –', username: HEATH.username, password: 'abc', outcome: 'blocked',
    messages: ['Password must contain at least 4 characters'] },
  { id: 'R4', conditions: 'F T –', username: '', password: HEATH.password, outcome: 'blocked',
    messages: ['Username is required'] },
  { id: 'R5', conditions: 'F F –', username: '', password: 'abc', outcome: 'blocked',
    messages: ['Username is required', 'Password must contain at least 4 characters'] },
];

test.describe('Module 4 – Sign-in decision table', () => {
  for (const rule of rules) {
    test(`DT-${rule.id} (C1 C2 C3 = ${rule.conditions}) → ${rule.outcome}`, async ({ page }) => {
      await page.goto('/signin');
      const signIn = page.getByRole('button', { name: 'Sign In' });

      await page.getByLabel('Username').fill(rule.username);
      await page.getByLabel('Password').fill(rule.password);
      await page.getByLabel('Password').press('Tab'); // leave the field so the form validates it

      if (rule.outcome === 'blocked') {
        // A1/A2 + A3: validation messages are shown and the form cannot be submitted.
        for (const message of rule.messages!) {
          await expect(page.getByText(message)).toBeVisible();
        }
        await expect(signIn).toBeDisabled();
        await expect(page).toHaveURL(/\/signin$/);
        return;
      }

      await expect(signIn).toBeEnabled();
      await signIn.click();

      if (rule.outcome === 'rejected') {
        // A4: the server rejects the credentials and the user stays on /signin.
        await expect(page.getByTestId('signin-error')).toHaveText('Username or password is invalid');
        await expect(page).toHaveURL(/\/signin$/);
      } else {
        // A5: the user is signed in and sees the home page with their own username.
        await expect(page).toHaveURL('/');
        await expect(page.getByTestId('sidenav-username')).toHaveText(`@${rule.username}`);
        await expect(page.getByTestId('signin-error')).toHaveCount(0);
      }
    });
  }
});
