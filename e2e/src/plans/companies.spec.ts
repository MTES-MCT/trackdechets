import { expect, test } from "@playwright/test";
import { successfulLogin } from "../utils/user";
import {
  addAutomaticSignaturePartner,
  createWasteProducerCompany,
  createWasteManagingCompany,
  renewCompanyAutomaticSignatureCode,
  updateCompanyContactInfo,
  deleteCompany
} from "../utils/company";
import { seedUser } from "../data/user";

test.describe
  .serial("Cahier de recette de création d'établissements", async () => {
  // User credentials
  const USER_NAME = "User e2e Companies";
  const USER_EMAIL = "user.e2e.companies@mail.com";
  const USER_PASSWORD = "Us3r_E2E_C0mp4ni3s$$";

  let transporterWithReceiptSiret;

  test("Seed user", async () => {
    await seedUser({
      name: USER_NAME,
      email: USER_EMAIL,
      password: USER_PASSWORD
    });
  });

  test("Utilisateur connecté", async ({ page }) => {
    await test.step("Log in", async () => {
      await successfulLogin(page, {
        email: USER_EMAIL,
        password: USER_PASSWORD
      });
    });

    await test.step("#001 - Transporteur avec récépissé de transport", async () => {
      const { siret } = await createWasteManagingCompany(page, {
        company: {
          name: "001 - Transporteur avec récépissé",
          roles: ["Transporteur"]
        },
        contact: {
          name: "Transporteur 001",
          phone: "+33 4 75 84 21 45",
          email: "transporteur001@transport.com"
        },
        receipt: {
          type: "transporter",
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
          roles: ["Transporteur"]
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
        const { siret } = await createWasteProducerCompany(page, {
          company: {
            name: "003 - Producteur avec signature et emport autorisé",
            roles: [
              "Producteur de déchets (ou intermédiaire souhaitant avoir accès au bordereau)"
            ],
            producesDASRI: true
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
        const { siret } = await createWasteProducerCompany(page, {
          company: {
            name: "004 - Producteur avec informations de contact",
            roles: [
              "Producteur de déchets (ou intermédiaire souhaitant avoir accès au bordereau)"
            ]
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

    await test.step("#005 - Installation de Transit, Regroupement ou Tri des déchets", async () => {
      await createWasteManagingCompany(page, {
        company: {
          name: "005 - Installation de Transit, Regroupement ou Tri des déchets",
          roles: ["Installation de Transit, regroupement ou tri de déchets"]
        },
        contact: {
          name: "Installation TTR 005",
          phone: "0721548578",
          email: "installation005@ttr.com"
        }
      });
    });

    await test.step("#006 - Installation de collecte de déchets apportés par le producteur initial (déchetterie)", async () => {
      await createWasteManagingCompany(page, {
        company: {
          name: "006 - Déchetterie",
          roles: [
            "Installation de collecte de déchets apportés par le producteur initial"
          ]
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
          roles: [
            "Installation de traitement de VHU (casse automobile et/ou broyeur agréé)"
          ]
        },
        contact: {
          name: "VHU 007",
          phone: "4521256352",
          email: "installationvhu@installation.com"
        },
        vhuAgrements: [
          {
            type: "Demolisseur",
            number: "AGREMENTDEMOLISSEUR",
            department: "75"
          },
          {
            type: "Broyeur",
            number: "AGREMENTBROYEUR",
            department: "75"
          }
        ]
      });
    });

    await test.step("#008 - Installation de traitement", async () => {
      await createWasteManagingCompany(page, {
        company: {
          name: "008 - Installation de traitement",
          roles: ["Installation de traitement"]
        },
        contact: {
          name: "Installation de traitement 008",
          phone: "+33 4 75 84 85 78",
          email: "installationdetraitement@installation.com"
        }
      });
    });

    await test.step("#009 - Négociant", async () => {
      await createWasteManagingCompany(page, {
        company: {
          name: "009 - Négociant",
          roles: ["Négociant"]
        },
        contact: {
          name: "Monsieur Négociant",
          phone: "+33 5 84 87 85 84",
          email: "monsieur@negociant.com"
        },
        receipt: {
          type: "trader",
          number: "0123456789",
          validityLimit: new Date(),
          department: "75"
        }
      });
    });

    await test.step("#010 - Courtier", async () => {
      await createWasteManagingCompany(page, {
        company: {
          name: "010 - Courtier",
          roles: ["Courtier"]
        },
        contact: {
          name: "Monsieur Courtier",
          phone: "+33 8 59 45 78 44",
          email: "monsieur@courtier.com"
        },
        receipt: {
          type: "broker",
          number: "0123456789",
          validityLimit: new Date(),
          department: "75"
        }
      });
    });

    // TODO
    await test.step("#011 - Éco-organisme (TODO)", async () => {
      expect(true).toBeTruthy();
    });

    await test.step("#012 - Entreprise de travaux amiante", async () => {
      await createWasteManagingCompany(page, {
        company: {
          name: "012 - Entreprise de travaux amiante",
          roles: ["Entreprise de travaux amiante"]
        },
        contact: {
          name: "Entreprise de travaux 011",
          phone: "047365254512",
          email: "entreprisedetravaux@amiante.com"
        },
        amianteCertification: {
          number: "0123456789",
          validityLimit: new Date(),
          organisation: "QUALIBAT"
        }
      });
    });

    await test.step("#013 - Crématorium", async () => {
      await createWasteManagingCompany(page, {
        company: {
          name: "013 - Crématorium",
          roles: ["Crématorium"]
        },
        contact: {
          name: "Crématorium 013",
          phone: "+33 4 75 84 85 78",
          email: "crematorium@installation.com"
        }
      });
    });

    await test.step("Établissement à supprimer", async () => {
      let producerSiret;

      await test.step("Création de l'établissement", async () => {
        const { siret } = await createWasteProducerCompany(page, {
          company: {
            name: "Établissement à supprimer",
            roles: [
              "Producteur de déchets (ou intermédiaire souhaitant avoir accès au bordereau)"
            ]
          }
        });

        producerSiret = siret;
      });

      await test.step("Suppression de l'établissement", async () => {
        await deleteCompany(page, { siret: producerSiret });
      });
    });

    await test.step("#014 - Producteur + Transporteur avec signature DASRI", async () => {
      await createWasteManagingCompany(page, {
        company: {
          name: "014 - Producteur + Transporteur",
          roles: [
            "Producteur de déchets (ou intermédiaire souhaitant avoir accès au bordereau)",
            "Transporteur"
          ],
          producesDASRI: true
        },
        receipt: {
          type: "transporter",
          number: "0123456789",
          validityLimit: new Date(),
          department: "75"
        }
      });
    });

    await test.step("#015 - Entreprise de travaux amiante + Transporteur", async () => {
      await createWasteManagingCompany(page, {
        company: {
          name: "015 - Entreprise de travaux amiante + transporteur",
          roles: ["Entreprise de travaux amiante", "Transporteur"],
          producesDASRI: true
        },
        contact: {
          name: "Entreprise de travaux 015",
          phone: "047365254512",
          email: "entreprisedetravaux@amiante.com"
        },
        amianteCertification: {
          number: "0123456789",
          validityLimit: new Date(),
          organisation: "QUALIBAT"
        },
        receipt: {
          type: "transporter",
          number: "0123456789",
          validityLimit: new Date(),
          department: "75"
        }
      });
    });
  });
});
