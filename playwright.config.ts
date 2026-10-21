import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for the Cypress Real World App (RWA).
 * Frontend: http://localhost:3000 · Backend API: http://localhost:3001
 * Start the app first (`yarn dev` in the RWA root) and then run `npx playwright test`.
 */
export default defineConfig({
  testDir: './tests',
  // The tests share one lowdb database, so they run one at a time.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: process.env.RWA_URL ?? 'http://localhost:3000',
    // RWA marks its elements with data-test="..." instead of data-testid.
    testIdAttribute: 'data-test',
    viewport: { width: 1280, height: 900 },
    screenshot: 'on',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } }],
});
