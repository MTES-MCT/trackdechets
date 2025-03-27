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
      "16 01 04* - véhicules hors d'usage non dépollués par un centre agréé"
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
    page.getByText(
      "Identification par N° d'ordre tels qu'ils figurent dans le registre de police"
    )
  ).toBeVisible();
  await expect(
    page.getByText("Identification par numéro d'immatriculation")
  ).toBeVisible();

  // Select target value
  await page.getByText("Identification par numéro d'immatriculation").click();

  // Détail des identifications
  const fillIdentificationsInput = async (value: string) => {
    const identificationsInput = await page.getByTestId("tagsInput");
    await identificationsInput.fill(value);
    await identificationsInput.press("Enter");
  };

  const nbrInput = await page.getByTestId("tagsInputTags");

  // Fill in a 1st value
  await fillIdentificationsInput("LOTVHU001");
  expect(await nbrInput).toHaveCount(1);

  // Fill in a 2nd value
  await fillIdentificationsInput("LOTVHU002");
  expect(await nbrInput).toHaveCount(2);

  // Fill in a 3nd value
  await fillIdentificationsInput("LOTVHU003");
  expect(await nbrInput).toHaveCount(3);

  // Remove 2nd value
  await page.getByRole("button", { name: "LOTVHU002" }).click();
  expect(await nbrInput).toHaveCount(2);

  // Go to next step
  await page.getByRole("button", { name: "Suivant" }).click();
};

/**
 * Fill third tab info, "Transporteur du déchet"
 */
export const fillTransporterTab = async (page: Page, transporter) => {
  await page.getByLabel("N°SIRET ou raison sociale").click();
  await expect(page.getByText("Aucune entreprise sélectionnée")).toBeVisible();

  // Then, fill siret and select company
  await page.getByLabel("N°SIRET ou raison sociale").fill(transporter.orgId);
  await page
    .getByRole("button", { name: `${transporter.name} - ${transporter.orgId}` })
    .click();

  // Make sure auto-filled info matches company
  await expectInputValue(page, "Personne à contacter", transporter.contact);
  await expectInputValue(page, "Téléphone", transporter.contactPhone);
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
  await page
    .getByRole("tablist")
    .locator("button")
    .filter({ hasText: "Déchet" })
    .click();
  await page.getByText("16 01 06").click();
  await page
    .getByRole("tablist")
    .locator("button")
    .filter({ hasText: "Destination finale" })
    .click();

  // Options should have changed
  await expect(page.getByLabel("Broyeur agréé")).not.toBeDisabled();
  await expect(page.getByLabel("Démolisseur agréé")).toBeChecked();
  // Select broyeur
  await page.getByText("Broyeur agréé").click();

  // Select company
  await page.getByLabel("N°SIRET ou raison sociale").fill(destination.orgId);

  await expect(
    page.getByRole("heading", { name: "Installation de broyage prévisionelle" })
  ).not.toBeVisible();

  // Transporter should be selected automatically
  await page
    .getByRole("button", { name: `${destination.name} - ${destination.orgId}` })
    .click();

  // Make sure auto-filled info matches company
  await expectInputValue(page, "Personne à contacter", destination.contact);
  await expectInputValue(page, "Téléphone", destination.contactPhone);
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
  await expectInputValue(page, "Téléphone", destination.contactPhone);
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

  // Select company
  await page.getByLabel("N°SIRET ou raison sociale").nth(1).fill(broyeur.orgId);

  await page
    .getByRole("button", { name: `${broyeur.name} - ${broyeur.orgId}` })
    .click();

  const contactValue = await page
    .getByLabel("Personne à contacter")
    .nth(1)
    .inputValue();
  expect(contactValue).toEqual(broyeur.contact);

  const contactPhoneValue = await page
    .getByLabel("Téléphone")
    .nth(1)
    .inputValue();
  expect(contactPhoneValue).toEqual(broyeur.contactPhone);

  const contactMailValue = await page.getByLabel("Mail").nth(1).inputValue();
  expect(contactMailValue).toEqual(broyeur.contactEmail);

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
  await page.getByTestId("draftBtn").click();
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
  await fillWasteTab(page);
  await fillEmitterTab(page, emitter);
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
  await expect(emitterName).toEqual(`Expédition du bordereau ${emitter.name}`);
  const transporterName = await vhuDiv
    .locator(".actors__label")
    .nth(1)
    .getAttribute("aria-label");
  await expect(transporterName).toEqual(
    `Transporteur visé sur le bordereau ${transporter.name}`
  );
  const destinationName = await vhuDiv
    .locator(".actors__label")
    .nth(2)
    .getAttribute("aria-label");
  await expect(destinationName).toEqual(
    `Destination du bordereau ${destination.name}`
  );

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
  await page.getByRole("tab", { name: "Émetteur" }).click();
  await expectValue("siret", emitter.orgId);
  await expectValue("contact", emitter.contact);
  await expectValue("telephone", emitter.contactPhone);
  await expectValue("courriel", emitter.contactEmail);

  // Transporter
  await page.getByRole("tab", { name: "Transporteur" }).click();
  await expectValue("siret", transporter.orgId);
  await expectValue("contact", transporter.contact);
  await expectValue("telephone", transporter.contactPhone);
  await expectValue("courriel", transporter.contactEmail);
  await expectValue(
    "recepisse_n",
    transporter.transporterReceipt.receiptNumber
  );
  await expectValue(
    "recepisse_departement",
    transporter.transporterReceipt.department
  );
  await expectValue(
    "recepisse_valable_jusquau",
    toDDMMYYYY(transporter.transporterReceipt.validityLimit)
  );

  // Destination
  await page.getByRole("tab", { name: "Destinataire" }).click();
  await expectValue("siret", destination.orgId);
  await expectValue("contact", destination.contact);
  await expectValue("telephone", destination.contactPhone);
  await expectValue("courriel", destination.contactEmail);
  await expectValue(
    "numero_dagrement",
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
  await expect(page.getByText("Le poids est un champ requis.")).toBeVisible();

  // Edit VHU and add weight
  await page.getByRole("link", { name: "Mettre le bordereau à jour" }).click();
  await page
    .getByRole("tablist")
    .locator("button")
    .filter({ hasText: "Déchet" })
    .click();
  await page.getByLabel("Poids total en tonnes").fill("10");
  await page
    .getByRole("tablist")
    .locator("button")
    .filter({ hasText: "Destination finale" })
    .click();
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
