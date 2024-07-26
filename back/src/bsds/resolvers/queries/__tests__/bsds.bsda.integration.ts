import { BsdaConsistence, Company, User, UserRole } from "@prisma/client";
import {
  refreshElasticSearch,
  resetDatabase
} from "../../../../../integration-tests/helper";
import { getBsdaForElastic, indexBsda } from "../../../../bsda/elastic";
import {
  bsdaFactory,
  bsdaTransporterFactory
} from "../../../../bsda/__tests__/factories";
import { ErrorCode } from "../../../../common/errors";
import {
  Mutation,
  MutationCreateBsdaArgs,
  MutationCreateBsdaRevisionRequestArgs,
  MutationCreateDraftBsdaArgs,
  MutationDeleteBsdaArgs,
  MutationDuplicateBsdaArgs,
  MutationPublishBsdaArgs,
  MutationSignBsdaArgs,
  MutationSubmitBsdaRevisionRequestApprovalArgs,
  MutationUpdateBsdaArgs,
  Query,
  QueryBsdsArgs
} from "../../../../generated/graphql/types";
import { prisma } from "@td/prisma";
import {
  userWithCompanyFactory,
  transporterReceiptFactory,
  UserWithCompany
} from "../../../../__tests__/factories";
import { buildPdfAsBase64 } from "../../../../bsda/pdf/generator";
import makeClient from "../../../../__tests__/testClient";
import { gql } from "graphql-tag";

jest.mock("../../../../bsda/pdf/generator");
(buildPdfAsBase64 as jest.Mock).mockResolvedValue("");

const CREATE_DRAFT_BSDA = gql`
  mutation CreateDraftBsda($input: BsdaInput!) {
    createDraftBsda(input: $input) {
      id
    }
  }
`;

const CREATE_BSDA = gql`
  mutation CreateBsda($input: BsdaInput!) {
    createBsda(input: $input) {
      id
    }
  }
`;

const UPDATE_BSDA = gql`
  mutation UpdateBsda($id: ID!, $input: BsdaInput!) {
    updateBsda(id: $id, input: $input) {
      id
    }
  }
`;

const PUBLISH_BSDA = gql`
  mutation PublishBsda($id: ID!) {
    publishBsda(id: $id) {
      id
      status
      isDraft
    }
  }
`;
export const SIGN_BSDA = gql`
  mutation SignBsda($id: ID!, $input: BsdaSignatureInput!) {
    signBsda(id: $id, input: $input) {
      id
    }
  }
`;
const GET_BSDS = gql`
  query GetBsds($where: BsdWhere) {
    bsds(where: $where) {
      edges {
        node {
          ... on Bsda {
            id
          }
        }
      }
    }
  }
`;

