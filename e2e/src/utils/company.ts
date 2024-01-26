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
  | "Courtier"
  | "Crématorium"
  | "Entreprise de travaux amiante";

interface Company {
  name: string;
  roles: CompanyRole[];
  producesDASRI?: boolean;
}

interface Receipt {
  type: "transporter" | "trader" | "broker";
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

interface VHUAgrement {
  type: "Broyeur" | "Demolisseur";
  number: string;
  department: string;
}

interface AmianteCertification {
  number: string;
  validityLimit: Date;
  organisation: "QUALIBAT" | "AFNOR Certification" | "GLOBAL CERTIFICATION";
}

/**
 * In the "/account/companies/create", returns the correct "Créer votre établissement" button index
 * matching company role.
 */
export const getCreateButtonIndex = (roles: CompanyRole[]) => {
  // "La gestion des déchets fait partie de votre activité"
  for (const role of roles) {
    if (
      [
        "Installation de collecte de déchets apportés par le producteur initial",
        "Installation de traitement de VHU (casse automobile et/ou broyeur agréé)",
        "Installation de Transit, regroupement ou tri de déchets",
        "Transporteur",
        "Installation de traitement",
        "Négociant",
        "Courtier",
        "Crématorium",
        "Entreprise de travaux amiante"
      ].includes(role)
    ) {
      return 1;
    }
  }

  // "Vous produisez des déchets dans le cadre de votre activité"
  for (const role of roles) {
    if (
      [
        "Producteur de déchets (ou intermédiaire souhaitant avoir accès au bordereau)"
      ].includes(role)
    ) {
      return 0;
    }
  }

  // "Transporteur hors France, Non-French carrier"
  return 2;
};

/**
 * Will find the div corresponding to the targeted company, to be able to make assertions on
 * this specific company. Also enables to select chosen company sub-tab.
 */
type CompanyTab =
  | "Information"
  | "Contact"
  | "Signature"
  | "Avancé"
  | "Membres";
export const getCompanyDiv = async (
  page,
  {
    siret,
    name = "Établissement de test",
    tab = "Information"
  }: { siret: string; name?: string; tab?: CompanyTab }
) => {
  // Use the search input to narrow down the results to the company only
  // (and avoid dealing with pagination)
  await page
    .getByLabel("Filtrer mes établissements par nom, SIRET ou n° de TVA")
    .fill(siret);

  // Wait for loading to end
  await expect(page.getByTestId("loader")).not.toBeVisible();

  // Select the company div
  const companyDiv = page.locator(`text=${name} (${siret})`).locator("../..");
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
  { roles }: { roles: CompanyRole[] }
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
  const createButtonIndex = getCreateButtonIndex(roles);
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
  { company, contact }: { company: Company; contact?: Contact }
) => {
  // Fill in company info
  await page.getByLabel("Nom usuel (optionnel)").fill(company.name);

  // Company produces DASRI
  if (company.producesDASRI)
    await page.getByText("Mon établissement produit des DASRI").click();

  // Contact info
  if (contact) {
    await page.getByLabel("Personne à contacter").fill(contact.name);
    await page.getByLabel("Téléphone").fill(contact.phone);
    await page.getByLabel("E-mail").fill(contact.email);
  }

  // Select the role
  for (const role of company.roles)
    await page.getByText(role, { exact: true }).click();
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
 * Fills in amiante certification info. Will also try to submit the form without
 * the certification info, to see if it fails correctly
 */
export const fillInAmianteCertification = async (
  page,
  { certification }: { certification: AmianteCertification }
) => {
  // Certifications inputs should appear
  const certificationsDiv = page
    .getByText("Entreprise de travaux amiante")
    .locator("../../../../../..");
  await expect(certificationsDiv).toBeVisible();

  // Check amiante boxes
  await certificationsDiv
    .getByText("Travaux relevant de la sous-section 4")
    .click();
  await certificationsDiv
    .getByText("Travaux relevant de la sous-section 3")
    .click();

  // Try to create the company. Should fail
  await page.getByRole("button", { name: "Créer" }).click();
  await expect(
    certificationsDiv.getByText("Champ obligatoire").first()
  ).toBeVisible();
  await expect(
    certificationsDiv.getByText("Champ obligatoire").nth(1)
  ).toBeVisible();
  await expect(
    certificationsDiv.getByText("Champ obligatoire").nth(2)
  ).toBeVisible();

  // Fill in the info
  await certificationsDiv
    .getByLabel("N° certification")
    .fill(certification.number);
  await certificationsDiv
    .getByLabel("Date de validité")
    .fill(toYYYYMMDD(certification.validityLimit));
  await certificationsDiv
    .getByLabel("Organisme", { exact: true })
    .selectOption(certification.organisation);
};

/**
 * Fills in VHU agrement info
 */
export const fillInVHUAgrement = async (
  page,
  { agrement }: { agrement: VHUAgrement }
) => {
  await page
    .locator(`input[name="vhuAgrement${agrement.type}Number"]`)
    .fill(agrement.number);
  await page
    .locator(`input[name="vhuAgrement${agrement.type}Department"]`)
    .fill(agrement.department);
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
  const rolesDiv = companyDiv.getByText("Profil de l'entreprise").locator("..");
  await expect(rolesDiv).toBeVisible();
  for (const role of company.roles) {
    await expect(rolesDiv.getByText(role)).toBeVisible();
  }
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
  { siret, receipt }: { siret: string; receipt: Receipt }
) => {
  // Select correct company & correct tab
  const companyDiv = await getCompanyDiv(page, { siret, tab: "Information" });

  // Check data
  const receiptDiv = companyDiv.locator(`#${receipt.type}Receipt`);
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

/**
 * Will verify amiante info, that is, certifications info.
 */
export const verifyAmianteCertification = async (
  page,
  {
    siret,
    certification
  }: { siret: string; certification: AmianteCertification }
) => {
  // Select correct company & correct tab
  const companyDiv = await getCompanyDiv(page, { siret, tab: "Information" });

  const amianteDiv = companyDiv
    .getByText("Catégorie entreprise de travaux amiante")
    .locator("..");
  await expect(amianteDiv).toBeVisible();

  // Check data
  await expect(
    amianteDiv.getByText("Travaux relevant de la sous-section 4")
  ).toBeVisible();
  await expect(
    amianteDiv.getByText("Travaux relevant de la sous-section 3")
  ).toBeVisible();
  await expect(amianteDiv.getByTestId("certificationNumber")).toHaveText(
    certification.number
  );
  await expect(amianteDiv.getByTestId("validityLimit")).toHaveText(
    toDDMMYYYY(certification.validityLimit)
  );
  await expect(amianteDiv.getByTestId("organisation")).toHaveText(
    certification.organisation
  );
};

/**
 * Enables to verify VHU agrement data. Can be démolisseur, broyeur
 */
export const verifyVHUAgrement = async (
  page,
  { siret, agrement }: { siret: string; agrement: VHUAgrement }
) => {
  // Select correct company & correct tab
  const companyDiv = await getCompanyDiv(page, { siret, tab: "Information" });

  // Check data
  await expect(
    companyDiv.getByTestId(`vhuAgrement${agrement.type}_agrementNumber`)
  ).toHaveText(agrement.number);
  await expect(
    companyDiv.getByTestId(`vhuAgrement${agrement.type}_department`)
  ).toHaveText(agrement.department);
};

/**
 * Creates a waste managing company (like transporter or waste processor). Will make assertions.
 */
interface CreateWasteManagingCompanyProps {
  company: Company;
  contact?: Contact;
  receipt?: Receipt;
  vhuAgrements?: VHUAgrement[];
  amianteCertification?: AmianteCertification;
}
export const createWasteManagingCompany = async (
  page: Page,
  {
    company,
    contact,
    receipt,
    vhuAgrements,
    amianteCertification
  }: CreateWasteManagingCompanyProps
) => {
  // Initiate company creation
  const { siret } = await generateSiretAndInitiateCompanyCreation(page, {
    roles: company.roles
  });

  // Fill in company info
  await fillInGenericCompanyInfo(page, { company, contact });

  // VHU
  if (vhuAgrements && vhuAgrements.length) {
    for (const agrement of vhuAgrements)
      await fillInVHUAgrement(page, { agrement });
  }

  // Receipt
  if (receipt) await fillInReceipt(page, { receipt: receipt });

  // Amiante
  if (amianteCertification)
    await fillInAmianteCertification(page, {
      certification: amianteCertification
    });

  // Submit
  await submitAndVerifyGenericInfo(page, { company, contact, siret });

  // Verify VHU agrements
  if (vhuAgrements && vhuAgrements.length) {
    for (const agrement of vhuAgrements)
      await verifyVHUAgrement(page, { siret, agrement });
  }

  // Verify receipt
  if (receipt) await verifyReceipt(page, { siret, receipt });

  // Verify amiante
  if (amianteCertification)
    await verifyAmianteCertification(page, {
      siret,
      certification: amianteCertification
    });

  return { siret };
};

/**
 * Creates a company that produces waste. Will make assertions.
 */
export const createWasteProducerCompany = async (
  page: Page,
  { company }: { company: Company }
) => {
  // Initiate company creation
  const { siret } = await generateSiretAndInitiateCompanyCreation(page, {
    roles: company.roles
  });

  // Fill in company info
  await page.getByLabel("Nom usuel").fill(company.name);

  // Company produces DASRI
  if (company.producesDASRI)
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

/**
 * Will delete a company. Will assert that the company has successfully been deleted.
 */
export const deleteCompany = async (page, { siret }) => {
  // Click on company's signature tab
  const companyDiv = await getCompanyDiv(page, { siret, tab: "Avancé" });

  // Click once
  const deletionDiv = companyDiv
    .getByText("Supprimer l'établissement")
    .locator("..");
  await expect(deletionDiv).toBeVisible();
  await deletionDiv.getByText("Supprimer", { exact: true }).click();

  // Warning message should be visible
  await expect(
    page.getByText(
      "En supprimant cet établissement, vous supprimez les accès de tous les administrateurs"
    )
  ).toBeVisible();

  // Delete
  await deletionDiv.getByRole("button", { name: "Supprimer" }).click();

  // Verify that deletion succeeded
  await expect(page.getByTestId("loader")).not.toBeVisible(); // Wait for loading to end
  await expect(companyDiv).not.toBeVisible();
};