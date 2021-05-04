import supertest from "supertest";
import { User } from "@prisma/client";
import { resetDatabase } from "../../../../integration-tests/helper";
import { app } from "../../../server";
import {
  associateUserToCompany,
  createAccessToken
} from "../../../users/database";
import {
  companyFactory,
  destinationFactory,
  userFactory
} from "../../../__tests__/factories";

// Crée un client HTTP de test basé sur http://visionmedia.github.io/superagent/
const request = supertest(app);

describe("Exemples de circuit du bordereau de suivi DASRI", () => {
  beforeEach(resetDatabase);

  /**
   * Helper function to return a user token
   */
  async function apiKey(user: User) {
    const { clearToken } = await createAccessToken(user);
    return clearToken;
  }

  test(
    "Acheminement direct de la personne responsable de l'élimination" +
      " des déchets PRED vers l'installation destinataire",
    async () => {
      // Établissement producteur de boues organiques
      const pred = await companyFactory({
        siret: "11111111111111",
        name: "Hôpital Saint Antoine"
      });
      // Avec un utilisateur membre
      const predUser = await userFactory();
      await associateUserToCompany(predUser.id, pred.siret, "MEMBER");

      // Installation destinataire
      const destination = await destinationFactory({
        siret: "22222222222222",
        name: "Incinérateur du Grand Est"
      });
      // Avec un utilisateur membre
      const destinationUser = await userFactory();
      await associateUserToCompany(
        destinationUser.id,
        destination.siret,
        "MEMBER"
      );

      // Entreprise de transport
      const transporteur = await companyFactory({
        siret: "33333333333333",
        name: "Transport Qui Roule"
      });
      // Avec un utilisateur membre
      const transporteurUser = await userFactory();
      await associateUserToCompany(
        transporteurUser.id,
        transporteur.siret,
        "MEMBER"
      );

      // Récupère les tokens utilisateurs pour l'authentification à l'API
      const predToken = await apiKey(predUser);
      const destinationToken = await apiKey(destinationUser);
      const transporteurToken = await apiKey(transporteurUser);

      const createBsdasri = `
        mutation {
          createBsdasri(
            bsdasriCreateInput: {
              emitter: {
                company: {
                  siret: "${pred.siret}"
                  name: "${pred.name}"
                  address: "${pred.address}"
                  mail: "contact@aphp.trackdechets.fr"
                  contact: "Docteur Brun"
                  phone: "06 06 06 06 06"
                }
                type: PRODUCER
              }
              emission: {
                wasteCode: "18 01 03*"
                wasteDetails: {
                  quantity: 1
                  quantityType: REAL
                  onuCode: "non soumis"
                  packagingInfos: [{type: BOITE_CARTON, quantity: 1, volume: 1}]
                }
              }
              transporter: {
                company: {
                  siret: "${transporteur.siret}"
                  name: "${transporteur.name}"
                  address: "${transporteur.address}"
                  mail: "contact@transportquiroule.fr"
                  phone: "06 06 06 06 06"
                  contact: "John"
                }
                receipt: "KIH-458-87"
                receiptDepartment: "07"
                receiptValidityLimit: "2022-01-01"
              }
              recipient: {
                company: {
                  siret: "${destination.siret}"
                  name: "${destination.name}"
                  address: "${destination.address}"
                  mail: "contact@incinerateur.fr"
                  contact: "Bob"
                  phone: "08 08 08 08 08"
                }
              }
            }
          ) {
            id
            status
          }
        }
      `;

      const createBsdasriResponse = await request
        .post("/")
        .set("Authorization", `Bearer ${predToken}`)
        .send({ query: createBsdasri });

      let bsdasri = createBsdasriResponse.body.data.createBsdasri;

      expect(bsdasri.status).toEqual("INITIAL");

      const signForProducer = `
        mutation {
          signBsdasri(
            id : "${bsdasri.id}"
            signatureInput: { type: EMISSION, author: "Dr Brun" }
          ) {
            id
            status
          }
        }
      `;

      const signForProducerResponse = await request
        .post("/")
        .set("Authorization", `Bearer ${predToken}`)
        .send({ query: signForProducer });

      bsdasri = signForProducerResponse.body.data.signBsdasri;

      expect(bsdasri.status).toEqual("SIGNED_BY_PRODUCER");

      const updateTransport = `
        mutation {
          updateBsdasri(
            id: "${bsdasri.id}",
            bsdasriUpdateInput: {
              transport: {
                wasteAcceptation: { status: ACCEPTED }
                wasteDetails: {
                  quantity: 1
                  quantityType: REAL
                  packagingInfos: [{ type: BOITE_CARTON, quantity: 1, volume: 1 }]
                }
                takenOverAt: "2022-04-27"
              }
            }
          ) {
            id
            status
          }
        }
      `;

      const updateTransportResponse = await request
        .post("/")
        .set("Authorization", `Bearer ${transporteurToken}`)
        .send({ query: updateTransport });

      bsdasri = updateTransportResponse.body.data.updateBsdasri;

      const signTransport = `
        mutation {
          signBsdasri(
            id: "${bsdasri.id}"
            signatureInput: { type: TRANSPORT author: "John" }
          ){
            id
            status
          }
        }`;

      const signTransportResponse = await request
        .post("/")
        .set("Authorization", `Bearer ${transporteurToken}`)
        .send({ query: signTransport });

      bsdasri = signTransportResponse.body.data.signBsdasri;

      expect(bsdasri.status).toEqual("SENT");

      const updateReception = `
        mutation {
          updateBsdasri(
            id: "${bsdasri.id}",
            bsdasriUpdateInput: {
              reception: {
                wasteAcceptation: { status: ACCEPTED }
                wasteDetails: {
                  quantity: 1
                  quantityType: REAL
                  packagingInfos: [{ type: BOITE_CARTON, quantity: 1, volume: 1 }]
                }
                receivedAt: "2021-04-27"
              }
            }
          ) {
            id
            status
          }
        }
      `;

      const updateReceptionResponse = await request
        .post("/")
        .set("Authorization", `Bearer ${destinationToken}`)
        .send({ query: updateReception });

      bsdasri = updateReceptionResponse.body.data.updateBsdasri;

      const signReception = `
        mutation {
          signBsdasri(
            id: "${bsdasri.id}"
            signatureInput: { type: RECEPTION, author: "Bob" }
          ){
            id
            status
          }
        }`;

      const signReceptionResponse = await request
        .post("/")
        .set("Authorization", `Bearer ${destinationToken}`)
        .send({ query: signReception });

      bsdasri = signReceptionResponse.body.data.signBsdasri;

      expect(bsdasri.status).toEqual("RECEIVED");

      const updateOperation = `
        mutation {
          updateBsdasri(
            id: "${bsdasri.id}",
            bsdasriUpdateInput: {
              operation: {
                processingOperation: "D10",
                processedAt: "2020-04-28"
              }
            }
          ) {
            id
            status
          }
        }
      `;

      const updateOperationresponse = await request
        .post("/")
        .set("Authorization", `Bearer ${destinationToken}`)
        .send({ query: updateOperation });

      bsdasri = updateOperationresponse.body.data.updateBsdasri;

      const signOperation = `
        mutation {
          signBsdasri(
            id: "${bsdasri.id}"
            signatureInput: { type: OPERATION, author: "Bob" }
          ){
            id
            status
          }
        }`;

      const signOperationResponse = await request
        .post("/")
        .set("Authorization", `Bearer ${destinationToken}`)
        .send({ query: signOperation });

      bsdasri = signOperationResponse.body.data.signBsdasri;

      expect(bsdasri.status).toEqual("PROCESSED");
    }
  );
});
