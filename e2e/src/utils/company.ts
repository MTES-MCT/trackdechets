import { Page, expect } from "@playwright/test";
import { goTo } from "./navigation";
import { toYYYYMMDD, toDDMMYYYY } from "../utils/time";

type CompanyRole =
  | "Producteur de déchets (ou intermédiaire souhaitant avoir accès au bordereau)"
  | "Transporteur"
  | "Installation de collecte de déchets apportés par le producteur initial"
  | "Installation de traitement de VHU (casse automobile et/ou broyeur agréé)"
  | "Installation de Transit, regroupement ou tri de déchets"
  | "Installation de traitement"
  | "Négociant"
  | "Courtier";

interface Company {
  name: string;
  role: CompanyRole;
}

interface Receipt {
  number: string;
  validityLimit: Date;
  department: string;
}

type ReceiptType = "transporter" | "trader" | "broker";

interface Contact {
  name: string;
  email: string;
  phone: string;
  website?: string;
}

interface VHUAgrement {
  number: string;
  department: string;
}

/**
 * In the "/account/companies/create", returns the correct "Créer votre établissement" button index
 * matchin company role.
 */
export const getCreateButtonIndex = (companyRole: CompanyRole) => {
  // "La gestion des déchets fait partie de votre activité"
  if (
    [
      "Installation de collecte de déchets apportés par le producteur initial",
      "Installation de traitement de VHU (casse automobile et/ou broyeur agréé)",
      "Installation de Transit, regroupement ou tri de déchets",
      "Transporteur",
      "Installation de traitement",
      "Négociant",
      "Courtier"
    ].includes(companyRole)
  ) {
    return 1;
  }

  // "Vous produisez des déchets dans le cadre de votre activité"
  if (
    [
      "Producteur de déchets (ou intermédiaire souhaitant avoir accès au bordereau)"
    ].includes(companyRole)
  ) {
    return 0;
  }
};

/**
 * Will find the div corresponding to the targeted company, to be able to make assertions on
 * this specific company. Also enables to select chosen tab.
 */
type CompanyTab = "Information" | "Contact" | "Signature";
export const getCompanyDiv = async (
  page,
  { siret, tab = "Information" }: { siret: string; tab?: CompanyTab }
) => {
  // Go to companies creation page
  // await goTo(page, "/account/companies");

  // Use the search input to narrow down the results to the company only
  // await page.getByLabel("Filtrer mes établissements par nom, SIRET ou n° de TVA").fill(siret);

  // There can by multiple companies in the page. Select the correct one
  const companyDiv = page
    .locator(`text=Établissement de test (${siret})`)
    .locator("..")
    .locator("..");
  await expect(companyDiv).toBeVisible();

  // Select tab
  await companyDiv.getByRole("button", { name: tab }).click();

  return companyDiv;
};

/**
 * Will initiate the company creation process, that is, go to the creation page,
 * generate a test siret, and select the correct creation option. Will make assertions.
 */
export const generateSiretAndInitiateCompanyCreation = async (
  page,
  { companyRole }: { companyRole: CompanyRole }
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

  // "Créer votre établissement" button. Select correct one regarding company activity.
  const createButtonIndex = getCreateButtonIndex(companyRole);
  await page
    .getByRole("button", { name: "Créer votre établissement" })
    .nth(createButtonIndex)
    .click();

  // For waste producers...
  if (createButtonIndex === 0) {
    // ...help message should be visible (and closable)
    const helpMessage = page.getByRole("heading", {
      name: "Vous rencontrez des difficultés dans la création d'un établissement ?"
    });
    await expect(helpMessage).toBeVisible();
    await page.getByRole("button", { name: "Masquer le message" }).click();
    await expect(helpMessage).not.toBeVisible();
  }

  // Test submitting wihout a SIRET. Should display error message
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

  return { siret };
};

/**
 * Fills in generic company info.
 */
export const fillInGenericCompanyInfo = async (
  page,
  { company, contact }: { company: Company; contact: Contact }
) => {
  // Fill in company info
  await page.getByLabel("Nom usuel (optionnel)").fill(company.name);
  await page.getByLabel("Personne à contacter").fill(contact.name);
  await page.getByLabel("Téléphone").fill(contact.phone);
  await page.getByLabel("E-mail").fill(contact.email);

  // Select the role
  await page.getByText(company.role, { exact: true }).click();
};