describe("Query.bsds.bsda base workflow", () => {
  let emitter: { user: User; company: Company };
  let worker: { user: User; company: Company };
  let transporter: { user: User; company: Company };
  let destination: { user: User; company: Company };
  let bsdaId: string;
  let revisionRequestId: string;

  beforeAll(async () => {
    emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });
    worker = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["PRODUCER", "WORKER"]
      }
    });
    transporter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["TRANSPORTER"]
      }
    });
    await transporterReceiptFactory({ company: transporter.company });
    destination = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["WASTEPROCESSOR"]
      }
    });
  });
  afterAll(resetDatabase);

  describe("when a draft bsda is freshly created", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(emitter.user);

      const { data } = await mutate<
        Pick<Mutation, "createDraftBsda">,
        MutationCreateDraftBsdaArgs
      >(CREATE_DRAFT_BSDA, {
        variables: {
          input: {
            emitter: {
              isPrivateIndividual: false,
              company: {
                siret: emitter.company.siret,
                name: "The crusher",
                address: "Rue de la carcasse",
                contact: "Un centre VHU",
                phone: "0101010101",
                mail: "emitter@mail.com"
              }
            },
            worker: {
              company: {
                siret: worker.company.siret,
                name: "worker",
                address: "address",
                contact: "contactEmail",
                phone: "contactPhone",
                mail: "contactEmail@mail.com"
              },
              work: {
                hasEmitterPaperSignature: false
              }
            },
            transporter: {
              company: {
                siret: transporter.company.siret,
                name: "transporter",
                address: "address",
                contact: "contactEmail",
                phone: "contactPhone",
                mail: "contactEmail@mail.com"
              },
              transport: {
                mode: "ROAD",
                plates: ["AA-00-XX"]
              }
            },
            waste: {
              code: "06 07 01*",
              adr: "ADR",
              consistence: "SOLIDE",
              familyCode: "Code famille",
              materialName: "A material",
              sealNumbers: ["1", "2"]
            },
            packagings: [{ quantity: 1, type: "PALETTE_FILME" }],
            weight: { isEstimate: true, value: 1.2 },
            destination: {
              cap: "A cap",
              plannedOperationCode: "D 5",
              company: {
                siret: destination.company.siret,
                name: "destination",
                address: "address",
                contact: "contactEmail",
                phone: "contactPhone",
                mail: "contactEmail@mail.com"
              },
              reception: {
                acceptationStatus: "ACCEPTED",
                date: new Date().toISOString() as any,
                weight: 1
              },
              operation: {
                code: "D 5",
                mode: "ELIMINATION",
                date: new Date().toISOString() as any
              }
            }
          }
        }
      });
      bsdaId = data.createDraftBsda.id;
      await refreshElasticSearch();
    });

    it("should disallow unauthenticated user", async () => {
      const { query } = makeClient();

      const { errors } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isDraftFor: [emitter.company.siret!]
            }
          }
        }
      );
      expect(errors).toEqual([
        expect.objectContaining({
          message: "Vous n'êtes pas connecté.",
          extensions: expect.objectContaining({
            code: ErrorCode.UNAUTHENTICATED
          })
        })
      ]);
    });

    it("draft bsda should be isDraftFor emitter", async () => {
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
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });
    it("draft bsda should be isDraftFor worker", async () => {
      const { query } = makeClient(worker.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isDraftFor: [worker.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });
    it("draft bsda should be isDraftFor transporter", async () => {
      const { query } = makeClient(transporter.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isDraftFor: [transporter.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });
    it("draft bsda should be isDraftFor destination", async () => {
      const { query } = makeClient(destination.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isDraftFor: [destination.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });
  });

  describe("when the bsda is published", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(emitter.user);

      await mutate<Pick<Mutation, "publishBsda">, MutationPublishBsdaArgs>(
        PUBLISH_BSDA,
        {
          variables: {
            id: bsdaId
          }
        }
      );

      await refreshElasticSearch();
    });

    it("published bsda should be isForActionFor emitter", async () => {
      const { query } = makeClient(emitter.user);
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
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });

    it("published bsda should be isFollowFor worker", async () => {
      const { query } = makeClient(worker.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isFollowFor: [worker.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });

    it("published bsda should be isFollowFor transporter", async () => {
      const { query } = makeClient(transporter.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isFollowFor: [transporter.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });

    it("published bsda should be isFollowFor destination", async () => {
      const { query } = makeClient(destination.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isFollowFor: [transporter.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });
  });

  describe("when the bsd is signed by the producer (SIGNED_BY_PRODUCER)", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(emitter.user);

      await mutate<Pick<Mutation, "signBsda">, MutationSignBsdaArgs>(
        SIGN_BSDA,
        {
          variables: {
            id: bsdaId,
            input: { type: "EMISSION", author: "Patrick L'Emetteur" }
          }
        }
      );

      await refreshElasticSearch();
    });

    it("signed by emitter bsda should be isFollowFor emitter", async () => {
      const { query } = makeClient(emitter.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isFollowFor: [emitter.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });

    it("signed by emitter bsda should be isForActionFor worker", async () => {
      const { query } = makeClient(worker.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isForActionFor: [worker.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });

    it("signed by emitter bsda should be isFollowFor transporter", async () => {
      const { query } = makeClient(transporter.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isFollowFor: [transporter.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });

    it("signed by emitter bsda should be isFollowFor destination", async () => {
      const { query } = makeClient(destination.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isFollowFor: [destination.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });
  });

  describe("when the bsd is signed by the worker (SIGNED_BY_WORKER)", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(worker.user);

      await mutate<Pick<Mutation, "signBsda">, MutationSignBsdaArgs>(
        SIGN_BSDA,
        {
          variables: {
            id: bsdaId,
            input: { type: "WORK", author: "Henri Du Travailleur" }
          }
        }
      );

      await refreshElasticSearch();
    });

    it("signed by worker bsda should be isFollowFor emitter", async () => {
      const { query } = makeClient(emitter.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isFollowFor: [emitter.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });

    it("signed by worker bsda should be isFollowFor worker", async () => {
      const { query } = makeClient(worker.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isFollowFor: [worker.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });

    it("signed by worker bsda should be isToCollectFor transporter", async () => {
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
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });

    it("signed by worker bsda should be isFollowFor destination", async () => {
      const { query } = makeClient(destination.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isFollowFor: [destination.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });
  });

  describe("when the bsd is signed by the transporter (SENT)", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(transporter.user);

      await mutate<Pick<Mutation, "signBsda">, MutationSignBsdaArgs>(
        SIGN_BSDA,
        {
          variables: {
            id: bsdaId,
            input: { type: "TRANSPORT", author: "Franck Le Camion" }
          }
        }
      );

      await refreshElasticSearch();
    });

    it("sent bsda should be isFollowFor emitter", async () => {
      const { query } = makeClient(emitter.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isFollowFor: [emitter.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });

    it("sent bsda should be isFollowFor worker", async () => {
      const { query } = makeClient(worker.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isFollowFor: [worker.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });

    it("sent bsda should be isCollectedFor transporter", async () => {
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
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });

    it("sent bsda should be isForActionFor destination", async () => {
      const { query } = makeClient(destination.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isForActionFor: [destination.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });
  });

  describe("when the bsda operation is signed by the destination (PROCESSED)", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(destination.user);

      await mutate<Pick<Mutation, "signBsda">, MutationSignBsdaArgs>(
        SIGN_BSDA,
        {
          variables: {
            id: bsdaId,
            input: { type: "OPERATION", author: "Pierre Je Traite" }
          }
        }
      );

      await refreshElasticSearch();
    });

    it("processed bsda should be isArchivedFor emitter", async () => {
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
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });

    it("processed bsda should be isArchivedFor worker", async () => {
      const { query } = makeClient(worker.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isArchivedFor: [worker.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });

    it("processed bsda should be isArchivedFor transporter", async () => {
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
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });

    it("processed bsda should be isArchivedFor destination", async () => {
      const { query } = makeClient(destination.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isArchivedFor: [destination.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });
  });

  describe("when the BSDA is under revision", () => {
    beforeAll(async () => {
      expect(bsdaId).toBeDefined();
      const { mutate } = makeClient(destination.user);
      const CREATE_BSDA_REVISION_REQUEST = gql`
        mutation CreateBsdaRevisionRequest(
          $input: CreateBsdaRevisionRequestInput!
        ) {
          createBsdaRevisionRequest(input: $input) {
            id
          }
        }
      `;

      const { errors, data } = await mutate<
        Pick<Mutation, "createBsdaRevisionRequest">,
        MutationCreateBsdaRevisionRequestArgs
      >(CREATE_BSDA_REVISION_REQUEST, {
        variables: {
          input: {
            bsdaId,
            authoringCompanySiret: destination.company.siret!,
            comment: "oups",
            content: { waste: { code: "06 07 01*" } }
          }
        }
      });
      expect(errors).toBeUndefined();
      revisionRequestId = data.createBsdaRevisionRequest.id;
      await refreshElasticSearch();
    });

    it("should list bsd in emitter `isIsRevisionFor` bsdas", async () => {
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
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });

    it("should list bsd in worker `isIsRevisionFor` bsdas", async () => {
      const { query } = makeClient(worker.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isInRevisionFor: [worker.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });

    it("should list bsd in destination `isIsRevisionFor` bsdas", async () => {
      const { query } = makeClient(destination.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isInRevisionFor: [destination.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });
  });

  describe("when the BSDA revision has been accepted", () => {
    beforeAll(async () => {
      expect(bsdaId).toBeDefined();
      const SUBMIT_BSDA_REVISION_REQUEST_APPROVAL = gql`
        mutation SubmitBsdaRevisionRequestApproval(
          $id: ID!
          $isApproved: Boolean!
          $comment: String
        ) {
          submitBsdaRevisionRequestApproval(
            id: $id
            isApproved: $isApproved
            comment: $comment
          ) {
            id
          }
        }
      `;
      const { mutate: mutateByEmitter } = makeClient(emitter.user);

      const { errors: emitterErrors } = await mutateByEmitter<
        Pick<Mutation, "submitBsdaRevisionRequestApproval">,
        MutationSubmitBsdaRevisionRequestApprovalArgs
      >(SUBMIT_BSDA_REVISION_REQUEST_APPROVAL, {
        variables: {
          id: revisionRequestId,
          isApproved: true
        }
      });
      expect(emitterErrors).toBeUndefined();

      const { mutate: mutateByWorker } = makeClient(worker.user);

      const { errors: workerErrors } = await mutateByWorker<
        Pick<Mutation, "submitBsdaRevisionRequestApproval">,
        MutationSubmitBsdaRevisionRequestApprovalArgs
      >(SUBMIT_BSDA_REVISION_REQUEST_APPROVAL, {
        variables: {
          id: revisionRequestId,
          isApproved: true
        }
      });
      expect(workerErrors).toBeUndefined();

      await refreshElasticSearch();
    });

    it("should list bsd in emitter `isRevisedFor` bsdas", async () => {
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
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });

    it("should list bsd in worker `isRevisedFor` bsdas", async () => {
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
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });

    it("should list bsd in destination `isRevisedFor` bsdas", async () => {
      const { query } = makeClient(destination.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isRevisedFor: [destination.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });
  });

  describe("when the bsda operation is signed by the destination (AWAITING_CHILD)", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(destination.user);

      await prisma.bsda.update({
        where: { id: bsdaId },
        data: {
          destinationOperationCode: "D 15",
          destinationOperationMode: null,
          status: "SENT",
          destinationOperationSignatureDate: null,
          destinationOperationSignatureAuthor: null
        }
      });

      await mutate<Pick<Mutation, "signBsda">, MutationSignBsdaArgs>(
        SIGN_BSDA,
        {
          variables: {
            id: bsdaId,
            input: { type: "OPERATION", author: "Pierre Je Traite" }
          }
        }
      );

      await refreshElasticSearch();
    });

    it("processed bsda should be isFollowFor emitter", async () => {
      const { query } = makeClient(emitter.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isFollowFor: [emitter.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });

    it("processed bsda should be isFollowFor worker", async () => {
      const { query } = makeClient(worker.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isFollowFor: [worker.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });

    it("processed bsda should be isFollowFor transporter", async () => {
      const { query } = makeClient(transporter.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isFollowFor: [transporter.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });

    it("processed bsda should be isFollowFor destination", async () => {
      const { query } = makeClient(destination.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isFollowFor: [destination.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });
  });

  describe("when the bsda is refused", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(destination.user);

      await prisma.bsda.update({
        where: { id: bsdaId },
        data: {
          status: "SENT",
          destinationReceptionWeight: 0,
          destinationReceptionAcceptationStatus: "REFUSED",
          destinationReceptionRefusalReason: "Ugly waste...",
          destinationOperationCode: null,
          destinationOperationSignatureDate: null,
          destinationOperationSignatureAuthor: null
        }
      });

      await mutate<Pick<Mutation, "signBsda">, MutationSignBsdaArgs>(
        SIGN_BSDA,
        {
          variables: {
            id: bsdaId,
            input: { type: "OPERATION", author: "Pierre Je Traite" }
          }
        }
      );

      await refreshElasticSearch();
    });

    it("refused bsda should be isArchivedFor emitter", async () => {
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
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });

    it("refused bsda should be isArchivedFor worker", async () => {
      const { query } = makeClient(worker.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isArchivedFor: [worker.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });

    it("refused bsda should be isArchivedFor transporter", async () => {
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
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });

    it("refused bsda should be isArchivedFor destination", async () => {
      const { query } = makeClient(destination.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isArchivedFor: [destination.company.siret!]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: bsdaId } })
      ]);
    });
  });
});

describe("Query.bsds.bsdas multi-modal workflow", () => {
  let emitter: UserWithCompany;
  let worker: UserWithCompany;
  let transporter1: UserWithCompany;
  let transporter2: UserWithCompany;
  let transporter3: UserWithCompany;
  let destination: UserWithCompany;
  let bsdaId: string;

  beforeAll(async () => {
    emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });
    worker = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["PRODUCER", "WORKER"]
      }
    });
    transporter1 = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["TRANSPORTER"]
      }
    });
    await transporterReceiptFactory({ company: transporter1.company });
    transporter2 = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["TRANSPORTER"]
      }
    });
    await transporterReceiptFactory({ company: transporter2.company });
    transporter3 = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["TRANSPORTER"]
      }
    });
    await transporterReceiptFactory({ company: transporter3.company });
    destination = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["WASTEPROCESSOR"]
      }
    });
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_WORKER",
        emitterCompanySiret: emitter.company.siret,
        workerCompanySiret: worker.company.siret,
        destinationCompanySiret: destination.company.siret,
        emitterEmissionSignatureDate: new Date(),
        workerWorkSignatureDate: new Date()
      },
      transporterOpt: { transporterCompanySiret: transporter1.company.siret }
    });
    bsdaId = bsda.id;
    await bsdaTransporterFactory({
      bsdaId,
      opts: { transporterCompanySiret: transporter2.company.siret }
    });
    await bsdaTransporterFactory({
      bsdaId,
      opts: { transporterCompanySiret: transporter3.company.siret }
    });
    await indexBsda(await getBsdaForElastic(bsda));
    await refreshElasticSearch();
  });

  afterAll(resetDatabase);

  async function isToCollectFor({ user, company }: UserWithCompany) {
    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(GET_BSDS, {
      variables: {
        where: {
          isToCollectFor: [company.siret!]
        }
      }
    });
    return data.bsds.edges.map(e => e.node);
  }

  async function isCollectedFor({ user, company }: UserWithCompany) {
    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(GET_BSDS, {
      variables: {
        where: {
          isCollectedFor: [company.siret!]
        }
      }
    });
    return data.bsds.edges.map(e => e.node);
  }

  async function isFollowFor({ user, company }: UserWithCompany) {
    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(GET_BSDS, {
      variables: {
        where: {
          isFollowFor: [company.siret!]
        }
      }
    });
    return data.bsds.edges.map(e => e.node);
  }

  async function isForActionFor({ user, company }: UserWithCompany) {
    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(GET_BSDS, {
      variables: {
        where: {
          isForActionFor: [company.siret!]
        }
      }
    });
    return data.bsds.edges.map(e => e.node);
  }

  async function isArchivedFor({ user, company }: UserWithCompany) {
    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(GET_BSDS, {
      variables: {
        where: {
          isArchivedFor: [company.siret!]
        }
      }
    });
    return data.bsds.edges.map(e => e.node);
  }

  function signTransport({ user }: UserWithCompany) {
    const { mutate } = makeClient(user);
    return mutate<Pick<Mutation, "signBsda">, MutationSignBsdaArgs>(SIGN_BSDA, {
      variables: {
        id: bsdaId,
        input: {
          type: "TRANSPORT",
          author: "Transporteur",
          date: new Date().toISOString() as any
        }
      }
    });
  }

  function signOperation({ user }: UserWithCompany) {
    const { mutate } = makeClient(user);
    return mutate<Pick<Mutation, "signBsda">, MutationSignBsdaArgs>(SIGN_BSDA, {
      variables: {
        id: bsdaId,
        input: {
          type: "OPERATION",
          author: "Destination",
          date: new Date().toISOString() as any
        }
      }
    });
  }

  describe("when the BSDA is signed by worker", () => {
    // Expected tabs before first transporter signature
    // - Transporter 1 => "À collecter"
    // - Transporter 2 => "Suivi"
    // - Transporter 3 => "Suivi"
    // - Destination => "Suivi"
    it("should be in first transporter toCollect tab", async () => {
      expect(await isToCollectFor(transporter1)).toEqual([
        expect.objectContaining({ id: bsdaId })
      ]);
    });
    it("should be in second transporter follow tab", async () => {
      expect(await isFollowFor(transporter2)).toEqual([
        expect.objectContaining({ id: bsdaId })
      ]);
    });
    it("should be in third transporter follow tab", async () => {
      expect(await isFollowFor(transporter3)).toEqual([
        expect.objectContaining({ id: bsdaId })
      ]);
    });
    it("should be in the destination follow tab", async () => {
      expect(await isFollowFor(transporter3)).toEqual([
        expect.objectContaining({ id: bsdaId })
      ]);
    });
  });

  describe("when the BSDA is signed by first transporter", () => {
    beforeAll(async () => {
      await signTransport(transporter1);
      await refreshElasticSearch();
    });
    // Expected tabs after first transporter signature
    // - Transporter 1 => "Collecté"
    // - Transporter 2 => "À collecter"
    // - Transporter 3 => "Suivi"
    // - Destination => "Pour Action"

    it("should be in first transporter collected tab", async () => {
      expect(await isCollectedFor(transporter1)).toEqual([
        expect.objectContaining({ id: bsdaId })
      ]);
    });
    it("should be in the second transporter toCollect tab", async () => {
      expect(await isToCollectFor(transporter2)).toEqual([
        expect.objectContaining({ id: bsdaId })
      ]);
    });
    it("should be in the third transporter follow tab", async () => {
      expect(await isFollowFor(transporter3)).toEqual([
        expect.objectContaining({ id: bsdaId })
      ]);
    });
    it("should be in the destination forAction tab", async () => {
      // permet une réception anticipée
      expect(await isForActionFor(destination)).toEqual([
        expect.objectContaining({ id: bsdaId })
      ]);
    });
  });

  describe("when the BSDA is signed by the second transporter", () => {
    beforeAll(async () => {
      await signTransport(transporter2);
      await refreshElasticSearch();
    });
    // Expected tabs after second transporter signature
    // - Transporter 1 => "Suivi"
    // - Transporter 2 => "Collecté"
    // - Transporter 3 => "À Collecter"
    // - Destination => "Pour Action"

    it("should be in first transporter follow tab", async () => {
      expect(await isFollowFor(transporter1)).toEqual([
        expect.objectContaining({ id: bsdaId })
      ]);
    });
    it("should be in the second transporter collected tab", async () => {
      expect(await isCollectedFor(transporter2)).toEqual([
        expect.objectContaining({ id: bsdaId })
      ]);
    });
    it("should be in the third transporter toCollect tab", async () => {
      expect(await isToCollectFor(transporter3)).toEqual([
        expect.objectContaining({ id: bsdaId })
      ]);
    });
    it("should be in the destination forAction tab", async () => {
      // permet une réception anticipée
      expect(await isForActionFor(destination)).toEqual([
        expect.objectContaining({ id: bsdaId })
      ]);
    });
  });

  describe("when the BSDA is signed by the third transporter", () => {
    beforeAll(async () => {
      await signTransport(transporter3);
      await refreshElasticSearch();
    });
    // Expected tabs after third transporter signature
    // - Transporter 1 => "Suivi"
    // - Transporter 2 => "Suivi"
    // - Transporter 3 => "Collecté"
    // - Destination => "Pour Action"

    it("should be in first transporter follow tab", async () => {
      expect(await isFollowFor(transporter1)).toEqual([
        expect.objectContaining({ id: bsdaId })
      ]);
    });
    it("should be in the second transporter follow tab", async () => {
      expect(await isFollowFor(transporter2)).toEqual([
        expect.objectContaining({ id: bsdaId })
      ]);
    });
    it("should be in the third transporter collected tab", async () => {
      expect(await isCollectedFor(transporter3)).toEqual([
        expect.objectContaining({ id: bsdaId })
      ]);
    });
    it("should be in the destination forAction tab", async () => {
      expect(await isForActionFor(destination)).toEqual([
        expect.objectContaining({ id: bsdaId })
      ]);
    });
  });

  describe("when the BSDA is signed by the destination", () => {
    beforeAll(async () => {
      await signOperation(destination);
      await refreshElasticSearch();
    });
    // Expected tabs after destination signature
    // - Transporter 1 => "Archives"
    // - Transporter 2 => "Archives"
    // - Transporter 3 => "Archives"
    // - Destination => "Archives"

    it("should be in first transporter archived tab", async () => {
      expect(await isArchivedFor(transporter1)).toEqual([
        expect.objectContaining({ id: bsdaId })
      ]);
    });
    it("should be in the second transporter archived tab", async () => {
      expect(await isArchivedFor(transporter2)).toEqual([
        expect.objectContaining({ id: bsdaId })
      ]);
    });
    it("should be in the third transporter archived tab", async () => {
      expect(await isArchivedFor(transporter3)).toEqual([
        expect.objectContaining({ id: bsdaId })
      ]);
    });
    it("should be in the destination archived tab", async () => {
      expect(await isArchivedFor(destination)).toEqual([
        expect.objectContaining({ id: bsdaId })
      ]);
    });
  });
});

describe("Query.bsds.bsdas mutations", () => {
  afterAll(resetDatabase);

  it("deleted bsda should be removed from ES index", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret
      }
    });

    const bsdaElastic = await getBsdaForElastic(bsda);

    await indexBsda(bsdaElastic);
    await refreshElasticSearch();

    const { query } = makeClient(emitter.user);
    let res = await query<Pick<Query, "bsds">, QueryBsdsArgs>(GET_BSDS, {});

    // created bsda is indexed
    expect(res.data.bsds.edges).toEqual([
      expect.objectContaining({ node: { id: bsda.id } })
    ]);

    // then we delete it
    const { mutate } = makeClient(emitter.user);
    const DELETE_BSDA = `
      mutation DeleteBsda($id: ID!){
        deleteBsda(id: $id)  {
          id
        }
      }
    `;

    await mutate<Pick<Mutation, "deleteBsda">, MutationDeleteBsdaArgs>(
      DELETE_BSDA,
      {
        variables: {
          id: bsda.id
        }
      }
    );

    await refreshElasticSearch();

    res = await query<Pick<Query, "bsds">, QueryBsdsArgs>(GET_BSDS, {});
    // bsda si not indexed anymore
    expect(res.data.bsds.edges).toEqual([]);
  });

  it("duplicated bsda should be indexed", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret
      }
    });
    const elasticBsda = await getBsdaForElastic(bsda);
    await indexBsda(elasticBsda);

    // duplicate bsda
    const { mutate } = makeClient(emitter.user);

    const DUPLICATE_BSDA = `
    mutation DuplicateBsda($id: ID!){
      duplicateBsda(id: $id)  {
        id
        status
        isDraft
      }
    }
    `;

    const {
      data: { duplicateBsda }
    } = await mutate<
      Pick<Mutation, "duplicateBsda">,
      MutationDuplicateBsdaArgs
    >(DUPLICATE_BSDA, {
      variables: {
        id: bsda.id
      }
    });

    await refreshElasticSearch();

    const { query } = makeClient(emitter.user);
    const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
      GET_BSDS,
      {}
    );

    // duplicated bsda is indexed
    expect(data.bsds.edges.length).toEqual(2); // initial + duplicated bsda
    expect(data.bsds.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ node: { id: bsda.id } }),
        expect.objectContaining({ node: { id: duplicateBsda.id } })
      ])
    );
  });
});

