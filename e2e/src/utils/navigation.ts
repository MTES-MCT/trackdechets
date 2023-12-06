import { Page, expect } from "@playwright/test";

/**
 * Tests that clicking on a link redirects to the expected page, testing both URL & page label
 */
export const testClicRedirectsTo = async (
  page: Page,
  { linkLabel, url, pageLabel }
) => {
  // Click on button
  await page.getByRole("link", { name: linkLabel }).click();

  // Check redirection
  await page.waitForURL(url);

  // Check page label
  await expect(page.getByRole("heading", { name: pageLabel })).toBeVisible();

  return { linkLabel, url, pageLabel };
};
