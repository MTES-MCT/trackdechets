import { Page, expect } from "@playwright/test";

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
  // Click on button
  await page.getByRole("link", { name: linkLabel }).click();

  // Check redirection
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
  console.log("currentPath", currentPath, "path", path);
  if (currentPath !== path) {
    await page.goto(path);
  }
};
