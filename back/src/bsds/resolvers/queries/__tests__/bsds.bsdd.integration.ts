import {
  Company,
  User,
  UserRole,
  WasteProcessorType,
  CompanyType
} from "@prisma/client";
import {
  Query,
  QueryBsdsArgs,
  Mutation,
  MutationCreateFormArgs,
  MutationMarkAsSealedArgs,
  MutationSignedByTransporterArgs,
  MutationMarkAsProcessedArgs,
  CreateFormInput,
  MutationCreateFormRevisionRequestArgs,
  MutationSubmitFormRevisionRequestApprovalArgs,
  MutationMarkAsReceivedArgs,
  MutationSignTransportFormArgs
} from "../../../../generated/graphql/types";
import {
  resetDatabase,
  refreshElasticSearch
} from "../../../../../integration-tests/helper";
import makeClient from "../../../../__tests__/testClient";
import {
  userWithCompanyFactory,
  formFactory,
  toIntermediaryCompany,
  transporterReceiptFactory,
  bsddTransporterData,
  bsddTransporterFactory,
  UserWithCompany
} from "../../../../__tests__/factories";

import { getFormForElastic, indexForm } from "../../../../forms/elastic";
import { gql } from "graphql-tag";
import { searchCompany } from "../../../../companies/search";
import { prisma } from "@td/prisma";

