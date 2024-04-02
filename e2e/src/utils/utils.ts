import { Locator, Page, expect } from "@playwright/test";

/**
 * Utility method to test the value of a standard text input
 */
export const expectInputValue = async (
  page: Page | Locator,
  label: string,
  expectedValue
) => {
  const value = await page.getByLabel(label).first().inputValue();

  expect(value).toEqual(expectedValue);
};

export const navigateInDashboard = async (
  page: Page,
  tabName: string,
  url: string
) => {
  await page.getByRole("link", { name: tabName }).click();
  await page.waitForURL(url);
};
