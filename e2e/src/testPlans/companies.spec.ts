import { test } from "@playwright/test";
import { signupActivateAndLogin } from "../utils/user";
import {
  addAutomaticSignaturePartner,
  createProducerWithDASRICompany,
  createWasteManagingCompany,
  renewCompanyAutomaticSignatureCode,
  updateCompanyContactInfo
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

    await test.step("#001 - Transporteur avec récépissé de transport", async () => {
      const { siret } = await createWasteManagingCompany(page, {
        company: {
          name: "001 - Transporteur avec récépissé",
          role: "Transporteur"
        },
        contact: {
          name: "Transporteur 001",
          phone: "+33 4 75 84 21 45",
          email: "transporteur001@transport.com"
        },
        transporterReceipt: {
          number: "0123456789",
          validityLimit: new Date(),
          department: "75"
        }
      });

      transporterWithReceiptSiret = siret;
    });

    await test.step("#002 - Transporteur sans récépissé de transport", async () => {
      await createWasteManagingCompany(page, {
        company: {
          name: "002 - Transporteur sans récépissé",
          role: "Transporteur"
        },
        contact: {
          name: "Transporteur 002",
          phone: "0658954785",
          email: "transporteur002@transport.com"
        }
      });
    });

    await test.step("#003 - Producteur ayant autorisé la signature automatique (Annexe 1) ET l'emport direct de DASRI SANS informations de contact", async () => {
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

    await test.step("#004 - Producteur avec informations de contact ", async () => {
      let producerSiret;

      await test.step("Création du producteur", async () => {
        const { siret } = await createProducerWithDASRICompany(page, {
          company: {
            name: "004 - Producteur avec informations de contact"
          }
        });

        producerSiret = siret;
      });

      await test.step("Mise à jour des informations de contact", async () => {
        await updateCompanyContactInfo(page, {
          siret: producerSiret,
          contact: {
            name: "Producteur 004",
            email: "producteur004@producteur.com",
            phone: "+336 895 478 56",
            website: "http://www.app.trackdechets.com"
          }
        });
      });

      await test.step("Renouvellement du code de signature automatique", async () => {
        await renewCompanyAutomaticSignatureCode(page, {
          siret: producerSiret
        });
      });
    });

    // await test.step("#005 - Installation de Transit, Regroupement ou Tri des déchets", async () => {
    //   // TODO
    // });

    await test.step("#006 - Installation de collecte de déchets apportés par le producteur initial (déchetterie)", async () => {
      await createWasteManagingCompany(page, {
        company: {
          name: "006 - Déchetterie",
          role: "Installation de collecte de déchets apportés par le producteur initial"
        },
        contact: {
          name: "Déchetterie 006",
          phone: "4521569854",
          email: "dechetterie006@installation.com"
        }
      });
    });

    await test.step("#007 - Installation de traitement de VHU (casse automobile et/ou broyeur agréé)", async () => {
      await createWasteManagingCompany(page, {
        company: {
          name: "007 Installation de traitement de VHU",
          role: "Installation de traitement de VHU (casse automobile et/ou broyeur agréé)"
        },
        contact: {
          name: "VHU 007",
          phone: "4521256352",
          email: "installationvhu@installation.com"
        },
        vhuAgrementBroyeur: {
          number: "AGREMENTBROYEUR",
          department: "75"
        },
        vhuAgrementDemolisseur: {
          number: "AGREMENTDEMOLISSEUR",
          department: "75"
        }
      });
    });
  });
});
