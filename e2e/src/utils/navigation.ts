import { Page, expect } from "@playwright/test";

/**
 * Tests that clicking on a link redirects to the expected page, testing both URL & page label
 */
export const testNavigation = async (
  page: Page,
  { linkLabel, targetUrl, targetPageLabel }
) => {
  // Click on button
  await page.getByRole("link", { name: linkLabel }).click();

  // Check redirection
  await page.waitForURL(targetUrl);

  // Check page label
  await expect(
    page.getByRole("heading", { name: targetPageLabel })
  ).toBeVisible();

  return { linkLabel, targetUrl, targetPageLabel };
};
