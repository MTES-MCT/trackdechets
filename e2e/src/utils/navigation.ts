import { Page, expect } from "@playwright/test";
import { logScreenshot } from "./debug";

/**
 * Tests that clicking on a link redirects to the expected page, testing both URL & page label
 */
interface TestNavigationProps {
  linkLabel: string;
  targetUrl: string;
  targetPageLabel?: string;
}
export const testNavigation = async (
  page: Page,
  { linkLabel, targetUrl, targetPageLabel }: TestNavigationProps
) => {
  console.log("before ====================================")
  await logScreenshot(page);
  // Click on button
  await page.getByRole("link", { name: linkLabel }).click();

  // Check redirection
  console.log("after ====================================")
  await logScreenshot(page);
  await page.waitForURL(targetUrl);

  // Check page label
  if (targetPageLabel) {
    await expect(
      page.getByRole("heading", { name: targetPageLabel })
    ).toBeVisible();
  }

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

/**
 * Enables to test current URL
 */
export const checkCurrentURL = async (page, path) => {
  await expect(new URL(page.url()).pathname).toEqual(path);
};