/**
 * Fills receipt info. Can be transporter, trader, broker etc.
 */
export const fillInReceipt = async (
  page,
  { receipt }: { receipt: Receipt }
) => {
  await page.getByLabel("Numéro de récépissé").fill(receipt.number);
  await page
    .getByLabel("Limite de validité")
    .fill(toYYYYMMDD(receipt.validityLimit));
  await page.getByLabel("Département").fill(receipt.department);
};

/**
 * Fills in VHU broyeur agrement info
 */
export const fillInVHUAgrementBroyeur = async (
  page,
  { vhuAgrementBroyeur }: { vhuAgrementBroyeur: VHUAgrement }
) => {
  await page
    .locator('input[name="vhuAgrementBroyeurNumber"]')
    .fill(vhuAgrementBroyeur.number);
  await page
    .locator('input[name="vhuAgrementBroyeurDepartment"]')
    .fill(vhuAgrementBroyeur.department);
};

/**
 * Fills in VHU demolisseur agrement info
 */
export const fillInVHUAgrementDemolisseur = async (
  page,
  { vhuAgrementDemolisseur }: { vhuAgrementDemolisseur: VHUAgrement }
) => {
  await page
    .locator('input[name="vhuAgrementDemolisseurNumber"]')
    .fill(vhuAgrementDemolisseur.number);
  await page
    .locator('input[name="vhuAgrementDemolisseurDepartment"]')
    .fill(vhuAgrementDemolisseur.department);
};

/**
 * Submits the company creation form, and verifies that generic data is correct.
 */
export const submitAndVerifyGenericInfo = async (
  page,
  {
    company,
    contact,
    siret
  }: { company: Company; contact?: Contact; siret: string }
) => {
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

  // Check data
  const companyDiv = await getCompanyDiv(page, { siret });

  // Company info
  await expect(companyDiv.getByText(`Numéro SIRET${siret}`)).toBeVisible();
  await expect(
    companyDiv.getByText(`Profil de l'entreprise${company.role}`)
  ).toBeVisible();
  await expect(companyDiv.getByText(`Nom Usuel${company.name}`)).toBeVisible();
  await expect(companyDiv.getByText("AdresseAdresse test")).toBeVisible();
  await expect(companyDiv.getByText("Code NAFXXXXX -")).toBeVisible();

  // Contact info
  if (contact) {
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
  }

  return { siret };
};

/**
 * Enables to verify receipt data. Can be transporter, trader, broker etc.
 */
export const verifyReceipt = async (
  page,
  {
    siret,
    receipt,
    receiptType
  }: { siret: string; receipt: Receipt; receiptType: ReceiptType }
) => {
  // Select correct company & correct tab
  const companyDiv = await getCompanyDiv(page, { siret, tab: "Information" });

  // Check data
  const receiptDiv = companyDiv.locator(`#${receiptType}Receipt`);
  await expect(receiptDiv).toBeVisible();
  await expect(receiptDiv.getByTestId("receiptNumber")).toHaveText(
    receipt.number
  );
  await expect(receiptDiv.getByTestId("receiptValidityLimit")).toHaveText(
    toDDMMYYYY(receipt.validityLimit)
  );
  await expect(receiptDiv.getByTestId("receiptDepartment")).toHaveText(
    receipt.department
  );
};

export const verifyVHUAgrementBroyeur = async (
  page,
  {
    siret,
    vhuAgrementBroyeur
  }: { siret: string; vhuAgrementBroyeur: VHUAgrement }
) => {
  // Select correct company & correct tab
  const companyDiv = await getCompanyDiv(page, { siret, tab: "Information" });

  // Check data
  await expect(
    companyDiv.getByTestId("vhuAgrementBroyeur_agrementNumber")
  ).toHaveText(vhuAgrementBroyeur.number);
  await expect(
    companyDiv.getByTestId("vhuAgrementBroyeur_department")
  ).toHaveText(vhuAgrementBroyeur.department);
};

export const verifyVHUAgrementDemolisseur = async (
  page,
  {
    siret,
    vhuAgrementDemolisseur
  }: { siret: string; vhuAgrementDemolisseur: VHUAgrement }
) => {
  // Select correct company & correct tab
  const companyDiv = await getCompanyDiv(page, { siret, tab: "Information" });

  // Check data
  await expect(
    companyDiv.getByTestId("vhuAgrementDemolisseur_agrementNumber")
  ).toHaveText(vhuAgrementDemolisseur.number);
  await expect(
    companyDiv.getByTestId("vhuAgrementDemolisseur_department")
  ).toHaveText(vhuAgrementDemolisseur.department);
};

