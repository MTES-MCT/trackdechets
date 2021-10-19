import supertest from "supertest";
import { User } from "@prisma/client";
import { resetDatabase } from "../../../integration-tests/helper";
import { app } from "../../server";
import { createAccessToken } from "../../users/database";
import { userWithCompanyFactory } from "../../__tests__/factories";

const request = supertest(app);

describe("Exemples de circuit du bordereau de suivi de véhicule hors d'usage", () => {
  afterEach(resetDatabase);

  async function apiKey(user: User) {
    const { clearToken } = await createAccessToken(user);
    return clearToken;
  }

  it("Acheminement d'un centre VHU vers un broyeur", async () => {
    const {
      user: producteurUser,
      company: producteurCompany
    } = await userWithCompanyFactory("MEMBER");
    const {
      user: transporterUser,
      company: transporterCompany
    } = await userWithCompanyFactory("MEMBER");
    const {
      user: broyeurUser,
      company: broyeurCompany
    } = await userWithCompanyFactory("MEMBER");

    const producteurToken = await apiKey(producteurUser);
    const transporteurToken = await apiKey(transporterUser);
    const broyeurToken = await apiKey(broyeurUser);

    // Le producteur crée un BSVHU
    const createBsvhuQuery = `
        mutation {
            createBsvhu(input: {
              emitter: {
                agrementNumber: "1234"
                company: {
                  siret: "${producteurCompany.siret}"
                  name: "${producteurCompany.name}"
                  address: "1 rue de paradis, 75010 PARIS"
                  contact: "Jean Voiture"
                  phone: "01 00 00 00 00"
                  mail: "jean.voiture@vhu.fr"
                }
              }
              wasteCode: "16 01 06"
              packaging: UNITE
              identification: {
                numbers: ["123", "456"]
                type: NUMERO_ORDRE_REGISTRE_POLICE
              }
              quantity: 2
              weight: {
                isEstimate: false,
                value: 1.3
              }
              transporter: {
                company: {
                  siret: "${transporterCompany.siret}"
                  name: "${transporterCompany.name}"
                  address: "1 rue de paradis, 75010 PARIS"
                  contact: "Transport Dupont"
                  phone: "01 00 00 00 00"
                  mail: "transport.dupont@transporter.fr"
                }
              }
              destination: {
                type: BROYEUR
                agrementNumber: "456"
                plannedOperationCode: "R 12"
                company: {
                  siret: "${broyeurCompany.siret}"
                  name: "${broyeurCompany.name}"
                  address: "1 rue de paradis, 75010 PARIS"
                  contact: "Transport Dupont"
                  phone: "01 00 00 00 00"
                  mail: "transport.dupont@transporter.fr"
                }
              }
            }) { status id }
        }
        `;

    const createBsvhuResponse = await request
      .post("/")
      .set("Authorization", `Bearer ${producteurToken}`)
      .send({ query: createBsvhuQuery });

    const id: string = createBsvhuResponse.body.data.createBsvhu.id;

    expect(createBsvhuResponse.body.data.createBsvhu.status).toBe("INITIAL");

    // Le producteur procède ensuite à la signature
    const producerSignatureQuery = `
        mutation {
            signBsvhu(id: "${id}", input: {
              type: EMISSION
              author: "Jean VHU"
            }) { status emitter { emission { signature { author }} } }
        }
        `;

    const producerSignatureResponse = await request
      .post("/")
      .set("Authorization", `Bearer ${producteurToken}`)
      .send({ query: producerSignatureQuery });

    expect(
      producerSignatureResponse.body.data.signBsvhu.emitter.emission.signature
        .author
    ).toBe("Jean VHU");
    expect(producerSignatureResponse.body.data.signBsvhu.status).toBe(
      "SIGNED_BY_PRODUCER"
    );

    // Ensuite le transporteur édite ses données, puis signe
    const transporterBsvhuQuery = `
        mutation {
            updateBsvhu(id: "${id}", input: {
              transporter: {
                recepisse: {
                  number: "recepisse number"
                  department: "75"
                  validityLimit: "2020-06-30"
                }
              }
            }) { id }
            signBsvhu(id: "${id}", input: {
              type: TRANSPORT
              author: "Patrick Transport"
            }) { status transporter { transport { signature { author }} } }
        }
        `;

    const transporterSignatureResponse = await request
      .post("/")
      .set("Authorization", `Bearer ${transporteurToken}`)
      .send({ query: transporterBsvhuQuery });

    expect(
      transporterSignatureResponse.body.data.signBsvhu.transporter.transport
        .signature.author
    ).toBe("Patrick Transport");
    expect(transporterSignatureResponse.body.data.signBsvhu.status).toBe(
      "SENT"
    );

    // Enfin le broyeur édite ses données et signe
    const broyeurBsvhuQuery = `
        mutation {
            updateBsvhu(id: "${id}", input: {
              destination: {
                reception: {
                  weight: 1.4
                  acceptationStatus: ACCEPTED
                }
                operation: {
                  date: "${new Date().toISOString()}"
                  code: "R 12"
                }
              }
            }) { id }
            signBsvhu(id: "${id}", input: {
              type: OPERATION
              author: "Henri Broyeur"
            }) { status destination { operation { signature { author }} } }
        }
        `;

    const broyeurSignatureResponse = await request
      .post("/")
      .set("Authorization", `Bearer ${broyeurToken}`)
      .send({ query: broyeurBsvhuQuery });

    expect(
      broyeurSignatureResponse.body.data.signBsvhu.destination.operation
        .signature.author
    ).toBe("Henri Broyeur");
    expect(broyeurSignatureResponse.body.data.signBsvhu.status).toBe(
      "PROCESSED"
    );
  }, 10000);
});