describe("Bsda sub-resolvers in query bsds", () => {
  afterEach(resetDatabase);

  const GET_BSDS = gql`
    query GetBsds($where: BsdWhere) {
      bsds(where: $where) {
        edges {
          node {
            ... on Bsda {
              id
              groupedIn {
                id
              }
              forwardedIn {
                id
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

  test("Bsda.groupedIn should resolve correctly", async () => {
    const ttr = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const { query, mutate } = makeClient(ttr.user);
    const bsda = await bsdaFactory({
      opt: {
        wasteCode: "06 07 01*",
        destinationCompanySiret: ttr.company.siret,
        status: "AWAITING_CHILD",
        destinationOperationCode: "R 13"
      }
    });
    const {
      data: { createBsda }
    } = await mutate<Pick<Mutation, "createBsda">, MutationCreateBsdaArgs>(
      CREATE_BSDA,
      {
        variables: {
          input: {
            type: "GATHERING",
            waste: {
              code: "06 07 01*",
              materialName: "Test",
              pop: false,
              familyCode: "TEST",
              consistence: BsdaConsistence.SOLIDE
            },
            packagings: [{ quantity: 1, type: "BIG_BAG" }],
            weight: {
              isEstimate: true,
              value: 1
            },
            emitter: {
              company: {
                siret: ttr.company.siret,
                name: ttr.company.name,
                contact: ttr.company.contact,
                phone: ttr.company.contactPhone,
                mail: ttr.company.contactEmail,
                address: ttr.company.address
              }
            },
            destination: {
              company: {
                siret: destination.company.siret,
                name: destination.company.name,
                contact: destination.company.contact,
                phone: destination.company.contactPhone,
                mail: destination.company.contactEmail,
                address: destination.company.address
              },
              cap: "CAP",
              plannedOperationCode: "R 5"
            },
            grouping: [bsda.id]
          }
        }
      }
    );

    const bsdaSuite = createBsda;

    await refreshElasticSearch();

    const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
      GET_BSDS,
      {}
    );
    const bsdas = data.bsds!.edges.map(e => e.node);
    expect(bsdas).toHaveLength(2);
    const queriedBsda = bsdas.find(bsd => bsd.id === bsda.id);
    expect(queriedBsda).toBeDefined();
    expect((queriedBsda as any)!.groupedIn!.id).toEqual(bsdaSuite.id);
  });

  test("Bsda.groupedIn should be null when the bsda is removed from the groupement", async () => {
    const ttr = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);

    const { query, mutate } = makeClient(ttr.user);
    const bsda = await bsdaFactory({
      opt: {
        destinationCompanySiret: ttr.company.siret,
        status: "AWAITING_CHILD",
        wasteCode: "06 07 01*",
        destinationOperationCode: "R 13"
      }
    });

    const anotherBsda = await bsdaFactory({
      opt: {
        destinationCompanySiret: ttr.company.siret,
        status: "AWAITING_CHILD",
        wasteCode: "06 07 01*",
        destinationOperationCode: "R 13"
      }
    });

    const {
      data: { createBsda }
    } = await mutate<Pick<Mutation, "createBsda">, MutationCreateBsdaArgs>(
      CREATE_BSDA,
      {
        variables: {
          input: {
            type: "GATHERING",
            waste: {
              code: "06 07 01*",
              materialName: "Test",
              pop: false,
              familyCode: "TEST",
              consistence: BsdaConsistence.SOLIDE
            },
            packagings: [{ quantity: 1, type: "BIG_BAG" }],
            weight: {
              isEstimate: true,
              value: 1
            },
            emitter: {
              company: {
                siret: ttr.company.siret,
                name: ttr.company.name,
                contact: ttr.company.contact,
                phone: ttr.company.contactPhone,
                mail: ttr.company.contactEmail,
                address: ttr.company.address
              }
            },
            destination: {
              company: {
                siret: destination.company.siret,
                name: destination.company.name,
                contact: destination.company.contact,
                phone: destination.company.contactPhone,
                mail: destination.company.contactEmail,
                address: destination.company.address
              },
              cap: "CAP",
              plannedOperationCode: "R 5"
            },
            grouping: [bsda.id]
          }
        }
      }
    );

    const bsdaSuite = createBsda;
    await refreshElasticSearch();

    // Le BSDA initial est dissocié du BSDA de regroupement
    const { errors } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: { id: bsdaSuite.id, input: { grouping: [anotherBsda.id] } }
    });

    expect(errors).toBeUndefined();
    await refreshElasticSearch();

    const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
      GET_BSDS,
      {}
    );

    const bsdas = data.bsds!.edges.map(e => e.node);
    expect(bsdas).toHaveLength(3);
    const queriedBsda = bsdas.find(bsd => bsd.id === bsda.id);
    expect(queriedBsda).toBeDefined();
    expect((queriedBsda as any)!.groupedIn).toBeNull();
  });

  test("Bsda.forwardedIn should resolve correctly", async () => {
    const ttr = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const { query, mutate } = makeClient(ttr.user);
    const bsda = await bsdaFactory({
      opt: {
        destinationCompanySiret: ttr.company.siret,
        status: "AWAITING_CHILD",
        destinationOperationCode: "R 13"
      }
    });
    const {
      data: { createBsda }
    } = await mutate<Pick<Mutation, "createBsda">, MutationCreateBsdaArgs>(
      CREATE_BSDA,
      {
        variables: {
          input: {
            type: "RESHIPMENT",
            waste: {
              code: "06 07 01*",
              materialName: "Test",
              pop: false,
              familyCode: "TEST",
              consistence: BsdaConsistence.SOLIDE
            },
            packagings: [{ quantity: 1, type: "BIG_BAG" }],
            weight: {
              isEstimate: true,
              value: 1
            },
            emitter: {
              company: {
                siret: ttr.company.siret,
                name: ttr.company.name,
                contact: ttr.company.contact,
                phone: ttr.company.contactPhone,
                mail: ttr.company.contactEmail,
                address: ttr.company.address
              }
            },
            destination: {
              company: {
                siret: destination.company.siret,
                name: destination.company.name,
                contact: destination.company.contact,
                phone: destination.company.contactPhone,
                mail: destination.company.contactEmail,
                address: destination.company.address
              },
              cap: "CAP",
              plannedOperationCode: "R 5"
            },
            forwarding: bsda.id
          }
        }
      }
    );
    const bsdaSuite = createBsda;

    await refreshElasticSearch();

    const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
      GET_BSDS,
      {}
    );
    const bsdas = data.bsds!.edges.map(e => e.node);
    expect(bsdas).toHaveLength(2);
    const queriedBsda = bsdas.find(bsd => bsd.id === bsda.id);
    expect(queriedBsda).toBeDefined();
    expect((queriedBsda as any)!.forwardedIn!.id).toEqual(bsdaSuite.id);
  });

  test("Bsda.forwardedIn should be null when removed from the réexpedition", async () => {
    const ttr = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);

    const { query, mutate } = makeClient(ttr.user);

    const bsda = await bsdaFactory({
      opt: {
        destinationCompanySiret: ttr.company.siret,
        status: "AWAITING_CHILD",
        destinationOperationCode: "R 13"
      }
    });
    const anoterBsda = await bsdaFactory({
      opt: {
        destinationCompanySiret: ttr.company.siret,
        status: "AWAITING_CHILD",
        destinationOperationCode: "R 13"
      }
    });
    const {
      data: { createBsda }
    } = await mutate<Pick<Mutation, "createBsda">, MutationCreateBsdaArgs>(
      CREATE_BSDA,
      {
        variables: {
          input: {
            type: "RESHIPMENT",
            waste: {
              code: "06 07 01*",
              materialName: "Test",
              pop: false,
              familyCode: "TEST",
              consistence: BsdaConsistence.SOLIDE
            },
            packagings: [{ quantity: 1, type: "BIG_BAG" }],
            weight: {
              isEstimate: true,
              value: 1
            },
            emitter: {
              company: {
                siret: ttr.company.siret,
                name: ttr.company.name,
                contact: ttr.company.contact,
                phone: ttr.company.contactPhone,
                mail: ttr.company.contactEmail,
                address: ttr.company.address
              }
            },
            destination: {
              company: {
                siret: destination.company.siret,
                name: destination.company.name,
                contact: destination.company.contact,
                phone: destination.company.contactPhone,
                mail: destination.company.contactEmail,
                address: destination.company.address
              },
              cap: "CAP",
              plannedOperationCode: "R 5"
            },
            forwarding: bsda.id
          }
        }
      }
    );
    const bsdaSuite = createBsda;

    await refreshElasticSearch();

    // Le BSDA initial est dissocié du BSDA de réexpedition
    const { errors } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: { id: bsdaSuite.id, input: { forwarding: anoterBsda.id } }
    });

    expect(errors).toBeUndefined();
    await refreshElasticSearch();

    const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
      GET_BSDS,
      {}
    );
    const bsdas = data.bsds!.edges.map(e => e.node);
    expect(bsdas).toHaveLength(3);
    const queriedBsda = bsdas.find(bsd => bsd.id === bsda.id);
    expect(queriedBsda).toBeDefined();
    expect((queriedBsda as any)!.forwardedIn).toBeNull();
  });

  test("Bsda.metadata.latestRevision should resolve correctly when there are no revisions", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const worker = await userWithCompanyFactory(UserRole.ADMIN);
    const { query, mutate } = makeClient(emitter.user);
    await mutate<Pick<Mutation, "createBsda">, MutationCreateBsdaArgs>(
      CREATE_BSDA,
      {
        variables: {
          input: {
            type: "OTHER_COLLECTIONS",
            waste: { code: "06 07 01*" },
            emitter: {
              company: {
                siret: emitter.company.siret,
                name: emitter.company.name,
                contact: emitter.company.contact,
                phone: emitter.company.contactPhone,
                mail: emitter.company.contactEmail,
                address: emitter.company.address
              }
            },
            destination: {
              company: {
                siret: destination.company.siret,
                name: destination.company.name,
                contact: destination.company.contact,
                phone: destination.company.contactPhone,
                mail: destination.company.contactEmail,
                address: destination.company.address
              },
              cap: "CAP",
              plannedOperationCode: "R 5"
            },
            worker: {
              company: {
                siret: worker.company.siret,
                name: worker.company.name,
                contact: worker.company.contact,
                phone: worker.company.contactPhone,
                mail: worker.company.contactEmail,
                address: worker.company.address
              }
            }
          }
        }
      }
    );

    await refreshElasticSearch();

    const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
      GET_BSDS,
      {}
    );
    const bsdas = data.bsds!.edges.map(e => e.node);
    expect(bsdas).toHaveLength(1);
    expect((bsdas[0] as any)!.metadata.latestRevision).toBeNull();
  });

  test("Bsda.metadata.latestRevision should resolve correctly when there are past revisions but no active", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const worker = await userWithCompanyFactory(UserRole.ADMIN);
    const { query, mutate } = makeClient(emitter.user);
    const {
      data: { createBsda }
    } = await mutate<Pick<Mutation, "createBsda">, MutationCreateBsdaArgs>(
      CREATE_BSDA,
      {
        variables: {
          input: {
            type: "OTHER_COLLECTIONS",
            waste: { code: "06 07 01*" },
            emitter: {
              company: {
                siret: emitter.company.siret,
                name: emitter.company.name,
                contact: emitter.company.contact,
                phone: emitter.company.contactPhone,
                mail: emitter.company.contactEmail,
                address: emitter.company.address
              }
            },
            destination: {
              company: {
                siret: destination.company.siret,
                name: destination.company.name,
                contact: destination.company.contact,
                phone: destination.company.contactPhone,
                mail: destination.company.contactEmail,
                address: destination.company.address
              },
              cap: "CAP",
              plannedOperationCode: "R 5"
            },
            worker: {
              company: {
                siret: worker.company.siret,
                name: worker.company.name,
                contact: worker.company.contact,
                phone: worker.company.contactPhone,
                mail: worker.company.contactEmail,
                address: worker.company.address
              }
            }
          }
        }
      }
    );

    await prisma.bsdaRevisionRequest.create({
      data: {
        comment: "a comment",
        bsdaId: createBsda.id,
        authoringCompanyId: emitter.company.id,
        wasteCode: "06 07 02*",
        status: "ACCEPTED"
      }
    });

    const bsdaElastic = await getBsdaForElastic(createBsda);
    await indexBsda(bsdaElastic);
    await refreshElasticSearch();

    const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
      GET_BSDS,
      {}
    );
    const bsdas = data.bsds!.edges.map(e => e.node);
    expect(bsdas).toHaveLength(1);
    expect((bsdas[0] as any)!.metadata.latestRevision).toBeDefined();
    expect((bsdas[0] as any)!.metadata.latestRevision.status).toBe("ACCEPTED");
  });

  test("Bsda.metadata.latestRevision should resolve correctly when there are past and active revisions", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const worker = await userWithCompanyFactory(UserRole.ADMIN);
    const { query, mutate } = makeClient(emitter.user);
    const {
      data: { createBsda }
    } = await mutate<Pick<Mutation, "createBsda">, MutationCreateBsdaArgs>(
      CREATE_BSDA,
      {
        variables: {
          input: {
            type: "OTHER_COLLECTIONS",
            waste: { code: "06 07 01*" },
            emitter: {
              company: {
                siret: emitter.company.siret,
                name: emitter.company.name,
                contact: emitter.company.contact,
                phone: emitter.company.contactPhone,
                mail: emitter.company.contactEmail,
                address: emitter.company.address
              }
            },
            destination: {
              company: {
                siret: destination.company.siret,
                name: destination.company.name,
                contact: destination.company.contact,
                phone: destination.company.contactPhone,
                mail: destination.company.contactEmail,
                address: destination.company.address
              },
              cap: "CAP",
              plannedOperationCode: "R 5"
            },
            worker: {
              company: {
                siret: worker.company.siret,
                name: worker.company.name,
                contact: worker.company.contact,
                phone: worker.company.contactPhone,
                mail: worker.company.contactEmail,
                address: worker.company.address
              }
            }
          }
        }
      }
    );

    // Accepted revision
    await prisma.bsdaRevisionRequest.create({
      data: {
        comment: "a comment",
        bsdaId: createBsda.id,
        authoringCompanyId: emitter.company.id,
        wasteCode: "06 07 02*",
        status: "ACCEPTED"
      }
    });
    // Pending revision
    await prisma.bsdaRevisionRequest.create({
      data: {
        comment: "a comment",
        bsdaId: createBsda.id,
        authoringCompanyId: emitter.company.id,
        wasteCode: "06 07 02*",
        status: "PENDING",
        approvals: {
          createMany: {
            data: [
              {
                status: "PENDING",
                approverSiret: destination.company.siret!
              },
              { status: "ACCEPTED", approverSiret: worker.company.siret! }
            ]
          }
        }
      }
    });

    const bsdaElastic = await getBsdaForElastic(createBsda);
    await indexBsda(bsdaElastic);
    await refreshElasticSearch();

    const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
      GET_BSDS,
      {}
    );
    const bsdas = data.bsds!.edges.map(e => e.node);
    expect(bsdas).toHaveLength(1);
    expect((bsdas[0] as any)!.metadata.latestRevision).toBeDefined();
    expect((bsdas[0] as any)!.metadata.latestRevision.status).toBe("PENDING");
  });
});
