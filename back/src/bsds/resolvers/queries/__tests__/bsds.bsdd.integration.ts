import { addYears } from "date-fns";
import { Company, User, UserRole } from "@prisma/client";
import {
  Query,
  QueryBsdsArgs,
  Mutation,
  MutationCreateFormArgs,
  MutationMarkAsSealedArgs,
  MutationSignedByTransporterArgs,
  MutationMarkAsReceivedArgs,
  MutationMarkAsProcessedArgs
} from "../../../../generated/graphql/types";
import {
  resetDatabase,
  refreshElasticSearch
} from "../../../../../integration-tests/helper";
import makeClient from "../../../../__tests__/testClient";
import {
  userWithCompanyFactory,
  formFactory
} from "../../../../__tests__/factories";

import { indexForm } from "../../../../forms/elastic";
import { getFullForm } from "../../../../forms/database";
const GET_BSDS = `
  query GetBsds($where: BsdWhere) {
    bsds(where: $where) {
      edges {
        node {
          ... on Form {
            id
          }
        }
      }
    }
  }
`;
const CREATE_FORM = `
mutation CreateForm($createFormInput: CreateFormInput!) {
  createForm(createFormInput: $createFormInput) {
    id
  }
}
`;

describe("Query.bsds workflow", () => {
  let emitter: { user: User; company: Company };
  let transporter: { user: User; company: Company };
  let recipient: { user: User; company: Company };
  let formId: string;

  beforeAll(async () => {
    emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });
    transporter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["TRANSPORTER"]
      }
    });
    recipient = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["WASTEPROCESSOR"]
      }
    });
  });
  afterAll(resetDatabase);

  describe("when a bsd is freshly created", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(emitter.user);

      const {
        data: {
          createForm: { id }
        }
      } = await mutate<Pick<Mutation, "createForm">, MutationCreateFormArgs>(
        CREATE_FORM,
        {
          variables: {
            createFormInput: {
              emitter: {
                company: {
                  siret: emitter.company.siret,
                  name: "MARIE PRODUCTEUR",
                  address: "12 chemin des caravanes",
                  contact: "Marie",
                  mail: "marie@gmail.com",
                  phone: "06"
                },
                type: "PRODUCER"
              },
              transporter: {
                company: {
                  siret: transporter.company.siret,
                  name: "JM TRANSPORT",
                  address: "2 rue des pâquerettes",
                  contact: "Jean-Michel",
                  mail: "jean.michel@gmaiL.com",
                  phone: "06"
                },
                receipt: "123456789",
                department: "69",
                validityLimit: addYears(new Date(), 1).toISOString() as any
              },
              recipient: {
                company: {
                  siret: recipient.company.siret,
                  name: "JEANNE COLLECTEUR",
                  address: "38 bis allée des anges",
                  contact: "Jeanne",
                  mail: "jeanne@gmail.com",
                  phone: "06"
                },
                processingOperation: "R 1"
              },
              wasteDetails: {
                code: "01 01 01",
                name: "Stylos bille",
                consistence: "SOLID",
                packagingInfos: [
                  {
                    type: "BENNE",
                    quantity: 1
                  }
                ],
                quantityType: "ESTIMATED",
                quantity: 1
              }
            }
          }
        }
      );
      formId = id;
      await refreshElasticSearch();
    });

    it("should list the emitter's drafts", async () => {
      const { query } = makeClient(emitter.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isDraftFor: [emitter.company.siret]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: formId } })
      ]);
    });
  });

  describe("when the bsd is sealed", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(transporter.user);
      const MARK_AS_SEALED = `
        mutation MarkAsSealed($id: ID!) {
          markAsSealed(id: $id) {
            id
          }
        }
      `;
      await mutate<Pick<Mutation, "markAsSealed">, MutationMarkAsSealedArgs>(
        MARK_AS_SEALED,
        {
          variables: {
            id: formId
          }
        }
      );
      await refreshElasticSearch();
    });

    it("should list the emitter's for action bsds", async () => {
      const { query } = makeClient(transporter.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isForActionFor: [emitter.company.siret]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: formId } })
      ]);
    });

    it("should list the transporter to collect bsds", async () => {
      const { query } = makeClient(transporter.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isToCollectFor: [transporter.company.siret]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: formId } })
      ]);
    });
  });

  describe("when the bsd is signed by the transporter and the producer", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(transporter.user);
      const SIGNED_BY_TRANSPORTER = `
        mutation SignedByTransporter($id: ID!, $signingInfo: TransporterSignatureFormInput!) {
          signedByTransporter(id: $id, signingInfo: $signingInfo) {
            id
          }
        }
      `;
      await mutate<
        Pick<Mutation, "signedByTransporter">,
        MutationSignedByTransporterArgs
      >(SIGNED_BY_TRANSPORTER, {
        variables: {
          id: formId,
          signingInfo: {
            quantity: 1,
            securityCode: emitter.company.securityCode,
            sentAt: new Date().toISOString() as any,
            sentBy: emitter.user.name,
            signedByProducer: true,
            signedByTransporter: true
          }
        }
      });
      await refreshElasticSearch();
    });

    it("should list the recipient's for action bsds", async () => {
      const { query } = makeClient(recipient.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isForActionFor: [recipient.company.siret]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: formId } })
      ]);
    });

    it("should list the transporter's collected bsds", async () => {
      const { query } = makeClient(transporter.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isCollectedFor: [transporter.company.siret]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: formId } })
      ]);
    });
  });

  describe("when the bsd is received by the recipient", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(recipient.user);
      const MARK_AS_RECEIVED = `
        mutation MarkAsReceived($id: ID!, $receivedInfo: ReceivedFormInput!) {
          markAsReceived(id: $id, receivedInfo: $receivedInfo) {
            id
          }
        }
      `;
      const { errors } = await mutate<
        Pick<Mutation, "markAsReceived">,
        MutationMarkAsReceivedArgs
      >(MARK_AS_RECEIVED, {
        variables: {
          id: formId,
          receivedInfo: {
            receivedAt: new Date().toISOString() as any,
            receivedBy: recipient.user.name,
            quantityReceived: 1,
            signedAt: new Date().toISOString() as any,
            wasteAcceptationStatus: "ACCEPTED"
          }
        }
      });
      await refreshElasticSearch();

      expect(errors).toBeUndefined();
    });

    it("should list the recipient's for action bsds", async () => {
      const { query } = makeClient(recipient.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isForActionFor: [recipient.company.siret]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: formId } })
      ]);
    });
  });

  describe("when the bsd is treated by the recipient", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(recipient.user);
      const MARK_AS_PROCESSED = `
        mutation MarkAsProcessed($id: ID!, $processedInfo: ProcessedFormInput!) {
          markAsProcessed(id: $id, processedInfo: $processedInfo) {
            id
          }
        }
      `;
      const { errors } = await mutate<
        Pick<Mutation, "markAsProcessed">,
        MutationMarkAsProcessedArgs
      >(MARK_AS_PROCESSED, {
        variables: {
          id: formId,
          processedInfo: {
            processedAt: new Date().toISOString() as any,
            processedBy: recipient.user.name,
            processingOperationDone: "R 1"
          }
        }
      });
      await refreshElasticSearch();

      expect(errors).toBeUndefined();
    });

    it("should list the recipient archived bsds", async () => {
      const { query } = makeClient(recipient.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isArchivedFor: [recipient.company.siret]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: formId } })
      ]);
    });

    it("should list the emitter archived bsds", async () => {
      const { query } = makeClient(emitter.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isArchivedFor: [emitter.company.siret]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: formId } })
      ]);
    });

    it("should list the transporter archived bsds", async () => {
      const { query } = makeClient(transporter.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isArchivedFor: [transporter.company.siret]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: formId } })
      ]);
    });
  });
});