jest.mock("../../../../companies/search");

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
const GET_BSDS_INTERMEDIARIES = `
  query GetBsds($where: BsdWhere) {
    bsds(where: $where) {
      edges {
        node {
          ... on Form {
            id
            intermediaries {
              name
              siret
            }
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
  let intermediary: { user: User; company: Company };
  let formId: string;
  let revisionRequestId: string;

  beforeAll(async () => {
    emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: [CompanyType.PRODUCER]
      }
    });
    intermediary = await userWithCompanyFactory(UserRole.MEMBER, {
      companyTypes: {
        set: [CompanyType.TRANSPORTER]
      }
    });
    transporter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: [CompanyType.TRANSPORTER]
      }
    });
    await transporterReceiptFactory({
      company: transporter.company
    });

    recipient = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: [CompanyType.WASTEPROCESSOR]
      },
      wasteProcessorTypes: {
        set: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      }
    });
    (searchCompany as jest.Mock).mockResolvedValue({
      siret: intermediary.company.siret,
      name: intermediary.company.name,
      statutDiffusionEtablissement: "O",
      isRegistered: true,
      address: intermediary.company.address,
      etatAdministratif: "A"
    });
  });
  afterAll(resetDatabase);

  describe("when a bsd is freshly created", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(emitter.user);

      const input: CreateFormInput = {
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
          mode: "AIR"
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
        },
        intermediaries: [toIntermediaryCompany(intermediary.company)]
      };

      const { data, errors } = await mutate<
        Pick<Mutation, "createForm">,
        MutationCreateFormArgs
      >(CREATE_FORM, {
        variables: {
          createFormInput: input
        }
      });
      expect(errors).toBeUndefined();
      formId = data.createForm.id;
      await refreshElasticSearch();
    });

    it("should list the emitter's drafts", async () => {
      const { query } = makeClient(emitter.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isDraftFor: [emitter.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: formId } })
      ]);
    });

    it.each([
      "isForActionFor",
      "isFollowFor",
      "isArchivedFor",
      "isToCollectFor",
      "isCollectedFor"
    ])("should not be listed in the emitter's %p tab", async tab => {
      const { query } = makeClient(emitter.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              [tab]: [emitter.company.siret]
            }
          }
        }
      );

      expect(data.bsds.edges).toHaveLength(0);
    });

    it("should list the intermediaries", async () => {
      const { query } = makeClient(emitter.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS_INTERMEDIARIES,
        {
          variables: {
            where: {
              isDraftFor: [emitter.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({
          node: {
            id: formId,
            intermediaries: [
              {
                name: intermediary.company.name,
                siret: intermediary.company.siret
              }
            ]
          }
        })
      ]);
    });
  });

  describe("when the bsd is sealed", () => {
    beforeAll(async () => {
      expect(formId).toBeDefined();
      const { mutate } = makeClient(emitter.user);
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
              isForActionFor: [emitter.company.siret!]
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
              isToCollectFor: [transporter.company.siret!]
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
      expect(formId).toBeDefined();
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
              isForActionFor: [recipient.company.siret!]
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
              isCollectedFor: [transporter.company.siret!]
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
      expect(formId).toBeDefined();
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
              isForActionFor: [recipient.company.siret!]
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
      expect(formId).toBeDefined();
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
            processingOperationDone: "R 1",
            destinationOperationMode: "VALORISATION_ENERGETIQUE"
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
              isArchivedFor: [recipient.company.siret!]
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
              isArchivedFor: [emitter.company.siret!]
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
              isArchivedFor: [transporter.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: formId } })
      ]);
    });
  });

  describe("when the bsd is under revision", () => {
    beforeAll(async () => {
      expect(formId).toBeDefined();
      const { mutate } = makeClient(recipient.user);
      const CREATE_FORM_REVISION_REQUEST = gql`
        mutation CreateFormRevisionRequest(
          $input: CreateFormRevisionRequestInput!
        ) {
          createFormRevisionRequest(input: $input) {
            id
          }
        }
      `;

      const { errors, data } = await mutate<
        Pick<Mutation, "createFormRevisionRequest">,
        MutationCreateFormRevisionRequestArgs
      >(CREATE_FORM_REVISION_REQUEST, {
        variables: {
          input: {
            formId: formId,
            authoringCompanySiret: recipient.company.siret!,
            comment: "oups",
            content: { wasteDetails: { code: "04 01 03*" } }
          }
        }
      });
      expect(errors).toBeUndefined();
      revisionRequestId = data.createFormRevisionRequest.id;
      await refreshElasticSearch();
    });

    it("should list bsd in destination `isIsRevisionFor` forms", async () => {
      const { query } = makeClient(recipient.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isInRevisionFor: [recipient.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: formId } })
      ]);
    });

    it("should list bsd in emitter `isIsRevisionFor` forms", async () => {
      const { query } = makeClient(emitter.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isInRevisionFor: [emitter.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: formId } })
      ]);
    });

    it(
      "should list bsds in emitter's top category `Révisions` made up" +
        " of `isInRevisionFor` and `isRevisedFor`",
      async () => {
        const { query } = makeClient(emitter.user);
        const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
          GET_BSDS,
          {
            variables: {
              where: {
                isInRevisionFor: [emitter.company.siret!],
                isRevisedFor: [emitter.company.siret!]
              }
            }
          }
        );

        expect(data.bsds.edges).toEqual([
          expect.objectContaining({ node: { id: formId } })
        ]);
      }
    );

    it(
      "should list bsds in destination's top category `Révisions` made up" +
        " of `isInRevisionFor` and `isRevisedFor`",
      async () => {
        const { query } = makeClient(recipient.user);
        const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
          GET_BSDS,
          {
            variables: {
              where: {
                isInRevisionFor: [recipient.company.siret!],
                isRevisedFor: [recipient.company.siret!]
              }
            }
          }
        );

        expect(data.bsds.edges).toEqual([
          expect.objectContaining({ node: { id: formId } })
        ]);
      }
    );
  });

  describe("when the bsd revision has been accepted", () => {
    beforeAll(async () => {
      expect(formId).toBeDefined();
      const { mutate } = makeClient(emitter.user);
      const SUBMIT_FORM_REVISION_REQUEST_APPROVAL = gql`
        mutation SubmitFormRevisionRequestApproval(
          $id: ID!
          $isApproved: Boolean!
          $comment: String
        ) {
          submitFormRevisionRequestApproval(
            id: $id
            isApproved: $isApproved
            comment: $comment
          ) {
            id
          }
        }
      `;

      const { errors } = await mutate<
        Pick<Mutation, "submitFormRevisionRequestApproval">,
        MutationSubmitFormRevisionRequestApprovalArgs
      >(SUBMIT_FORM_REVISION_REQUEST_APPROVAL, {
        variables: {
          id: revisionRequestId,
          isApproved: true
        }
      });
      expect(errors).toBeUndefined();
      await refreshElasticSearch();
    });

    it("should list bsd in destination `isRevisedFor` forms", async () => {
      const { query } = makeClient(recipient.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isRevisedFor: [recipient.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: formId } })
      ]);
    });

    it("should list bsd in emitter `isRevisedFor` forms", async () => {
      const { query } = makeClient(emitter.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isRevisedFor: [emitter.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: formId } })
      ]);
    });
  });

  it(
    "should list bsds in emitter's top category `Révisions` made up" +
      " of `isInRevisionFor` and `isRevisedFor`",
    async () => {
      const { query } = makeClient(emitter.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isInRevisionFor: [emitter.company.siret!],
              isRevisedFor: [emitter.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: formId } })
      ]);
    }
  );

  it(
    "should list bsds in destination's top category `Révisions` made up" +
      " of `isInRevisionFor` and `isRevisedFor`",
    async () => {
      const { query } = makeClient(recipient.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isInRevisionFor: [recipient.company.siret!],
              isRevisedFor: [recipient.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: formId } })
      ]);
    }
  );

  it("should list bsds in the right transporter and recipient tabs in multi-modal workflow", async () => {
    const SIGN_TRANSPORT_FORM = gql`
      mutation SignTransporterForm($id: ID!, $input: SignTransportFormInput!) {
        signTransportForm(id: $id, input: $input) {
          id
        }
      }
    `;

    const MARK_AS_RECEIVED = gql`
      mutation MarkAsReceived($id: ID!, $receivedInfo: ReceivedFormInput!) {
        markAsReceived(id: $id, receivedInfo: $receivedInfo) {
          id
        }
      }
    `;

    const emitter = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");
    const transporter1 = await userWithCompanyFactory("MEMBER", {
      companyTypes: ["TRANSPORTER"],
      transporterReceipt: {
        create: {
          receiptNumber: "T1",
          department: "07",
          validityLimit: new Date()
        }
      }
    });
    const transporter2 = await userWithCompanyFactory("MEMBER", {
      companyTypes: ["TRANSPORTER"],
      transporterReceipt: {
        create: {
          receiptNumber: "T2",
          department: "13",
          validityLimit: new Date()
        }
      }
    });
    const transporter3 = await userWithCompanyFactory("MEMBER", {
      companyTypes: ["TRANSPORTER"],
      transporterReceipt: {
        create: {
          receiptNumber: "T3",
          department: "84",
          validityLimit: new Date()
        }
      }
    });

    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        recipientCompanySiret: destination.company.siret,
        status: "SIGNED_BY_PRODUCER",
        emittedAt: new Date(),
        transporters: {
          create: {
            ...bsddTransporterData,
            number: 1,
            transporterCompanySiret: transporter1.company.siret
          }
        }
      }
    });

    await bsddTransporterFactory({
      formId: form.id,
      opts: { transporterCompanySiret: transporter2.company.siret }
    });
    await bsddTransporterFactory({
      formId: form.id,
      opts: { transporterCompanySiret: transporter3.company.siret }
    });

    function signTransport({ user }: UserWithCompany) {
      const { mutate } = makeClient(user);
      return mutate<
        Pick<Mutation, "signTransportForm">,
        MutationSignTransportFormArgs
      >(SIGN_TRANSPORT_FORM, {
        variables: {
          id: form.id,
          input: {
            takenOverAt: new Date().toISOString() as any,
            takenOverBy: "Transporteur"
          }
        }
      });
    }

    function markAsReceived({ user }: UserWithCompany) {
      const { mutate } = makeClient(user);
      return mutate<
        Pick<Mutation, "markAsAccepted">,
        MutationMarkAsReceivedArgs
      >(MARK_AS_RECEIVED, {
        variables: {
          id: form.id,
          receivedInfo: {
            wasteAcceptationStatus: "ACCEPTED",
            receivedAt: new Date().toISOString() as any,
            signedAt: new Date().toISOString() as any,
            receivedBy: "Destination",
            quantityReceived: 1
          }
        }
      });
    }

    async function isToCollectFor({ user, company }: UserWithCompany) {
      const { query } = makeClient(user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isToCollectFor: [company.siret!]
            }
          }
        }
      );
      return data.bsds.edges.map(e => e.node);
    }

    async function isCollectedFor({ user, company }: UserWithCompany) {
      const { query } = makeClient(user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isCollectedFor: [company.siret!]
            }
          }
        }
      );
      return data.bsds.edges.map(e => e.node);
    }

    async function isFollowFor({ user, company }: UserWithCompany) {
      const { query } = makeClient(user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isFollowFor: [company.siret!]
            }
          }
        }
      );
      return data.bsds.edges.map(e => e.node);
    }

    async function isForActionFor({ user, company }: UserWithCompany) {
      const { query } = makeClient(user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isForActionFor: [company.siret!]
            }
          }
        }
      );
      return data.bsds.edges.map(e => e.node);
    }

    // Expected tabs after emitter signature
    // - Transporter 1 => "À collecter"
    // - Transporter 2 => "Suivi"
    // - Transporter 3 => "Suivi"

    await indexForm(await getFormForElastic(form));
    await refreshElasticSearch();

    expect(await isToCollectFor(transporter1)).toEqual([
      expect.objectContaining({ id: form.id })
    ]);

    expect(await isFollowFor(transporter2)).toEqual([
      expect.objectContaining({ id: form.id })
    ]);

    expect(await isFollowFor(transporter3)).toEqual([
      expect.objectContaining({ id: form.id })
    ]);

    expect(await isFollowFor(destination)).toEqual([
      expect.objectContaining({ id: form.id })
    ]);

    await signTransport(transporter1);

    const formAfterTransporter1Signature = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });

    expect(formAfterTransporter1Signature.status).toEqual("SENT");

    // Expected tabs after first transporter signature
    // - Transporter 1 => "Collecté"
    // - Transporter 2 => "À collecter"
    // - Transporter 3 => "Suivi"
    // - Destination => "Pour Action"
    await refreshElasticSearch();

    expect(await isCollectedFor(transporter1)).toEqual([
      expect.objectContaining({ id: form.id })
    ]);
    expect(await isToCollectFor(transporter2)).toEqual([
      expect.objectContaining({ id: form.id })
    ]);
    expect(await isFollowFor(transporter3)).toEqual([
      expect.objectContaining({ id: form.id })
    ]);
    expect(await isForActionFor(destination)).toEqual([
      expect.objectContaining({ id: form.id })
    ]);

    await signTransport(transporter2);

    // Expected tabs after second transporter signature
    // - Transporter 1 => "Suivi"
    // - Transporter 2 => "Collecté"
    // - Transporter 3 => "À collecter"
    // - Destination => "Pour Action"
    await refreshElasticSearch();

    expect(await isFollowFor(transporter1)).toEqual([
      expect.objectContaining({ id: form.id })
    ]);
    expect(await isCollectedFor(transporter2)).toEqual([
      expect.objectContaining({ id: form.id })
    ]);
    expect(await isToCollectFor(transporter3)).toEqual([
      expect.objectContaining({ id: form.id })
    ]);
    expect(await isForActionFor(destination)).toEqual([
      expect.objectContaining({ id: form.id })
    ]);

    await signTransport(transporter3);

    // Expected tabs after third transporter signature
    // - Transporter 1 => "Suivi"
    // - Transporter 2 => "Suivi"
    // - Transporter 3 => "Collecté"
    // - Destination => "Pour Action"
    await refreshElasticSearch();

    expect(await isFollowFor(transporter1)).toEqual([
      expect.objectContaining({ id: form.id })
    ]);
    expect(await isFollowFor(transporter2)).toEqual([
      expect.objectContaining({ id: form.id })
    ]);
    expect(await isCollectedFor(transporter3)).toEqual([
      expect.objectContaining({ id: form.id })
    ]);
    expect(await isForActionFor(destination)).toEqual([
      expect.objectContaining({ id: form.id })
    ]);

    await markAsReceived(destination);
    // Expected tabs after destination acceptation
    // - Transporter 1 => "Suivi"
    // - Transporter 2 => "Suivi"
    // - Transporter 3 => "Suivi"
    // - Destination => "Pour Action"
    await refreshElasticSearch();

    expect(await isFollowFor(transporter1)).toEqual([
      expect.objectContaining({ id: form.id })
    ]);
    expect(await isFollowFor(transporter2)).toEqual([
      expect.objectContaining({ id: form.id })
    ]);
    expect(await isFollowFor(transporter3)).toEqual([
      expect.objectContaining({ id: form.id })
    ]);
    expect(await isForActionFor(destination)).toEqual([
      expect.objectContaining({ id: form.id })
    ]);
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
        transporters: {
          create: {
            transporterCompanySiret: recipientAndTransporter.company.siret,
            takenOverAt: new Date(),
            number: 1
          }
        },
        recipientCompanySiret: recipientAndTransporter.company.siret,
        status: "SENT"
      }
    });

    const rawForm = await getFormForElastic(form);

    await indexForm(rawForm);
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
            isCollectedFor: [recipientAndTransporter.company.siret!]
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
          isForActionFor: [recipientAndTransporter.company.siret!]
        }
      }
    });

    expect(res.data.bsds.edges).toEqual([
      expect.objectContaining({ node: { id: form.id } })
    ]);
  });

  it("should not return other user's bsds when no filter is passed", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });

    const anotherEmitter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });

    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: "PROCESSED",
        emitterCompanySiret: anotherEmitter.company.siret
      }
    });

    const formForElastic = await getFormForElastic(form);

    await indexForm(formForElastic);
    await refreshElasticSearch();

    const { query } = makeClient(emitter.user);

    const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(GET_BSDS);

    expect(data.bsds.edges).toHaveLength(0);
  });
});

describe("Form sub-resolvers in query bsds", () => {
  afterEach(resetDatabase);

  const GET_BSDS = gql`
    query GetBsds($where: BsdWhere) {
      bsds(where: $where) {
        edges {
          node {
            ... on Form {
              id
              transportSegments {
                id
                transporter {
                  company {
                    siret
                  }
                }
              }
              metadata {
                latestRevision {
                  status
                }
              }
            }
          }
        }
      }
    }
  `;

  test("Form.transportSegmnts should resolve correctly", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter2 = await userWithCompanyFactory("ADMIN");

    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret
      }
    });

    // ajoute un second transporteur
    const bsddTransporter2 = await prisma.bsddTransporter.create({
      data: {
        transporterCompanySiret: transporter2.company.siret,
        number: 2,
        formId: form.id
      }
    });

    await indexForm(await getFormForElastic(form));
    await refreshElasticSearch();
    const { query } = makeClient(emitter.user);
    const { data, errors } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
      GET_BSDS,
      {}
    );
    expect(errors).toBeUndefined();
    const forms = data.bsds!.edges.map(e => e.node);
    expect(forms).toHaveLength(1);
    expect((forms[0] as any).transportSegments).toHaveLength(1);
    expect(
      (forms[0] as any).transportSegments[0].transporter.company.siret
    ).toEqual(bsddTransporter2.transporterCompanySiret);
  });

  test("Form.metadata.latestRevision should resolve correctly when there is no revision", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");

    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret
      }
    });

    await indexForm(await getFormForElastic(form));
    await refreshElasticSearch();
    const { query } = makeClient(emitter.user);
    const { data, errors } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
      GET_BSDS,
      {}
    );
    expect(errors).toBeUndefined();
    const forms = data.bsds!.edges.map(e => e.node);
    expect(forms).toHaveLength(1);
    expect((forms[0] as any)!.metadata.latestRevision).toBeNull();
  });

  test("Form.metadata.latestRevision should resolve correctly when there are past revisions but no active", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");

    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret
      }
    });

    await prisma.bsddRevisionRequest.create({
      data: {
        comment: "a comment",
        bsddId: form.id,
        authoringCompanyId: emitter.company.id,
        wasteDetailsName: "waste name",
        status: "ACCEPTED"
      }
    });

    await indexForm(await getFormForElastic(form));
    await refreshElasticSearch();
    const { query } = makeClient(emitter.user);
    const { data, errors } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
      GET_BSDS,
      {}
    );
    expect(errors).toBeUndefined();
    const forms = data.bsds!.edges.map(e => e.node);
    expect(forms).toHaveLength(1);
    expect((forms[0] as any)!.metadata.latestRevision).toBeDefined();
    expect((forms[0] as any)!.metadata.latestRevision.status).toBe("ACCEPTED");
  });

  test("Form.metadata.latestRevision should resolve correctly when there are past and active revisions", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const destination = await userWithCompanyFactory("ADMIN");
    const broker = await userWithCompanyFactory("ADMIN");

    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        recipientCompanySiret: destination.company.siret,
        brokerCompanySiret: broker.company.siret
      }
    });

    // Accepted revision
    await prisma.bsddRevisionRequest.create({
      data: {
        comment: "a comment",
        bsddId: form.id,
        authoringCompanyId: emitter.company.id,
        wasteDetailsName: "waste name",
        status: "ACCEPTED"
      }
    });
    // Pending revision
    await prisma.bsddRevisionRequest.create({
      data: {
        comment: "a comment",
        bsddId: form.id,
        authoringCompanyId: emitter.company.id,
        wasteDetailsName: "waste name 2",
        status: "PENDING",
        approvals: {
          createMany: {
            data: [
              {
                status: "PENDING",
                approverSiret: destination.company.siret!
              },
              { status: "ACCEPTED", approverSiret: broker.company.siret! }
            ]
          }
        }
      }
    });

    await indexForm(await getFormForElastic(form));
    await refreshElasticSearch();
    const { query } = makeClient(emitter.user);
    const { data, errors } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
      GET_BSDS,
      {}
    );
    expect(errors).toBeUndefined();
    const forms = data.bsds!.edges.map(e => e.node);
    expect(forms).toHaveLength(1);
    expect((forms[0] as any)!.metadata.latestRevision).toBeDefined();
    expect((forms[0] as any)!.metadata.latestRevision.status).toBe("PENDING");
  });
});
