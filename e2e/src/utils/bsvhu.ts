import { Page, expect } from "@playwright/test";

/**
 * Click on create bsd button, and select VHU
 */
const clickCreateVhuButton = async (page: Page) => {
  await page.getByRole("button", { name: "Créer un bordereau" }).click();
  await page.getByRole("link", { name: "Véhicule Hors d’Usage" }).click();
};

/**
 * Fill first tab info, "Emetteur du déchet"
 */
const fillEmitterTab = async (page: Page, emitter) => {
  // First, make sure input is empty
  await page.getByLabel("N°SIRET ou raison sociale").click();
  await expect(page.getByText("Aucune entreprise sélectionnée")).toBeVisible();

  // Then, fill siret and select company
  await page.getByLabel("N°SIRET ou raison sociale").fill(emitter.orgId);
  await page
    .getByRole("button", { name: `Établissement de test - ${emitter.orgId}` })
    .click();

  // Make sure auto-filled info matches company
  const contactName = await page
    .getByLabel("Personne à contacter")
    .inputValue();
  expect(contactName).toEqual(emitter.contact);

  const contactPhone = await page.getByLabel("Téléphone").inputValue();
  expect(contactPhone).toEqual(emitter.contactPhone);

  const contactEmail = await page.getByLabel("Mail").inputValue();
  expect(contactEmail).toEqual(emitter.contactEmail);

  const vhuAgrementDemolisseur = await page
    .getByLabel("Numéro d'agrément démolisseur")
    .inputValue();
  expect(vhuAgrementDemolisseur).toEqual(
    emitter.vhuAgrementDemolisseur.agrementNumber
  );

  // Go to next step
  await page.getByRole("button", { name: "Suivant" }).click();
};

/**
 * Fill second tab info, "Détail du déchet"
 */
export const fillWasteTab = async (page: Page) => {
  // "Code déchet" options should be visible
  await expect(
    page.getByText(
      "16 01 06 - véhicules hors d'usage ne contenant ni liquides ni autres composants dangereux"
    )
  ).toBeVisible();
  await expect(
    page.getByText(
      "16 01 04* - véhicules hors d’usage non dépollués par un centre agréé"
    )
  ).toBeVisible();

  // Check default selection
  await expect(page.getByLabel("16 01 06")).toBeChecked();

  // Select target value
  await page.getByText("16 01 04*").click();

  // "Conditionnement" options should be visible
  await expect(page.getByText("en unités")).toBeVisible();
  await expect(page.getByText("en lots")).toBeVisible();

  // Check default selection
  await expect(page.getByLabel("en unités")).toBeChecked();

  // "Identification par N° d'ordre" options should be visible
  await expect(
    page.getByText("tels qu'ils figurent dans le registre de police")
  ).toBeVisible();
  await expect(page.getByText("des lots sortants")).toBeVisible();

  // Check default selection
  await expect(
    page.getByLabel("tels qu'ils figurent dans le registre de police")
  ).toBeChecked();

  // Select target value
  await page.getByText("des lots sortants").click();

  // Détail des identifications
  const fillIdentificationsInput = async (value: string) => {
    // Doesn't seem that we can be more precise than that
    const identificationsInput = await page.getByRole("textbox");
    await identificationsInput.fill(value);
    await identificationsInput.press("Enter");
  };

  const nbrInput = await page.getByLabel(
    "En nombre (correspond au nombre d'identifications saisies)"
  );

  // Fill in a 1st value
  await fillIdentificationsInput("LOTVHU001");
  expect(await nbrInput.inputValue()).toEqual("1");

  // Fill in a 2nd value
  await fillIdentificationsInput("LOTVHU002");
  expect(await nbrInput.inputValue()).toEqual("2");

  // Fill in a 3nd value
  await fillIdentificationsInput("LOTVHU003");
  expect(await nbrInput.inputValue()).toEqual("3");

  // Remove 2nd value
  await page
    .locator("li")
    .filter({ hasText: "LOTVHU002+" })
    .getByRole("button")
    .click();
  expect(await nbrInput.inputValue()).toEqual("2");

  // Go to next step
  await page.getByRole("button", { name: "Suivant" }).click();
};

/**
 * Fill third tab info, "Transporteur du déchet"
 */
export const fillTransporterTab = async (page: Page, transporter) => {
  // Warning should be visible if no company is selected
  await expect(
    page.getByText("La sélection d'un établissement est obligatoire")
  ).toBeVisible();

  // Fill in transporter orgId
  await page
    .getByLabel("Nom ou numéro de SIRET de l'établissement")
    .fill(transporter.orgId);

  // Transporter should be selected automatically
  await expect(
    page.locator("li").filter({ hasText: transporter.orgId })
  ).toBeVisible();

  // Make sure auto-filled info matches company
  const contactName = await page
    .getByLabel("Personne à contacter")
    .inputValue();
  expect(contactName).toEqual(transporter.contact);

  const contactPhone = await page.getByLabel("Téléphone ou Fax").inputValue();
  expect(contactPhone).toEqual(transporter.contactPhone);

  const contactEmail = await page.getByLabel("Mail").inputValue();
  expect(contactEmail).toEqual(transporter.contactEmail);

  // Not exempt of recepisse
  await expect(
    page.getByLabel("Le transporteur déclare être exempté de récépissé")
  ).not.toBeChecked();

  // Go to next step
  await page.getByRole("button", { name: "Suivant" }).click();
};

/**
 * Fill fourth tab info, "Destination du déchet"
 */
const fillDestinationTab = async (page: Page) => {
  // Warning message triggerd by waste code
  await expect(
    page.getByText(
      "Vous avez saisi le code déchet dangereux 16 01 04*. Le destinataire est obligatoirement un démolisseur agréé."
    )
  ).toBeVisible();

  // Inputs should be parametrized accordingly
  await expect(page.getByLabel("Broyeur agréé")).toBeDisabled();
  await expect(page.getByLabel("Démolisseur agréé")).toBeChecked();

  // Both destinations should be asked for
  await expect(
    page.getByRole("heading", { name: "Installation de destination" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Installation de broyage prévisionelle" })
  ).toBeVisible();
};

export const createBsvhu = async (page: Page, { emitter, transporter }) => {
  await clickCreateVhuButton(page);

  await fillEmitterTab(page, emitter);
  await fillWasteTab(page);
  await fillTransporterTab(page, transporter);
  await fillDestinationTab(page);
};
