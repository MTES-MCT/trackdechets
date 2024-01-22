import { Page, expect } from "@playwright/test";
import { goTo } from "./navigation";
import { toYYYYMMDD, toDDMMYYYY } from "../utils/time";

type CompanyRole =
  | "Transporteur"
  | "Installation de collecte de déchets apportés par le producteur initial";

interface Company {
  name: string;
  role: CompanyRole;
}

interface Receipt {
  number: string;
  validityLimit: Date;
  department: string;
}

interface Contact {
  name: string;
  email: string;
  phone: string;
  website?: string;
}

/**
 * Creates a waste managing company (like transporter or waste processor). Will make assertions.
 */
interface CreateWasteManagingCompanyProps {
  company: Company;
  contact: Contact;
  receipt?: Receipt;
}
export const createWasteManagingCompany = async (
  page: Page,
  { company, contact, receipt }: CreateWasteManagingCompanyProps
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

  // Test submitting wihout no SIRET. Should display error message
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
  await page.getByLabel("Personne à contacter").fill(contact.name);
  await page.getByLabel("Téléphone").fill(contact.phone);
  await page.getByLabel("E-mail").fill(contact.email);

  // Select the role
  await page.getByText(company.role, { exact: true }).click();

  // Receipt
  if (receipt) {
    await page.getByLabel("Numéro de récépissé").fill(receipt.number);
    await page
      .getByLabel("Limite de validité")
      .fill(toYYYYMMDD(receipt.validityLimit));
    await page.getByPlaceholder("75").fill(receipt.department);
  }

  // Try submitting wihout checking mandatory box. Should display error message
  await page.getByRole("button", { name: "Créer" }).click();
  await expect(
    page.getByText(
      "Vous devez certifier être autorisé à créer ce compte pour votre entreprise"
    )
  ).toBeVisible();

  // Check mandatory box then try again
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
    companyDiv.getByText(`Profil de l'entreprise${company.role}`)
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
    companyDiv.getByText(`Prénom et nom du contact${contact.name}`)
  ).toBeVisible();
  await expect(
    companyDiv.getByText(`Email de contact${contact.email}`)
  ).toBeVisible();
  await expect(
    companyDiv.getByText(`Téléphone de contact${contact.phone}`)
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

  // Try submitting wihout checking mandatory box. Should display error message
  await page.getByRole("button", { name: "Créer" }).click();
  await expect(
    page.getByText(
      "Vous devez certifier être autorisé à créer ce compte pour votre entreprise"
    )
  ).toBeVisible();

  // Check mandatory box then try again
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
 * Enables to add a partner to a company that can use the automatic signature feature.
 * Will make assertions.
 */
export const addAutomaticSignaturePartner = async (
  page,
  { siret, partnerSiret }
) => {
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

/**
 * Will update the company contact info. Will make assertions.
 */
export const updateCompanyContactInfo = async (
  page,
  { siret, contact }: { siret: string; contact: Contact }
) => {
  // Go to companies creation page
  await goTo(page, "/account/companies");

  // There can by multiple companies in the page. Select the correct one
  const companyDiv = page
    .locator(`text=Établissement de test (${siret})`)
    .locator("..")
    .locator("..");

  // Click on contact tab
  await companyDiv.getByRole("button", { name: "Contact" }).click();

  // Update the name
  await companyDiv
    .locator("div")
    .filter({ hasText: /^Prénom et nom du contactAjouter$/ })
    .locator("div")
    .nth(1)
    .click();
  await companyDiv
    .getByPlaceholder("Prénom et nom du contact")
    .fill(contact.name);
  await companyDiv.getByRole("button", { name: "Valider" }).click();
  await expect(
    companyDiv.getByText(`Prénom et nom du contact${contact.name}`)
  ).toBeVisible();

  // Update the email
  await companyDiv
    .locator("div")
    .filter({ hasText: /^Email de contactAjouter$/ })
    .locator("div")
    .nth(1)
    .click();
  // Test with invalid email. Should fail
  await companyDiv.getByPlaceholder("Email de contact").fill("user@mail");
  await companyDiv.getByRole("button", { name: "Valider" }).click();
  await expect(companyDiv.getByText("Email invalide")).toBeVisible();
  // Fill in correct email
  await companyDiv.getByPlaceholder("Email de contact").fill(contact.email);
  // TODO: bug: have to submit twice
  await companyDiv.getByRole("button", { name: "Valider" }).click();
  await companyDiv.getByRole("button", { name: "Valider" }).click();
  await expect(
    companyDiv.getByText(`Email de contact${contact.email}`)
  ).toBeVisible();

  // Update the phone number
  await companyDiv
    .locator("div")
    .filter({ hasText: /^Téléphone de contactAjouter$/ })
    .locator("div")
    .nth(1)
    .click();
  // Test with invalid phone number. Should fail
  await companyDiv.getByPlaceholder("Téléphone de contact").fill("1245");
  await companyDiv.getByRole("button", { name: "Valider" }).click();
  await expect(
    companyDiv.getByText("Merci de renseigner un numéro de téléphone valide")
  ).toBeVisible();
  // Fill in correct phone number
  await companyDiv.getByPlaceholder("Téléphone de contact").fill(contact.phone);
  // TODO: bug: have to submit twice
  await companyDiv.getByRole("button", { name: "Valider" }).click();
  await companyDiv.getByRole("button", { name: "Valider" }).click();
  await expect(
    companyDiv.getByText(`Téléphone de contact${contact.phone}`)
  ).toBeVisible();

  // Update the website URL
  await companyDiv
    .locator("div")
    .filter({ hasText: /^Site webAjouter$/ })
    .locator("div")
    .nth(1)
    .click();
  // Test with invalid URL. Should fail
  await companyDiv.getByPlaceholder("Site web").fill("www.invalid.com");
  await companyDiv.getByRole("button", { name: "Valider" }).click();
  await expect(companyDiv.getByText("URL invalide")).toBeVisible();
  // Fill in correct URL
  await companyDiv.getByPlaceholder("Site web").fill(contact.website);
  // TODO: bug: have to submit twice
  await companyDiv.getByRole("button", { name: "Valider" }).click();
  await companyDiv.getByRole("button", { name: "Valider" }).click();
  await expect(
    companyDiv.getByText(`Site web${contact.website}`)
  ).toBeVisible();

  // Info message with company link should be visible
  const infoDiv = page.getByText("Ces informations de contact");
  await expect(
    infoDiv.getByRole("link", { name: "fiche entreprise" })
  ).toBeVisible();
  console.log(
    "href",
    await infoDiv
      .getByRole("link", { name: "fiche entreprise" })
      .getAttribute("href")
  );
  await expect(
    await infoDiv
      .getByRole("link", { name: "fiche entreprise" })
      .getAttribute("href")
  ).toEqual(`http://trackdechets.local/company/${siret}`);
};

/**
 * Renews the signature code. Will make assertions.
 */
export const renewCompanyAutomaticSignatureCode = async (page, { siret }) => {
  // Go to companies creation page
  await goTo(page, "/account/companies");

  // There can by multiple companies in the page. Select the correct one
  const companyDiv = page
    .locator(`text=Établissement de test (${siret})`)
    .locator("..")
    .locator("..");

  // Click on signature tab
  await companyDiv.getByRole("button", { name: "Signature" }).click();

  // Current code
  const code = await companyDiv.locator("#securityCode").textContent();

  // Renew
  await companyDiv.getByText("Renouveler").click();
  // Warning message should pop
  await expect(
    companyDiv.getByText(
      "Attention, un nouveau code de signature va vous être attribué de façon aléatoire"
    )
  ).toBeVisible();
  await companyDiv.getByRole("button", { name: "Renouveler" }).click();
  // Wait for the loading to end
  await expect(
    companyDiv.getByText("Renouvellement en cours")
  ).not.toBeVisible();

  // Code should be fresh new
  const newCode = await companyDiv.locator("#securityCode").textContent();
  expect(newCode).not.toEqual(code);

  await expect(
    companyDiv.getByText(`Code de signature${newCode}Renouveler`)
  ).toBeVisible();

  return { code: newCode };
};
