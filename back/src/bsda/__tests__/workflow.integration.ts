import supertest from "supertest";
import { User } from "@prisma/client";
import { resetDatabase } from "../../../integration-tests/helper";
import { app } from "../../server";
import { createAccessToken } from "../../users/database";
import { userWithCompanyFactory } from "../../__tests__/factories";

const request = supertest(app);

describe("Exemples de circuit du bordereau de suivi des déchets d'amiante", () => {
  afterEach(resetDatabase);

  async function apiKey(user: User) {
    const { clearToken } = await createAccessToken(user);
    return clearToken;
  }

  it("Déchet déposé en déchetterie (collecte en 2710-1)", async () => {
    const {
      user: producteurUser,
      company: producteurCompany
    } = await userWithCompanyFactory("MEMBER");
    const {
      user: exutoireUser,
      company: exutoireCompany
    } = await userWithCompanyFactory("MEMBER");

    const producteurToken = await apiKey(producteurUser);
    const exutoireToken = await apiKey(exutoireUser);

    const createBsdaMutation = `mutation {
        createBsda(input: {
            type: COLLECTION_2710
            emitter: {
                isPrivateIndividual: true
                company: {
                    siret: "${producteurCompany.siret}"
                    name: "The Amianteur"
                    address: "Rue du bsda"
                    contact: "Un producteur d'amiante"
                    phone: "0101010101"
                    mail: "emitter@mail.com"
                }
            }
            waste: {
                code: "17 06 05*"
                adr: "ADR"
                consistence: SOLIDE
                familyCode: "Code famille"
                materialName: "A material"
                name: "Amiante"
                sealNumbers: ["1", "2"]
            }
            packagings: [{ quantity: 1, type: PALETTE_FILME }]
            weight: { isEstimate: true, value: 1.2 }
            destination: {
                cap: "A cap"
                plannedOperationCode: "D 13"
                company: {
                    siret: "${exutoireCompany.siret}"
                    name: "destination"
                    address: "address"
                    contact: "contactEmail"
                    phone: "contactPhone"
                    mail: "contactEmail@mail.com"
                }
            }
      }) { status id }}`;

    const createBsdaResponse = await request
      .post("/")
      .set("Authorization", `Bearer ${producteurToken}`)
      .send({ query: createBsdaMutation });
    const id: string = createBsdaResponse.body.data.createBsda.id;
    expect(createBsdaResponse.body.data.createBsda.status).toBe("INITIAL");

    // La déchetterie complète les informations de destination et signe directement
    const exutoireSignatureQuery = `
      mutation {
        updateBsda(id: "${id}", input: {
          destination: {
              reception: {
                  date: "2020-06-30"
                  weight: 1.1
                  acceptationStatus: ACCEPTED
              }
              operation: {
                  code: "R 13"
                  date: "2020-06-30"
              }
          }
        }) { id }
        signBsda(id: "${id}", input: {
          type: OPERATION
          author: "Jean Dechetterie"
        }) { status }
      }
      `;

    const exutoireSignatureResponse = await request
      .post("/")
      .set("Authorization", `Bearer ${exutoireToken}`)
      .send({ query: exutoireSignatureQuery });

    expect(exutoireSignatureResponse.body.data.signBsda.status).toBe(
      "PROCESSED"
    );
  });

  it("Déchet collecté chez un particulier, avec signature papier détenue par l'entreprise de travaux", async () => {
    const {
      user: workerUser,
      company: workerCompany
    } = await userWithCompanyFactory("MEMBER");
    const {
      user: transporterUser,
      company: transporterCompany
    } = await userWithCompanyFactory("MEMBER");
    const {
      user: destinationUser,
      company: destinationCompany
    } = await userWithCompanyFactory("MEMBER");

    const workerToken = await apiKey(workerUser);
    const transporterToken = await apiKey(transporterUser);
    const destinationToken = await apiKey(destinationUser);

    const createBsdaMutation = `mutation {
          createBsda(input: {
              type: OTHER_COLLECTIONS
              emitter: {
                  isPrivateIndividual: true
              }
              worker: {
                  company: {
                    siret: "${workerCompany.siret}"
                    name: "The Worker"
                    address: "Rue du bsda"
                    contact: "Un worker"
                    phone: "0101010101"
                    mail: "worker@mail.com"
                  }
              }
              transporter: {
                  company: {
                    siret: "${transporterCompany.siret}"
                    name: "The Transporter"
                    address: "Rue du bsda"
                    contact: "Un transporter"
                    phone: "0101010101"
                    mail: "transporter@mail.com"
                  }
              }
              waste: {
                  code: "17 06 05*"
                  adr: "ADR"
                  consistence: SOLIDE
                  familyCode: "Code famille"
                  materialName: "A material"
                  name: "Amiante"
                  sealNumbers: ["1", "2"]
              }
              packagings: [{ quantity: 1, type: PALETTE_FILME }]
              weight: { isEstimate: true, value: 1.2 }
              destination: {
                  cap: "A cap"
                  plannedOperationCode: "D 13"
                  company: {
                      siret: "${destinationCompany.siret}"
                      name: "destination"
                      address: "address"
                      contact: "contactEmail"
                      phone: "contactPhone"
                      mail: "contactEmail@mail.com"
                  }
              }
        }) { status id }}`;

    const createBsdaResponse = await request
      .post("/")
      .set("Authorization", `Bearer ${workerToken}`)
      .send({ query: createBsdaMutation });

    const id: string = createBsdaResponse.body.data.createBsda.id;
    expect(createBsdaResponse.body.data.createBsda.status).toBe("INITIAL");

    // Le worker signe (signature papier du producteur obligatoirement recueillie au préalable)
    const workerSignatureQuery = `
      mutation {
        updateBsda(id: "${id}", input: {
          worker: {
            work: {
              hasEmitterPaperSignature: true
            }
          }
        }) { id }
        signBsda(id: "${id}", input: {
          type: WORK
          author: "I work"
        }) { status }
      }
      `;

    const exutoireSignatureResponse = await request
      .post("/")
      .set("Authorization", `Bearer ${workerToken}`)
      .send({ query: workerSignatureQuery });

    expect(exutoireSignatureResponse.body.data.signBsda.status).toBe(
      "SIGNED_BY_WORKER"
    );

    // Ensuite le transporteur édite ses données, puis signe
    const transporterBsdaQuery = `
        mutation {
            updateBsda(id: "${id}", input: {
              transporter: {
                recepisse: {
                  number: "recepisse number"
                  department: "75"
                  validityLimit: "2020-06-30"
                }
              }
            }) { id }
            signBsda(id: "${id}", input: {
              type: TRANSPORT
              author: "Patrick Transport"
            }) { status }
        }
        `;

    const transporterSignatureResponse = await request
      .post("/")
      .set("Authorization", `Bearer ${transporterToken}`)
      .send({ query: transporterBsdaQuery });
    expect(transporterSignatureResponse.body.data.signBsda.status).toBe("SENT");

    // Enfin la destination édite ses données puis signe
    const destinationBsdaQuery = `
        mutation {
            updateBsda(id: "${id}", input: {
              destination: {
                  reception: {
                      date: "2020-06-30"
                      weight: 1.1
                      acceptationStatus: ACCEPTED
                  }
                  operation: {
                      code: "R 13"
                      date: "2020-06-30"
                  }
              }
            }) { id }
            signBsda(id: "${id}", input: {
              type: OPERATION
              author: "Destination"
            }) { status }
        }
        `;

    const destinationBsdaResponse = await request
      .post("/")
      .set("Authorization", `Bearer ${destinationToken}`)
      .send({ query: destinationBsdaQuery });

    expect(destinationBsdaResponse.body.data.signBsda.status).toBe("PROCESSED");
  });

  it("Déchet collecté chez un professionnel, curcuit complet", async () => {
    const {
      user: producteurUser,
      company: producteurCompany
    } = await userWithCompanyFactory("MEMBER");
    const {
      user: workerUser,
      company: workerCompany
    } = await userWithCompanyFactory("MEMBER");
    const {
      user: transporterUser,
      company: transporterCompany
    } = await userWithCompanyFactory("MEMBER");
    const {
      user: destinationUser,
      company: destinationCompany
    } = await userWithCompanyFactory("MEMBER");

    const producteurToken = await apiKey(producteurUser);
    const workerToken = await apiKey(workerUser);
    const transporterToken = await apiKey(transporterUser);
    const destinationToken = await apiKey(destinationUser);

    // Création du bordereau. Peut être faite par n'importe quel acteur du moment qu'il est présent sur le bordereau.
    const createBsdaMutation = `mutation {
            createBsda(input: {
                type: OTHER_COLLECTIONS
                emitter: {
                    isPrivateIndividual: false
                    company: {
                        siret: "${producteurCompany.siret}"
                        name: "The Amianteur"
                        address: "Rue du bsda"
                        contact: "Un producteur d'amiante"
                        phone: "0101010101"
                        mail: "emitter@mail.com"
                    }
                }
                worker: {
                    company: {
                      siret: "${workerCompany.siret}"
                      name: "The Worker"
                      address: "Rue du bsda"
                      contact: "Un worker"
                      phone: "0101010101"
                      mail: "worker@mail.com"
                    }
                }
                transporter: {
                    company: {
                      siret: "${transporterCompany.siret}"
                      name: "The Transporter"
                      address: "Rue du bsda"
                      contact: "Un transporter"
                      phone: "0101010101"
                      mail: "transporter@mail.com"
                    }
                }
                waste: {
                    code: "17 06 05*"
                    adr: "ADR"
                    consistence: SOLIDE
                    familyCode: "Code famille"
                    materialName: "A material"
                    name: "Amiante"
                    sealNumbers: ["1", "2"]
                }
                packagings: [{
                    quantity: 1
                    type: PALETTE_FILME
                }]
                weight: { 
                    isEstimate: true
                    value: 1.2
                }
                destination: {
                    cap: "A cap"
                    plannedOperationCode: "D 13"
                    company: {
                        siret: "${destinationCompany.siret}",
                        name: "destination"
                        address: "address"
                        contact: "contactEmail"
                        phone: "contactPhone"
                        mail: "contactEmail@mail.com"
                    }
                }
          }) { status id }}`;

    const createBsdaResponse = await request
      .post("/")
      .set("Authorization", `Bearer ${producteurToken}`)
      .send({ query: createBsdaMutation });

    const id: string = createBsdaResponse.body.data.createBsda.id;
    expect(createBsdaResponse.body.data.createBsda.status).toBe("INITIAL");

    // Le producteur signe en premier
    const workerSignatureQuery = `
            mutation {
                signBsda(id: "${id}", input: {
                  type: EMISSION
                  author: "I produce"
                }) { status }
            }
            `;

    const producerSignatureResponse = await request
      .post("/")
      .set("Authorization", `Bearer ${producteurToken}`)
      .send({ query: workerSignatureQuery });

    expect(producerSignatureResponse.body.data.signBsda.status).toBe(
      "SIGNED_BY_PRODUCER"
    );

    // Ensuite l'entreprise de travaux édite ses données, puis signe
    const workerBsdaQuery = `
    mutation {
        updateBsda(id: "${id}", input: {
          worker: {
            work: {
                hasEmitterPaperSignature: false
            }
          }
        }) { id }
        signBsda(id: "${id}", input: {
          type: WORK
          author: "worker"
        }) { status }
    }
    `;

    const workerSignatureResponse = await request
      .post("/")
      .set("Authorization", `Bearer ${workerToken}`)
      .send({ query: workerBsdaQuery });

    expect(workerSignatureResponse.body.data.signBsda.status).toBe(
      "SIGNED_BY_WORKER"
    );

    // Ensuite le transporteur édite ses données, puis signe
    const transporterBsdaQuery = `
        mutation {
            updateBsda(id: "${id}", input: {
              transporter: {
                recepisse: {
                  number: "recepisse number"
                  department: "75"
                  validityLimit: "2020-06-30"
                }
              }
            }) { id }
            signBsda(id: "${id}", input: {
              type: TRANSPORT
              author: "Patrick Transport"
            }) { status }
        }
        `;

    const transporterSignatureResponse = await request
      .post("/")
      .set("Authorization", `Bearer ${transporterToken}`)
      .send({ query: transporterBsdaQuery });
    expect(transporterSignatureResponse.body.data.signBsda.status).toBe("SENT");

    // Enfin la destination édite ses données puis signe
    const destinationBsdaQuery = `
        mutation {
            updateBsda(id: "${id}", input: {
              destination: {
                  reception: {
                      date: "2020-06-30"
                      weight: 1.1
                      acceptationStatus: ACCEPTED
                  }
                  operation: {
                      code: "R 13"
                      date: "2020-06-30"
                  }
              }
            }) { id }
            signBsda(id: "${id}", input: {
              type: OPERATION
              author: "Destination"
            }) { status }
        }
        `;

    const destinationBsdaResponse = await request
      .post("/")
      .set("Authorization", `Bearer ${destinationToken}`)
      .send({ query: destinationBsdaQuery });

    expect(destinationBsdaResponse.body.data.signBsda.status).toBe("PROCESSED");
  });
});
