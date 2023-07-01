import { BsdaRevisionRequestApplied, getBsdaFromActivityEvents } from "..";
import { resetDatabase } from "../../../../integration-tests/helper";
import { bsdaFactory } from "../../../bsda/__tests__/factories";
import {
  Mutation,
  MutationCreateBsdaArgs,
  MutationSignBsdaArgs,
  MutationSubmitBsdaRevisionRequestApprovalArgs,
  MutationUpdateBsdaArgs
} from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import {
  transporterReceiptFactory,
  userWithCompanyFactory
} from "../../../__tests__/factories";
import makeClient from "../../../__tests__/testClient";
import { getStream } from "../../data";

const CREATE_BSDA = `
  mutation CreateBsda($input: BsdaInput!) {
    createBsda(input: $input) {
      id
    }
}`;

const UPDATE_BSDA = `
  mutation UpdateBsda($id: ID!, $input: BsdaInput!) {
    updateBsda(id: $id, input: $input) {
      id
    }
  }
`;

const SIGN_BSDA = `
  mutation SignBsda($id: ID!, $input: BsdaSignatureInput!) {
    signBsda(id: $id, input: $input) {
      id
    }
  }
`;

const SUBMIT_BSDA_REVISION_REQUEST_APPROVAL = `
  mutation SubmitBsdaRevisionRequestApproval($id: ID!, $isApproved: Boolean!) {
    submitBsdaRevisionRequestApproval(id: $id, isApproved: $isApproved) {
      id
    }
  }
`;

describe("ActivityEvent.Bsda", () => {
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

    // Create Bsda
    const { data } = await mutate<
      Pick<Mutation, "createBsda">,
      MutationCreateBsdaArgs
    >(CREATE_BSDA, {
      variables: {
        input: {
          emitter: {
            isPrivateIndividual: false,
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
            }
          },
          worker: {
            company: {
              name: destinationCompany.name,
              siret: destinationCompany.siret,
              address: "8 rue du Général de Gaulle",
              contact: "Destination",
              phone: "02",
              mail: "d@d.fr"
            }
          },
          destination: {
            plannedOperationCode: "D 9",
            cap: "1234",
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
          },
          waste: {
            code: "06 07 01*",
            consistence: "SOLIDE",
            materialName: "Amiante",
            familyCode: "Code famille"
          }
        }
      }
    });

    const bsdaId = data.createBsda.id;

    const bsdaAfterCreate = await prisma.bsda.findUnique({
      where: { id: bsdaId }
    });
    const bsdaFromEventsAfterCreate = await getBsdaFromActivityEvents({
      bsdaId
    });
    expect(bsdaAfterCreate).toMatchObject(bsdaFromEventsAfterCreate);
    expect(bsdaFromEventsAfterCreate.emitterCompanyName).toBe(company.name);

    const eventsAfterCreate = await getStream(bsdaId);
    expect(eventsAfterCreate.length).toBe(1);

    // Update Bsda
    await mutate<Pick<Mutation, "updateBsda">, MutationUpdateBsdaArgs>(
      UPDATE_BSDA,
      {
        variables: {
          id: bsdaId,
          input: {
            waste: {
              code: "06 13 04*"
            }
          }
        }
      }
    );

    const bsdaAfterUpdate = await prisma.bsda.findUnique({
      where: { id: bsdaId }
    });
    const bsdaFromEventsAfterUpdate = await getBsdaFromActivityEvents({
      bsdaId
    });
    expect(bsdaAfterUpdate).toMatchObject(bsdaFromEventsAfterUpdate);
    expect(bsdaFromEventsAfterUpdate.wasteCode).toBe("06 13 04*");

    const eventsAfterUpdate = await getStream(bsdaId);
    expect(eventsAfterUpdate.length).toBe(2);

    // Mark as sealed
    await mutate<Pick<Mutation, "signBsda">, MutationSignBsdaArgs>(SIGN_BSDA, {
      variables: {
        id: bsdaId,
        input: { type: "EMISSION", author: "Jean Emet" }
      }
    });

    const bsdaAfterSealed = await prisma.bsda.findUnique({
      where: { id: bsdaId }
    });
    const bsdaFromEventsAfterSealed = await getBsdaFromActivityEvents({
      bsdaId
    });
    expect(bsdaAfterSealed).toMatchObject(bsdaFromEventsAfterSealed);
    expect(bsdaFromEventsAfterSealed.status).toBe("SIGNED_BY_PRODUCER");

    const eventsAfterSealed = await getStream(bsdaId);
    expect(eventsAfterSealed.length).toBe(4); // +2, update + signature
  }, 10000);

  it("should create a bsda event when a revision request is applied", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "MEMBER"
    );
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { mutate } = makeClient(user);

    const bsda = await bsdaFactory({
      opt: { emitterCompanySiret: companyOfSomeoneElse.siret }
    });

    const revisionRequest = await prisma.bsdaRevisionRequest.create({
      data: {
        bsdaId: bsda.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        wasteCode: "01 03 08",
        comment: ""
      }
    });

    // There is only 1 approval. This will apply the revision onto the bsda
    await mutate<
      Pick<Mutation, "submitBsdaRevisionRequestApproval">,
      MutationSubmitBsdaRevisionRequestApprovalArgs
    >(SUBMIT_BSDA_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: true
      }
    });

    const eventsAfterBsdaApplied = await prisma.event.findMany({
      where: { streamId: bsda.id }
    });

    expect(eventsAfterBsdaApplied.length).toBe(1);
    expect(eventsAfterBsdaApplied[0].type).toBe("BsdaRevisionRequestApplied");
    const eventData = eventsAfterBsdaApplied[0]
      .data as BsdaRevisionRequestApplied["data"];
    expect(eventData.content.wasteCode).toBe("01 03 08");
  });

  it("should enable getting a bsda at a certain moment in time", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const { mutate } = makeClient(user);

    // Create Bsda
    const { data } = await mutate<
      Pick<Mutation, "createBsda">,
      MutationCreateBsdaArgs
    >(CREATE_BSDA, {
      variables: {
        input: {
          emitter: {
            isPrivateIndividual: false,
            company: {
              name: company.name,
              siret: company.siret,
              address: company.address,
              contact: "Emetteur",
              phone: "01",
              mail: "e@e.fr"
            }
          },
          worker: {
            company: {
              name: company.name,
              siret: company.siret,
              address: "8 rue du Général de Gaulle",
              contact: "Destination",
              phone: "02",
              mail: "d@d.fr"
            }
          },
          destination: {
            plannedOperationCode: "D 9",
            cap: "1234",
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
            code: "06 07 01*",
            consistence: "SOLIDE",
            materialName: "Amiante",
            familyCode: "Code famille"
          }
        }
      }
    });

    const bsdaId = data.createBsda.id;

    const now = new Date();

    // Update Bsda
    await mutate<Pick<Mutation, "updateBsda">>(UPDATE_BSDA, {
      variables: {
        id: bsdaId,
        input: {
          waste: {
            code: "06 13 04*"
          }
        }
      }
    });

    // We should now be able to get the bsda at different stages
    const bsdaAfterUpdate = await prisma.bsda.findUnique({
      where: { id: bsdaId }
    });
    const bsdaFromEventsAfterCreate = await getBsdaFromActivityEvents({
      bsdaId,
      at: now
    });
    expect(bsdaFromEventsAfterCreate.wasteCode).toBe("06 07 01*");
    expect(bsdaAfterUpdate!.wasteCode).toBe("06 13 04*");
  });
});
