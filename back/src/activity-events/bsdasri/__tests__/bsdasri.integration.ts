import {
  BsdasriRevisionRequestApplied,
  getBsdasriFromActivityEvents
} from "..";
import { resetDatabase } from "../../../../integration-tests/helper";
import { bsdasriFactory } from "../../../bsdasris/__tests__/factories";
import {
  Mutation,
  MutationCreateBsdasriArgs,
  MutationSignBsdasriArgs,
  MutationSubmitBsdasriRevisionRequestApprovalArgs,
  MutationUpdateBsdasriArgs
} from "../../../generated/graphql/types";
import { prisma } from "@td/prisma";
import {
  transporterReceiptFactory,
  userWithCompanyFactory
} from "../../../__tests__/factories";
import makeClient from "../../../__tests__/testClient";
import { getStream } from "../../data";

const CREATE_BSDASRI = `
  mutation CreateBsdasri($input: BsdasriInput!) {
    createBsdasri(input: $input) {
      id
    }
}`;

const UPDATE_BSDASRI = `
  mutation UpdateBsdasri($id: ID!, $input: BsdasriInput!) {
    updateBsdasri(id: $id, input: $input) {
      id
    }
  }
`;

const SIGN_BSDASRI = `
  mutation SignBsdasri($id: ID!, $input: BsdasriSignatureInput!) {
    signBsdasri(id: $id, input: $input) {
      id
    }
  }
`;

const SUBMIT_BSDASRI_REVISION_REQUEST_APPROVAL = `
  mutation SubmitBsdasriRevisionRequestApproval($id: ID!, $isApproved: Boolean!) {
    submitBsdasriRevisionRequestApproval(id: $id, isApproved: $isApproved) {
      id
    }
  }
`;

