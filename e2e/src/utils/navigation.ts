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
  // Click on button
  await page.getByRole("link", { name: linkLabel }).click();

  // Wait for loading to end
  await expect(page.getByTestId("loader")).not.toBeVisible();

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

/**
 * On the dashboard page, select a company, if not already selected
 */
export const selectCompany = async (page, siret) => {
  const companySelector = page.locator(".company-select").getByRole("combobox");

  const currentCompany = await companySelector.inputValue();
  if (!currentCompany.includes(siret)) {
    await companySelector.selectOption(siret);
  }
};

/**
 * Select a BSD menu
 */
export type BsdMenu =
  | "Tous les bordereaux"
  | "Brouillons"
  | "Pour action"
  | "Suivi"
  | "Archives"
  | "Toutes les révisions"
  | "À collecter"
  | "Collecté";
export const selectBsdMenu = async (page, menu: BsdMenu) => {
  const targetedTab = page
    .locator(".dashboard-tabs")
    .getByRole("link", { name: menu });
  const ariaCurrent = await targetedTab.getAttribute("aria-current");

  if (ariaCurrent !== "page") {
    await targetedTab.click();
  }
};
