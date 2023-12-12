import { Page, expect } from "@playwright/test";
import { logScreenshot } from "./debug";

/**
 * Tests that clicking on a link redirects to the expected page, testing both URL & page label
 */
export const testNavigation = async (
  page: Page,
  { linkLabel, targetUrl, targetPageLabel }
) => {
  // Click on button
  await page.getByRole("link", { name: linkLabel }).click();

  console.log(">> testNavigation", linkLabel, targetUrl, targetPageLabel);
  await logScreenshot(page);

  // Check redirection
  await page.waitForURL(targetUrl);

  // Check page label
  await expect(
    page.getByRole("heading", { name: targetPageLabel })
  ).toBeVisible();

  return { linkLabel, targetUrl, targetPageLabel };
};

/**
 * Goes to a given URL if not already there. Avoids useless loading times.
 */
export const goTo = async (page, path) => {
  const currentPath = new URL(page.url()).pathname;
  if (currentPath !== path) {
    await page.goto(path);
  }
};
