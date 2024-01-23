import { defineConfig, devices } from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./src",
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: true,
  /* Retry on CI only */
  retries: 0,
  /* Opt out of parallel tests on CI. */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Timeout */
  timeout: 90 * 1000,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://trackdechets.local",
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    /* Use headless mode if you need to debug with screenshots in the CI */
    headless: true,
    /* Manually setup dimensions or the window will be cropped */
    deviceScaleFactor: 1,
    viewport: {
      height: 1080,
      width: 1920
    }
  },
  /* Run before all tests */
  globalSetup: require.resolve("./src/global-setup"),
  /* Run after all tests */
  globalTeardown: require.resolve("./src/global-teardown"),
  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"]
      }
    }
  ],
  expect: {
    /* Maximum time expect() should wait for the condition to be met. */
    timeout: 90 * 1000
  }
});
