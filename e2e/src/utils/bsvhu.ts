import { Page, expect } from "@playwright/test";
import { expectInputValue } from "./utils";
import { selectBsdMenu } from "./navigation";
import { toDDMMYYYY } from "./time";

/**
 * In the bsd card list, get the one corresponding to target bsd
 */
const getVHUCardDiv = async (page: Page, id: string) => {
  const div = page
    .locator(".bsd-card-list li")
    .filter({ hasText: `N°: ${id}` })
    .first();

  await expect(div).toBeVisible();

  return div;
};

/**
 * Click on create bsd button, and select VHU
 */
const clickCreateVhuButton = async (page: Page) => {
  await page.getByRole("button", { name: "Créer un bordereau" }).click();
  await page.getByRole("link", { name: "Véhicule Hors d’Usage" }).click();
};

/**
 * Click on secondary menu action button. Will check if secondary menu is already open.
 */
type Action = "Dupliquer" | "Supprimer";
const clickOnVhuSecondaryMenuButton = async (
  page: Page,
  id: string,
  action: Action
) => {
  const vhuDiv = await getVHUCardDiv(page, id);

  const button = vhuDiv.getByRole("button").getByText(action);

  // If secondary menu is already open, do not click again (or it will close)
  if (!(await button.isVisible())) {
    await vhuDiv.getByTestId("bsd-actions-secondary-btn").click();
  }

  await button.click();
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
    .getByRole("button", { name: `${emitter.name} - ${emitter.orgId}` })
    .click();

  // Make sure auto-filled info matches company
  await expectInputValue(page, "Personne à contacter", emitter.contact);
  await expectInputValue(page, "Téléphone", emitter.contactPhone);
  await expectInputValue(page, "Mail", emitter.contactEmail);
  await expectInputValue(
    page,
    "Numéro d'agrément démolisseur",
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
  await expectInputValue(page, "Personne à contacter", transporter.contact);
  await expectInputValue(page, "Téléphone ou Fax", transporter.contactPhone);
  await expectInputValue(page, "Mail", transporter.contactEmail);

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
const fillDestinationTab = async (page: Page, destination, broyeur) => {
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

  // Change waste code then come back
  await page.getByRole("button", { name: "Détail du déchet" }).click();
  await page.getByText("16 01 06").click();
  await page.getByRole("button", { name: "Destination du déchet" }).click();

  // Options should have changed
  await expect(page.getByLabel("Broyeur agréé")).not.toBeDisabled();
  await expect(page.getByLabel("Démolisseur agréé")).toBeChecked();

  // Select broyeur
  await page.getByLabel("Broyeur agréé").check();

  // Select company
  await page
    .getByRole("main")
    .locator("form div")
    .filter({ hasText: "Installation de destination" })
    .getByLabel("Nom ou numéro de SIRET de l'établissement")
    .fill(destination.orgId);

  await expect(
    page.getByRole("heading", { name: "Installation de broyage prévisionelle" })
  ).not.toBeVisible();

  // Transporter should be selected automatically
  await expect(
    page.locator("li").filter({ hasText: destination.orgId })
  ).toBeVisible();

  // Make sure auto-filled info matches company
  await expectInputValue(page, "Personne à contacter", destination.contact);
  await expectInputValue(page, "Téléphone ou Fax", destination.contactPhone);
  await expectInputValue(page, "Mail", destination.contactEmail);
  await expectInputValue(
    page,
    "Numéro d'agrément",
    destination.vhuAgrementBroyeur.agrementNumber
  );

  // Change selection to demolisseur
  await page.getByText("Démolisseur agréé").click();

  // Company info should not change except agrement
  await expectInputValue(page, "Personne à contacter", destination.contact);
  await expectInputValue(page, "Téléphone ou Fax", destination.contactPhone);
  await expectInputValue(page, "Mail", destination.contactEmail);
  await expectInputValue(
    page,
    "Numéro d'agrément",
    destination.vhuAgrementDemolisseur.agrementNumber
  );

  // Broyeur should be visible. Let's pick one
  await expect(
    page.getByRole("heading", { name: "Installation de broyage prévisionelle" })
  ).toBeVisible();

  const broyeurDiv = page
    .getByRole("main")
    .locator("form div")
    .filter({ hasText: "Installation de broyage prévisionelle" });

  await broyeurDiv
    .getByLabel("Nom ou numéro de SIRET de l'établissement")
    .fill(broyeur.orgId);

  await expect(
    broyeurDiv.locator("li").filter({ hasText: broyeur.orgId })
  ).toBeVisible();

  await expectInputValue(broyeurDiv, "Personne à contacter", broyeur.contact);
  await expectInputValue(broyeurDiv, "Téléphone ou Fax", broyeur.contactPhone);
  await expectInputValue(broyeurDiv, "Mail", broyeur.contactEmail);

  // Fill destination agrement
  await page
    .getByLabel("Numéro d'agrément")
    .fill(destination.vhuAgrementDemolisseur.agrementNumber);

  // Select operation code
  await page.getByRole("combobox").selectOption("R 12");

  // Create VHU
  const responsePromise = page.waitForResponse(async response => {
    return (await response.text()).includes("createDraftBsvhu");
  });
  await page.getByRole("button", { name: "Créer" }).click();
  const response = await responsePromise;
  const id = (await response.json()).data?.createDraftBsvhu?.id;

  return id;
};

/**
 * Creates a BSVHU and returns its id
 */
export const createBsvhu = async (
  page: Page,
  { emitter, transporter, destination, broyeur }
) => {
  // Click create button
  await clickCreateVhuButton(page);

  // Fill the steps
  await fillEmitterTab(page, emitter);
  await fillWasteTab(page);
  await fillTransporterTab(page, transporter);
  const id = await fillDestinationTab(page, destination, broyeur);

  // Navigate to BSDs view
  await page.getByRole("link", { name: "Tous les bordereaux" }).click();

  // Make sure VHU is visible
  const vhuDiv = page.locator(".bsd-card-list li").getByText(`N°: ${id}`);
  await expect(vhuDiv).toBeVisible();

  return { id };
};

/**
 * Verify BSVHU info, whether in the card list or overview
 */
export const verifyCardData = async (
  page: Page,
  { id, emitter, transporter, destination }
) => {
  const vhuDiv = await getVHUCardDiv(page, id);

  // Verify card info
  await expect(vhuDiv.getByText("16 01 06")).toBeVisible();
  await expect(vhuDiv.getByText("Brouillon")).toBeVisible();
  await expect(vhuDiv.getByText("VHU dépollués")).toBeVisible();

  // Companies names
  const emitterName = await vhuDiv
    .locator(".actors__label")
    .first()
    .getAttribute("aria-label");
  await expect(emitterName).toEqual(emitter.name);
  const transporterName = await vhuDiv
    .locator(".actors__label")
    .nth(1)
    .getAttribute("aria-label");
  await expect(transporterName).toEqual(transporter.name);
  const destinationName = await vhuDiv
    .locator(".actors__label")
    .nth(2)
    .getAttribute("aria-label");
  await expect(destinationName).toEqual(destination.name);

  // Primary button
  await expect(vhuDiv.getByRole("button").getByText("Publier")).toBeVisible();

  // Secondary buttons
  await vhuDiv.getByTestId("bsd-actions-secondary-btn").click();
  await expect(vhuDiv.getByRole("button").getByText("Aperçu")).toBeVisible();
  await expect(vhuDiv.getByRole("button").getByText("Dupliquer")).toBeVisible();
  await expect(vhuDiv.getByRole("button").getByText("Modifier")).toBeVisible();
  await expect(vhuDiv.getByRole("button").getByText("Supprimer")).toBeVisible();
};

/**
 * Verify BSD overview data
 */
export const verifyOverviewData = async (
  page: Page,
  { id, emitter, transporter, destination }
) => {
  // Open overview and verify data
  const vhuDiv = await getVHUCardDiv(page, id);
  await vhuDiv.getByRole("button").getByText("Aperçu").click();

  const modalContent = page.getByRole("tabpanel");
  const expectValue = async (testId, value) => {
    const content = await modalContent.getByTestId(testId).textContent();
    await expect(content).toEqual(value);
  };

  // Producteur
  await page.getByRole("tab", { name: "Producteur" }).click();
  await expectValue("siret", emitter.orgId);
  await expectValue("contact", emitter.contact);
  await expectValue("tel", emitter.contactPhone);
  await expectValue("mel", emitter.contactEmail);

  // Transporter
  await page.getByRole("tab", { name: "Transporteur" }).click();
  await expectValue("siret", transporter.orgId);
  await expectValue("contact", transporter.contact);
  await expectValue("tel", transporter.contactPhone);
  await expectValue("mel", transporter.contactEmail);
  await expectValue(
    "numero_de_recepisse",
    transporter.transporterReceipt.receiptNumber
  );
  await expectValue("departement", transporter.transporterReceipt.department);
  await expectValue(
    "date_de_validite_de_recepisse",
    toDDMMYYYY(transporter.transporterReceipt.validityLimit)
  );

  // Destination
  await page.getByRole("tab", { name: "Destinataire" }).click();
  await expectValue("siret", destination.orgId);
  await expectValue("contact", destination.contact);
  await expectValue("tel", destination.contactPhone);
  await expectValue("mel", destination.contactEmail);
  await expectValue(
    "agrement",
    destination.vhuAgrementDemolisseur.agrementNumber
  );

  // Close the modal
  await page.getByLabel("Close").click();
};

/**
 * Publish a VHU
 */
export const publishBsvhu = async (page: Page, { id }) => {
  await selectBsdMenu(page, "Brouillons");

  let vhuDiv = await getVHUCardDiv(page, id);

  // Try to publish
  await vhuDiv.getByRole("button").getByText("Publier").click();

  // Confirm publication in modal
  const responsePromise = page.waitForResponse(async response => {
    return (await response.text()).includes("publishBsvhu");
  });
  await page.getByRole("button", { name: "Publier le bordereau" }).click();
  await responsePromise;

  // Should be visible
  await selectBsdMenu(page, "Tous les bordereaux");
  vhuDiv = await getVHUCardDiv(page, id);
  await expect(vhuDiv).toBeVisible();

  // Status should be updated
  await expect(vhuDiv.getByText("publié")).toBeVisible();

  // Secondary buttons
  await vhuDiv.getByTestId("bsd-actions-secondary-btn").click();
  await expect(vhuDiv.getByRole("button").getByText("Aperçu")).toBeVisible();
  await expect(vhuDiv.getByRole("button").getByText("PDF")).toBeVisible();
  await expect(vhuDiv.getByRole("button").getByText("Dupliquer")).toBeVisible();
  await expect(vhuDiv.getByRole("button").getByText("Modifier")).toBeVisible();
  await expect(vhuDiv.getByRole("button").getByText("Supprimer")).toBeVisible();
};

/**
 * Fix VHU adding missing data, then publish
 */
export const fixAndPublishBsvhu = async (page: Page, { id }) => {
  await selectBsdMenu(page, "Brouillons");

  const vhuDiv = await getVHUCardDiv(page, id);

  // Try to publish
  await vhuDiv.getByRole("button").getByText("Publier").click();
  // Confirm publication in modal
  await page.getByRole("button", { name: "Publier le bordereau" }).click();

  // Weight is missing
  await expect(
    page.getByText("Déchet: le poids est obligatoire")
  ).toBeVisible();

  // Edit VHU and add weight
  await page.getByRole("link", { name: "Mettre le bordereau à jour" }).click();
  await page.getByRole("button", { name: "Détail du déchet" }).click();
  await page.getByLabel("En tonnes").fill("10");
  await page.getByRole("button", { name: "Destination du déchet" }).click();
  await page.getByRole("button", { name: "Enregistrer" }).click();

  // Weight should appear on VHU card
  await expect(vhuDiv.getByText("10 t")).toBeVisible();

  // Try to publish again
  await publishBsvhu(page, { id });
};

/**
 * Duplicate a VHU
 */
export const duplicateBsvhu = async (page: Page, { id }) => {
  await selectBsdMenu(page, "Tous les bordereaux");

  // Duplicate
  const responsePromise = page.waitForResponse(async response => {
    return (await response.text()).includes("duplicateBsvhu");
  });
  await clickOnVhuSecondaryMenuButton(page, id, "Dupliquer");
  const response = await responsePromise;
  const duplicatedId = (await response.json()).data?.duplicateBsvhu?.id;

  // Check in drafts
  await selectBsdMenu(page, "Brouillons");

  // Make sure VHU pops out in results list
  const duplicatedVhuDiv = page
    .locator(".bsd-card-list li")
    .getByText(`N°: ${duplicatedId}`);
  await expect(duplicatedVhuDiv).toBeVisible();

  return { id: duplicatedId };
};

/**
 * Delete a VHU
 */
export const deleteBsvhu = async (page: Page, { id }) => {
  await selectBsdMenu(page, "Tous les bordereaux");

  const vhuDiv = await getVHUCardDiv(page, id);

  // Delete
  await clickOnVhuSecondaryMenuButton(page, id, "Supprimer");

  // Confirmation modal
  await page.getByRole("button", { name: "Supprimer" }).click();

  await expect(vhuDiv).not.toBeVisible();
};
