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
  await page.waitForURL(`**${path}`);
  await expect(new URL(page.url()).pathname).toEqual(path);
};

/**
 * On the dashboard page, select a company, if not already selected
 */
export const selectCompany = async (page, siret) => {
  const companySwitcher = page
    .locator(".dashboard-tabs")
    .locator(".company-switcher");
  const currentCompany = companySwitcher.locator(
    ".company-switcher-item--current"
  );

  const currentCompanySiret = await currentCompany.textContent();

  // Current company is not the one we expect. Change it
  if (!currentCompanySiret.includes(siret)) {
    await companySwitcher.click();

    // Because there can be 10+ companies, use the search input
    await companySwitcher
      .getByRole("searchbox", { name: "Rechercher" })
      .fill(siret);
    await companySwitcher
      .locator("div")
      .filter({ hasText: siret })
      .nth(2)
      .click();
  }
};

/**
 * Select a BSD menu
 */
export type BsdMenu =
  | "Tous les bordereaux"
  | "Brouillons"
  | "Pour action"
  | "Suivis"
  | "Archives"
  | "En cours"
  | "Révisés"
  | "À collecter"
  | "Collectés";

const BsdMenuUrls = {
  "Tous les bordereaux": "/bsds/all",
  Brouillons: "/bsds/drafts",
  "Pour action": "/bsds/act",
  Suivis: "/bsds/follow",
  Archives: "/bsds/history",
  "En cours": "/bsds/to-review",
  Révisés: "/bsds/reviewed",
  "À collecter": "/transport/to-collect",
  Collectés: "/transport/collected"
};
export const selectBsdMenu = async (page, menu: BsdMenu) => {
  // Don't navigate if already there
  const currentPath = new URL(page.url()).pathname;
  if (currentPath.endsWith(BsdMenuUrls[menu])) return;

  const targetedTab = page
    .locator(".dashboard-tabs")
    .getByRole("link", { name: menu, exact: true });
  const ariaCurrent = await targetedTab.getAttribute("aria-current");

  if (ariaCurrent !== "page") {
    await targetedTab.click();
  }

  await page.waitForURL(`**${BsdMenuUrls[menu]}`);
};