describe("Query.bsds edge cases", () => {
  afterAll(resetDatabase);

  it("should return bsds where same company plays different roles", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });

    const recipientAndTransporter = await userWithCompanyFactory(
      UserRole.ADMIN,
      {
        companyTypes: {
          set: ["WASTEPROCESSOR", "TRANSPORTER"]
        }
      }
    );
    // let's build a form where the same company is both transporter & recipient
    // this SENT form now is collected by transporter (isCollectedFor) and awaiting reception (isForActionFor) by recipient,
    // which are the same company (recipient)
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        transporterCompanySiret: recipientAndTransporter.company.siret,
        recipientCompanySiret: recipientAndTransporter.company.siret,
        status: "SENT"
      }
    });

    const fullForm = await getFullForm(form);

    await indexForm(fullForm);
    await refreshElasticSearch();

    const { query: transporterQuery } = makeClient(
      recipientAndTransporter.user
    );
    // form shows when whe request `isCollectedFor`
    let res = await transporterQuery<Pick<Query, "bsds">, QueryBsdsArgs>(
      GET_BSDS,
      {
        variables: {
          where: {
            isCollectedFor: [recipientAndTransporter.company.siret]
          }
        }
      }
    );

    expect(res.data.bsds.edges).toEqual([
      expect.objectContaining({ node: { id: form.id } })
    ]);

    const { query: recipientQuery } = makeClient(recipientAndTransporter.user);
    // form shows when we request `isForActionFor`
    res = await recipientQuery<Pick<Query, "bsds">, QueryBsdsArgs>(GET_BSDS, {
      variables: {
        where: {
          isForActionFor: [recipientAndTransporter.company.siret]
        }
      }
    });

    expect(res.data.bsds.edges).toEqual([
      expect.objectContaining({ node: { id: form.id } })
    ]);
  });
});