/**
 * Creates a waste managing company (like transporter or waste processor). Will make assertions.
 */
interface CreateWasteManagingCompanyProps {
  company: Company;
  contact: Contact;
  transporterReceipt?: Receipt;
  vhuAgrementBroyeur?: VHUAgrement;
  vhuAgrementDemolisseur?: VHUAgrement;
  traderReceipt?: Receipt;
  brokerReceipt?: Receipt;
}
export const createWasteManagingCompany = async (
  page: Page,
  {
    company,
    contact,
    transporterReceipt,
    vhuAgrementBroyeur,
    vhuAgrementDemolisseur,
    traderReceipt,
    brokerReceipt
  }: CreateWasteManagingCompanyProps
) => {
  // Initiate company creation
  const { siret } = await generateSiretAndInitiateCompanyCreation(page, {
    companyRole: company.role
  });

  // Fill in company info
  await fillInGenericCompanyInfo(page, { company, contact });

  // VHU
  if (vhuAgrementBroyeur)
    await fillInVHUAgrementBroyeur(page, { vhuAgrementBroyeur });
  if (vhuAgrementDemolisseur)
    await fillInVHUAgrementDemolisseur(page, { vhuAgrementDemolisseur });

  // Transporter receipt
  if (transporterReceipt)
    await fillInReceipt(page, { receipt: transporterReceipt });

  // Trader
  if (traderReceipt) await fillInReceipt(page, { receipt: traderReceipt });

  // Broker
  if (brokerReceipt) await fillInReceipt(page, { receipt: brokerReceipt });

  // Submit
  await submitAndVerifyGenericInfo(page, { company, contact, siret });

  // Verify VHU agrements
  if (vhuAgrementBroyeur)
    await verifyVHUAgrementBroyeur(page, { siret, vhuAgrementBroyeur });
  if (vhuAgrementDemolisseur)
    await verifyVHUAgrementDemolisseur(page, { siret, vhuAgrementDemolisseur });

  // Verify transporter receipt
  if (transporterReceipt)
    await verifyReceipt(page, {
      siret,
      receipt: transporterReceipt,
      receiptType: "transporter"
    });

  // Verify trader receipt
  if (traderReceipt)
    await verifyReceipt(page, {
      siret,
      receipt: traderReceipt,
      receiptType: "trader"
    });

  // Verify broker receipt
  if (brokerReceipt)
    await verifyReceipt(page, {
      siret,
      receipt: brokerReceipt,
      receiptType: "broker"
    });

  return { siret };
};

/**
 * Creates a producer company that produces DASRI. Will make assertions.
 */
export const createProducerWithDASRICompany = async (
  page: Page,
  { company }: { company: Company }
) => {
  // Initiate company creation
  const { siret } = await generateSiretAndInitiateCompanyCreation(page, {
    companyRole: company.role
  });

  // Fill in company info
  await page.getByLabel("Nom usuel").fill(company.name);

  // Company produces DASRI
  await page.getByText("Mon établissement produit des DASRI").click();

  // Submit
  await submitAndVerifyGenericInfo(page, { company, siret });

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
  // Click on company's signature tab
  const companyDiv = await getCompanyDiv(page, { siret, tab: "Signature" });

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
  // Click on company's contact tab
  const companyDiv = await getCompanyDiv(page, { siret, tab: "Contact" });

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
  await expect(
    await infoDiv
      .getByRole("link", { name: "fiche entreprise" })
      .getAttribute("href")
  ).toEqual(
    `${process.env.VITE_URL_SCHEME}://${process.env.VITE_HOSTNAME}/company/${siret}`
  );
};

/**
 * Renews the signature code. Will make assertions.
 */
export const renewCompanyAutomaticSignatureCode = async (page, { siret }) => {
  // Click on company's signature tab
  const companyDiv = await getCompanyDiv(page, { siret, tab: "Signature" });

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

  // Code should be brand new
  const newCode = await companyDiv.locator("#securityCode").textContent();
  expect(newCode).not.toEqual(code);

  await expect(
    companyDiv.getByText(`Code de signature${newCode}`)
  ).toBeVisible();

  return { code: newCode };
};
