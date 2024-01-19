import { Page, expect } from "@playwright/test";
import { goTo } from "./navigation";
import { toYYYYMMDD, toDDMMYYYY } from "../utils/time";

interface Company {
  name: string;
  email: string;
  phone: string;
  contact: string;
}

interface Receipt {
  number: string;
  validityLimit: Date;
  department: string;
}

/**
 * Creates a transporter company. Will make assertions.
 */
interface CreateTransporterCompanyProps {
  company: Company;
  receipt?: Receipt;
}
export const createTransporterCompany = async (
  page: Page,
  { company, receipt }: CreateTransporterCompanyProps
) => {
  // Go to companies creation page
  await goTo(page, "/account/companies/create");

  // WARNING: page is different if one company has already been created
  // One more click is needed
  const createACompanyInput = page.getByRole("button", {
    name: "Créer un établissement"
  });
  if (await createACompanyInput.isVisible()) {
    await createACompanyInput.click();
  }

  // Button correponds to "La gestion des déchets fait partie de votre activité"
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

  return { siret };
};

/**
 * Creates a producer company that produces DASRI. Will make assertions.
 */
export const createProducerWithDASRICompany = async (
  page: Page,
  { company }: { company: { name: string } }
) => {
  // Go to companies creation page
  await goTo(page, "/account/companies/create");

  // WARNING: page is different if one company has already been created
  // One more click is needed
  const createACompanyInput = page.getByRole("button", {
    name: "Créer un établissement"
  });
  if (await createACompanyInput.isVisible()) {
    await createACompanyInput.click();
  }

  // Button correponds to "Vous produisez des déchets dans le cadre de votre activité"
  await page
    .getByRole("button", { name: "Créer votre établissement" })
    .nth(0)
    .click();

  // Help message should be visible (and closable)
  const helpMessage = page.getByRole("heading", {
    name: "Vous rencontrez des difficultés dans la création d'un établissement ?"
  });
  await expect(helpMessage).toBeVisible();
  await page.getByRole("button", { name: "Masquer le message" }).click();
  await expect(helpMessage).not.toBeVisible();

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
  await page.getByLabel("Nom usuel").fill(company.name);

  // Company produces DASRI
  await page.getByText("Mon établissement produit des DASRI").click();

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
    companyDiv.getByText(
      "Profil de l'entrepriseProducteur de déchets (ou intermédiaire souhaitant avoir accès au bordereau)"
    )
  ).toBeVisible();
  await expect(companyDiv.getByText(`Nom Usuel${company.name}`)).toBeVisible();

  return { siret };
};

/**
 * Enables to add a partner to a company that can use the auomatic signature feature.
 * Will make assertions.
 */
export const addAutomaticSignaturePartner = async (
  page,
  { siret, partnerSiret }
) => {
  console.log("siret", siret, "partnerSiret", partnerSiret);

  // Go to companies creation page
  await goTo(page, "/account/companies");

  // There can by multiple companies in the page. Select the correct one
  const companyDiv = page
    .locator(`text=Établissement de test (${siret})`)
    .locator("..")
    .locator("..");

  // Click on signature tab
  await companyDiv.getByRole("button", { name: "Signature" }).click();

  // Let's add a partner
  await companyDiv
    .locator("div")
    .filter({ hasText: "Signature automatique (annexe 1)" })
    .locator("div")
    .nth(1)
    .click();
  await companyDiv.getByPlaceholder("SIRET").fill(partnerSiret);
  await companyDiv.getByRole("button", { name: "Rechercher" }).click();
  // Partner company should pop in the results
  await expect(
    companyDiv.getByText(`Établissement de test - ${partnerSiret}Ajouter`)
  ).toBeVisible();
  await companyDiv.getByRole("button", { name: "Ajouter" }).click();

  // Click on other tab, then come back
  await companyDiv.getByRole("button", { name: "Membres" }).click();
  await companyDiv.getByRole("button", { name: "Signature" }).click();

  // We should see the partner company
  await expect(
    companyDiv.getByText(
      `Signature automatique (annexe 1)Établissement de test (${partnerSiret})Modifier`
    )
  ).toBeVisible();
};
