import { Page, expect } from "@playwright/test";
import { goTo } from "./navigation";
import { toYYYYMMDD, toDDMMYYYY } from "../utils/time";

/**
 * Creates a transporter company. Will make assertions.
 */
interface CreateTransporterCompanyProps {
  company: {
    email: string;
    name: string;
    phone: string;
    contact: string;
  };
  receipt?: {
    number: string;
    validityLimit: Date;
    department: string;
  };
}
export const createTransporterCompany = async (
  page: Page,
  { company, receipt }: CreateTransporterCompanyProps
) => {
  // Go to companies page
  await goTo(page, "/account/companies/create");

  // WARNING: page is different if one company has already been created
  // One more click is needed
  const createACompanyInput = page.getByRole("button", {
    name: "Créer un établissement"
  });
  if (await createACompanyInput.isVisible()) {
    await createACompanyInput.click();
  }

  await page
    .getByRole("button", { name: "Créer votre établissement" })
    .nth(1)
    .click();

  // Test submitting wihout any SIRET
  await page.getByRole("button", { name: "Valider" }).click();
  await expect(
    page.getByText("Vous devez entrer un SIRET composé de 14 chiffres")
  ).toBeVisible();

  // Generate a fake SIRET
  await page
    .getByRole("button", { name: "Obtenir un n° SIRET factice" })
    .click();
  // Catch the siret value
  const siretInput = page.locator("[name=siret]");
  await expect(siretInput).not.toBeEmpty(); // Wait for the input to be filled
  const siret = await siretInput.inputValue();
  await page.getByRole("button", { name: "Valider" }).click();

  // Fill in company info
  await page.getByLabel("Nom usuel (optionnel)").fill(company.name);
  await page.getByLabel("Personne à contacter").fill(company.contact);
  await page.getByLabel("Téléphone").fill(company.phone);
  await page.getByLabel("E-mail").fill(company.email);
  await page.getByText("Transporteur", { exact: true }).click();
  // Receipt
  if (receipt) {
    await page.getByLabel("Numéro de récépissé").fill(receipt.number);
    await page
      .getByLabel("Limite de validité")
      .fill(toYYYYMMDD(receipt.validityLimit));
    await page.getByPlaceholder("75").fill(receipt.department);
  }

  // Try submitting wihout checking mandatory box
  await page.getByRole("button", { name: "Créer" }).click();
  await expect(
    page.getByText(
      "Vous devez certifier être autorisé à créer ce compte pour votre entreprise"
    )
  ).toBeVisible();

  // Check box then try again
  await page
    .getByText(
      "Je certifie disposer du pouvoir pour créer un compte au nom de mon entreprise"
    )
    .click();
  await page.getByRole("button", { name: "Créer" }).click();

  // Check company infos are correct

  // There can by multiple companies in the page. Select the correct one
  const companyDiv = page
    .locator(`text=Établissement de test (${siret})`)
    .locator("..")
    .locator("..");

  await expect(companyDiv).toBeVisible();

  await expect(companyDiv.getByText(`Numéro SIRET${siret}`)).toBeVisible();
  await expect(
    companyDiv.getByText("Profil de l'entrepriseTransporteur")
  ).toBeVisible();
  await expect(companyDiv.getByText(`Nom Usuel${company.name}`)).toBeVisible();
  await expect(companyDiv.getByText("AdresseAdresse test")).toBeVisible();
  await expect(companyDiv.getByText("Code NAFXXXXX -")).toBeVisible();

  // Receipt info
  if (receipt) {
    await expect(companyDiv.getByTestId("receiptNumber")).toHaveText(
      receipt.number
    );
    await expect(companyDiv.getByTestId("receiptValidityLimit")).toHaveText(
      toDDMMYYYY(receipt.validityLimit)
    );
    await expect(companyDiv.getByTestId("receiptDepartment")).toHaveText(
      receipt.department
    );
  }

  // Check contact infos are correct
  await companyDiv.getByRole("button", { name: "Contact" }).click();
  await expect(
    companyDiv.getByText(`Prénom et nom du contact${company.contact}`)
  ).toBeVisible();
  await expect(
    companyDiv.getByText(`Email de contact${company.email}`)
  ).toBeVisible();
  await expect(
    companyDiv.getByText(`Téléphone de contact${company.phone}`)
  ).toBeVisible();
};
