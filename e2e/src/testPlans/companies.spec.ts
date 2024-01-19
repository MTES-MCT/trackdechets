import { test } from "@playwright/test";
import { signupActivateAndLogin } from "../utils/user";
import {
  addAutomaticSignaturePartner,
  createProducerWithDASRICompany,
  createTransporterCompany
} from "../utils/company";

test.describe
  .serial("Cahier de recette de création d'établissements", async () => {
  // User credentials
  const USER_NAME = "User e2e Companies";
  const USER_EMAIL = "user.e2e.companies@mail.com";
  const USER_PASSWORD = "Us3r_E2E_C0mp4ni3s$$";

  let transporterWithReceiptSiret;

  test("Utilisateur connecté", async ({ page }) => {
    await test.step("Création de compte & connexion", async () => {
      await signupActivateAndLogin(page, {
        email: USER_EMAIL,
        password: USER_PASSWORD,
        username: USER_NAME
      });
    });

    await test.step("Création d'une entreprise de transport avec récépissé", async () => {
      const { siret } = await createTransporterCompany(page, {
        company: {
          name: "001 - Transporteur avec récépissé",
          phone: "+33 4 75 84 21 45",
          contact: "Transporteur 001",
          email: "transporteur001@transport.com"
        },
        receipt: {
          number: "0123456789",
          validityLimit: new Date(),
          department: "75"
        }
      });

      transporterWithReceiptSiret = siret;
    });

    await test.step("Création d'une entreprise de transport sans récépissé", async () => {
      await createTransporterCompany(page, {
        company: {
          name: "002 - Transporteur sans récépissé",
          phone: "0658954785",
          contact: "Transporteur 002",
          email: "transporteur002@transport.com"
        }
      });
    });

    await test.step("Création d'un producteur ayant autorisé la signature automatique (Annexe 1) ET l'emport direct de DASRI SANS informations de contact", async () => {
      let producerSiret;

      await test.step("Création du producteur", async () => {
        const { siret } = await createProducerWithDASRICompany(page, {
          company: {
            name: "003 - Producteur avec signature et emport autorisé"
          }
        });

        producerSiret = siret;
      });

      await test.step("Ajout du transporteur", async () => {
        await addAutomaticSignaturePartner(page, {
          siret: producerSiret,
          partnerSiret: transporterWithReceiptSiret
        });
      });
    });
  });
});