describe("ActivityEvent.Bsdasri", () => {
  afterEach(resetDatabase);

  it("should create events during the workflow", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: destinationCompany } = await userWithCompanyFactory(
      "MEMBER",
      {
        companyTypes: { set: ["WASTEPROCESSOR", "TRANSPORTER"] }
      }
    );
    await transporterReceiptFactory({ company: destinationCompany });
    const { mutate } = makeClient(user);

    // Create Bsdasri
    const { data } = await mutate<
      Pick<Mutation, "createBsdasri">,
      MutationCreateBsdasriArgs
    >(CREATE_BSDASRI, {
      variables: {
        input: {
          waste: {
            adr: "xyz 33",
            code: "18 01 03*"
          },
          emitter: {
            pickupSite: {
              name: "",
              address: "",
              city: "",
              postalCode: "",
              infos: ""
            },
            company: {
              name: company.name,
              siret: company.siret,
              address: company.address,
              contact: "Emetteur",
              phone: "01",
              mail: "e@e.fr"
            },
            emission: {
              packagings: [
                {
                  type: "BOITE_CARTON",
                  volume: 22,
                  quantity: 3
                }
              ]
            }
          },

          destination: {
            company: {
              name: destinationCompany.name,
              siret: destinationCompany.siret,
              address: "8 rue du Général de Gaulle",
              contact: "Destination",
              phone: "02",
              mail: "d@d.fr"
            }
          },
          transporter: {
            transport: {
              plates: ["12345"]
            },
            company: {
              name: destinationCompany.name,
              siret: destinationCompany.siret,
              address: "8 rue du Général de Gaulle",
              contact: "Transporteur",
              phone: "03",
              mail: "t@t.fr"
            }
          }
        }
      }
    });

    const bsdasriId = data.createBsdasri.id;

    const bsdasriAfterCreate = await prisma.bsdasri.findUnique({
      where: { id: bsdasriId }
    });
    const bsdasriFromEventsAfterCreate = await getBsdasriFromActivityEvents({
      bsdasriId
    });

    // Cannot use toMatchObject() when hydrating Decimal from events

    bsdasriAfterCreate!.transporterRecepisseValidityLimit = null;
    bsdasriFromEventsAfterCreate.transporterRecepisseValidityLimit = null;

    expect(bsdasriAfterCreate).toMatchObject(bsdasriFromEventsAfterCreate);
    expect(bsdasriFromEventsAfterCreate.emitterCompanyName).toBe(company.name);

    const eventsAfterCreate = await getStream(bsdasriId);
    expect(eventsAfterCreate.length).toBe(1);

    // Update Bsdasri
    await mutate<Pick<Mutation, "updateBsdasri">, MutationUpdateBsdasriArgs>(
      UPDATE_BSDASRI,
      {
        variables: {
          id: bsdasriId,
          input: {
            waste: {
              code: "18 02 02*"
            }
          }
        }
      }
    );

    const bsdasriAfterUpdate = await prisma.bsdasri.findUnique({
      where: { id: bsdasriId }
    });
    const bsdasriFromEventsAfterUpdate = await getBsdasriFromActivityEvents({
      bsdasriId
    });

    // Cannot use toMatchObject() when hydrating Decimal from events
    bsdasriAfterUpdate!.transporterRecepisseValidityLimit = null;
    bsdasriFromEventsAfterUpdate.transporterRecepisseValidityLimit = null;

    expect(bsdasriAfterUpdate).toMatchObject(bsdasriFromEventsAfterUpdate);
    expect(bsdasriFromEventsAfterUpdate.wasteCode).toBe("18 02 02*");

    const eventsAfterUpdate = await getStream(bsdasriId);
    expect(eventsAfterUpdate.length).toBe(2);

    // Mark as sealed
    await mutate<Pick<Mutation, "signBsdasri">, MutationSignBsdasriArgs>(
      SIGN_BSDASRI,
      {
        variables: {
          id: bsdasriId,
          input: { type: "EMISSION", author: "Jean Emet" }
        }
      }
    );

    const bsdasriAfterSealed = await prisma.bsdasri.findUnique({
      where: { id: bsdasriId }
    });
    const bsdasriFromEventsAfterSealed = await getBsdasriFromActivityEvents({
      bsdasriId
    });

    // Cannot use toMatchObject() when hydrating Decimal from events
    bsdasriAfterSealed!.transporterRecepisseValidityLimit = null;
    bsdasriFromEventsAfterSealed.transporterRecepisseValidityLimit = null;

    expect(bsdasriAfterSealed).toMatchObject(bsdasriFromEventsAfterSealed);
    expect(bsdasriFromEventsAfterSealed.status).toBe("SIGNED_BY_PRODUCER");

    const eventsAfterSealed = await getStream(bsdasriId);
    expect(eventsAfterSealed.length).toBe(3); // +2, signature
  }, 10000);

  it("should create a bsdasri event when a revision request is applied", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "MEMBER"
    );
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { mutate } = makeClient(user);

    const bsdasri = await bsdasriFactory({
      opt: { emitterCompanySiret: companyOfSomeoneElse.siret }
    });

    const revisionRequest = await prisma.bsdasriRevisionRequest.create({
      data: {
        bsdasriId: bsdasri.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        wasteCode: "18 01 03*",
        comment: ""
      }
    });

    // There is only 1 approval. This will apply the revision onto the bsdasri
    await mutate<
      Pick<Mutation, "submitBsdaRevisionRequestApproval">,
      MutationSubmitBsdasriRevisionRequestApprovalArgs
    >(SUBMIT_BSDASRI_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: true
      }
    });

    const eventsAfterBsdasriApplied = await prisma.event.findMany({
      where: { streamId: bsdasri.id }
    });

    expect(eventsAfterBsdasriApplied.length).toBe(1);
    expect(eventsAfterBsdasriApplied[0].type).toBe(
      "BsdasriRevisionRequestApplied"
    );
    const eventData = eventsAfterBsdasriApplied[0]
      .data as BsdasriRevisionRequestApplied["data"];
    expect(eventData.content.wasteCode).toBe("18 01 03*");
  });

  it("should enable getting a bsdasri at a certain moment in time", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const { mutate } = makeClient(user);

    // Create Bsdasri
    const { data } = await mutate<
      Pick<Mutation, "createBsdasri">,
      MutationCreateBsdasriArgs
    >(CREATE_BSDASRI, {
      variables: {
        input: {
          emitter: {
            company: {
              name: company.name,
              siret: company.siret,
              address: company.address,
              contact: "Emetteur",
              phone: "01",
              mail: "e@e.fr"
            },
            emission: {
              weight: { value: 23.2, isEstimate: false },

              packagings: [
                {
                  type: "BOITE_CARTON",
                  volume: 22,
                  quantity: 3
                }
              ]
            }
          },

          destination: {
            company: {
              name: company.name,
              siret: company.siret,
              address: "8 rue du Général de Gaulle",
              contact: "Destination",
              phone: "02",
              mail: "d@d.fr"
            }
          },
          transporter: {
            transport: {
              plates: ["12345"]
            },
            company: {
              name: company.name,
              siret: company.siret,
              address: "8 rue du Général de Gaulle",
              contact: "Transporteur",
              phone: "03",
              mail: "t@t.fr"
            }
          },
          waste: {
            adr: "xyz",
            code: "18 01 03*"
          }
        }
      }
    });

    const bsdasriId = data.createBsdasri.id;

    const justAfterCreate = new Date();

    // Update Bsdasri
    await mutate<Pick<Mutation, "updateBsda">>(UPDATE_BSDASRI, {
      variables: {
        id: bsdasriId,
        input: {
          waste: {
            code: "18 02 02*"
          }
        }
      }
    });

    // We should now be able to get the bsdasri at different stages
    const bsdasriAfterUpdate = await prisma.bsdasri.findUnique({
      where: { id: bsdasriId }
    });
    const bsdasriFromEventsAfterCreate = await getBsdasriFromActivityEvents({
      bsdasriId,
      at: justAfterCreate
    });
    expect(bsdasriFromEventsAfterCreate.wasteCode).toBe("18 01 03*");
    expect(bsdasriAfterUpdate!.wasteCode).toBe("18 02 02*");
  });
});
