import { Page, expect } from "@playwright/test";

/**
 * Fill targeted quick filter
 */
export type QuickFilterLabel =
  | "N° libre / BSD / contenant"
  | "N° de déchet / nom usuel"
  | "Raison sociale / SIRET"
  | "Numéro de CAP"
  | "Nom de chantier";
export const quickFilter = async (
  page: Page,
  { label, value }: { label: QuickFilterLabel; value: string }
) => {
  await page.getByLabel(label).fill(value);
};

/**
 * Assert the value of a given filter
 */
export const expectQuickFilterValue = async (
  page: Page,
  { label, value }: { label: QuickFilterLabel; value: string }
) => {
  const filterValue = await page.getByLabel(label).inputValue();
  expect(filterValue).toEqual(value);
};

/**
 * Assertions on the visible bsds in the dashboard page. Order is not checked.
 */
export const expectFilteredResults = async (
  page: Page,
  bsds: { readableId?: string; id: string }[]
) => {
  await expect(page.getByTestId("loader")).not.toBeVisible(); // Wait for loading to end

  // Make sure there are exactly X results
  const cards = page.locator(".bsd-card-list__item");
  await expect(cards).toHaveCount(bsds.length);

  // Make sure results are the one expected
  for (const bsd of bsds) {
    const bsdCard = page
      .locator(".bsd-card-list__item")
      .getByText(`N°: ${bsd.readableId ?? bsd.id}`);
    await expect(bsdCard).toBeVisible();
  }

  // If no bsd: assert special message is displayed
  if (!bsds.length) {
    await expect(page.getByText("Il n'y a aucun bordereau")).toBeVisible();
  }
};
