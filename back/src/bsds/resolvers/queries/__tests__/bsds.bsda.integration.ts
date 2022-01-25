import { Company, User, UserRole } from "@prisma/client";
import {
  refreshElasticSearch,
  resetDatabase
} from "../../../../../integration-tests/helper";
import { indexBsda } from "../../../../bsda/elastic";
import { bsdaFactory } from "../../../../bsda/__tests__/factories";
import { ErrorCode } from "../../../../common/errors";
import {
  Mutation,
  MutationCreateDraftBsdaArgs,
  MutationDeleteBsdaArgs,
  MutationDuplicateBsdaArgs,
  MutationPublishBsdaArgs,
  MutationSignBsdaArgs,
  Query,
  QueryBsdsArgs
} from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { GET_BSDS } from "./queries";

const CREATE_DRAFT_BSDA = `
mutation CreateDraftBsda($input: BsdaInput!) {
  createDraftBsda(input: $input)  {
    id
  }
}
`;

const PUBLISH_BSDA = `
mutation PublishBsda($id: ID!){
  publishBsda(id: $id)  {
    id
    status
    isDraft
  }
}
`;
export const SIGN_BSDA = `
mutation SignBsda($id: ID!, $input: BsdaSignatureInput
!) {
  signBsda(id: $id, input: $input	) {
    id
  }
}
`;

describe("Query.bsds.bsda base workflow", () => {
  let emitter: { user: User; company: Company };
  let worker: { user: User; company: Company };
  let transporter: { user: User; company: Company };
  let destination: { user: User; company: Company };
  let bsdaId: string;
  let indexedBsda;

  beforeAll(async () => {
    emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });
    worker = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });
    transporter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["TRANSPORTER"]
      }
    });
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
              recepisse: {
                department: "83",
                number: "1234",
                validityLimit: new Date().toISOString() as any
              }
            },
            waste: {
              code: "16 01 06",
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
              plannedOperationCode: "D 13",
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
                code: "D 9",
                date: new Date().toISOString() as any
              }
            }
          }
        }
      });
      bsdaId = data.createDraftBsda.id;
      indexedBsda = {
        bsda: {
          type: "OTHER_COLLECTIONS",
          worker: {
            company: { name: "worker", siret: worker.company.siret }
          }
        },
        bsdasri: null,
        bsdd: null,
        destination: {
          company: { name: "destination", siret: destination.company.siret }
        },
        emitter: {
          company: { name: "The crusher", siret: emitter.company.siret }
        },
        id: bsdaId,
        isDraft: true,
        readableId: bsdaId,
        status: "INITIAL",
        transporter: {
          company: {
            name: "transporter",
            siret: transporter.company.siret
          },
          customInfo: "",
          numberPlate: []
        },
        type: "BSDA",
        waste: { code: "16 01 06", description: "16 01 06, A material" }
      };

      await refreshElasticSearch();
    });

    it("should disallow unauthenticated user", async () => {
      const { query } = makeClient();

      const { errors } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isDraftFor: [emitter.company.siret]
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
              isDraftFor: [emitter.company.siret]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        {
          node: indexedBsda
        }
      ]);
    });
    it("draft bsda should be isDraftFor worker", async () => {
      const { query } = makeClient(worker.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isDraftFor: [worker.company.siret]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        {
          node: indexedBsda
        }
      ]);
    });
    it("draft bsda should be isDraftFor transporter", async () => {
      const { query } = makeClient(transporter.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isDraftFor: [transporter.company.siret]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        {
          node: indexedBsda
        }
      ]);
    });
    it("draft bsda should be isDraftFor destination", async () => {
      const { query } = makeClient(destination.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isDraftFor: [destination.company.siret]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        {
          node: indexedBsda
        }
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
      indexedBsda.isDraft = false;
      await refreshElasticSearch();
    });

    it("published bsda should be isForActionFor emitter", async () => {
      const { query } = makeClient(emitter.user);
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
        {
          node: indexedBsda
        }
      ]);
    });

    it("published bsda should be isFollowFor worker", async () => {
      const { query } = makeClient(worker.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isFollowFor: [worker.company.siret]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        {
          node: indexedBsda
        }
      ]);
    });

    it("published bsda should be isFollowFor transporter", async () => {
      const { query } = makeClient(transporter.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isFollowFor: [transporter.company.siret]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        {
          node: indexedBsda
        }
      ]);
    });

    it("published bsda should be isFollowFor destination", async () => {
      const { query } = makeClient(destination.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isFollowFor: [transporter.company.siret]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        {
          node: indexedBsda
        }
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
      indexedBsda.status = "SIGNED_BY_PRODUCER";

      await refreshElasticSearch();
    });

    it("signed by emitter bsda should be isFollowFor emitter", async () => {
      const { query } = makeClient(emitter.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isFollowFor: [emitter.company.siret]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        {
          node: indexedBsda
        }
      ]);
    });

    it("signed by emitter bsda should be isForActionFor worker", async () => {
      const { query } = makeClient(worker.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isForActionFor: [worker.company.siret]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        {
          node: indexedBsda
        }
      ]);
    });

    it("signed by emitter bsda should be isFollowFor transporter", async () => {
      const { query } = makeClient(transporter.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isFollowFor: [transporter.company.siret]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        {
          node: indexedBsda
        }
      ]);
    });

    it("signed by emitter bsda should be isFollowFor destination", async () => {
      const { query } = makeClient(destination.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isFollowFor: [destination.company.siret]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        {
          node: indexedBsda
        }
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
      indexedBsda.status = "SIGNED_BY_WORKER";

      await refreshElasticSearch();
    });

    it("signed by worker bsda should be isFollowFor emitter", async () => {
      const { query } = makeClient(emitter.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isFollowFor: [emitter.company.siret]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        {
          node: indexedBsda
        }
      ]);
    });

    it("signed by worker bsda should be isFollowFor worker", async () => {
      const { query } = makeClient(worker.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isFollowFor: [worker.company.siret]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        {
          node: indexedBsda
        }
      ]);
    });

    it("signed by worker bsda should be isToCollectFor transporter", async () => {
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
        {
          node: indexedBsda
        }
      ]);
    });

    it("signed by worker bsda should be isFollowFor destination", async () => {
      const { query } = makeClient(destination.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isFollowFor: [destination.company.siret]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        {
          node: indexedBsda
        }
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
      indexedBsda.status = "SENT";

      await refreshElasticSearch();
    });

    it("sent bsda should be isFollowFor emitter", async () => {
      const { query } = makeClient(emitter.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isFollowFor: [emitter.company.siret]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        {
          node: indexedBsda
        }
      ]);
    });

    it("sent bsda should be isFollowFor worker", async () => {
      const { query } = makeClient(worker.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isFollowFor: [worker.company.siret]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        {
          node: indexedBsda
        }
      ]);
    });

    it("sent bsda should be isCollectedFor transporter", async () => {
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
        {
          node: indexedBsda
        }
      ]);
    });

    it("sent bsda should be isForActionFor destination", async () => {
      const { query } = makeClient(destination.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isForActionFor: [destination.company.siret]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        {
          node: indexedBsda
        }
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

      indexedBsda.status = "PROCESSED";

      await refreshElasticSearch();
    });

    it("processed bsda should be isArchivedFor emitter", async () => {
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
        {
          node: indexedBsda
        }
      ]);
    });

    it("processed bsda should be isArchivedFor worker", async () => {
      const { query } = makeClient(worker.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isArchivedFor: [worker.company.siret]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        {
          node: indexedBsda
        }
      ]);
    });

    it("processed bsda should be isArchivedFor transporter", async () => {
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
        {
          node: indexedBsda
        }
      ]);
    });

    it("processed bsda should be isArchivedFor destination", async () => {
      const { query } = makeClient(destination.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isArchivedFor: [destination.company.siret]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        {
          node: indexedBsda
        }
      ]);
    });
  });

  describe("when the bsda operation is signed by the destination (AWAITING_CHILD)", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(destination.user);

      await prisma.bsda.update({
        where: { id: bsdaId },
        data: {
          destinationOperationCode: "D 13",
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

      indexedBsda.status = "AWAITING_CHILD";

      await refreshElasticSearch();
    });

    it("processed bsda should be isFollowFor emitter", async () => {
      const { query } = makeClient(emitter.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isFollowFor: [emitter.company.siret]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        {
          node: indexedBsda
        }
      ]);
    });

    it("processed bsda should be isFollowFor worker", async () => {
      const { query } = makeClient(worker.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isFollowFor: [worker.company.siret]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        {
          node: indexedBsda
        }
      ]);
    });

    it("processed bsda should be isFollowFor transporter", async () => {
      const { query } = makeClient(transporter.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isFollowFor: [transporter.company.siret]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        {
          node: indexedBsda
        }
      ]);
    });

    it("processed bsda should be isFollowFor destination", async () => {
      const { query } = makeClient(destination.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isFollowFor: [destination.company.siret]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        {
          node: indexedBsda
        }
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
      indexedBsda.status = "REFUSED";

      await refreshElasticSearch();
    });

    it("refused bsda should be isArchivedFor emitter", async () => {
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
        {
          node: indexedBsda
        }
      ]);
    });

    it("refused bsda should be isArchivedFor worker", async () => {
      const { query } = makeClient(worker.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isArchivedFor: [worker.company.siret]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        {
          node: indexedBsda
        }
      ]);
    });

    it("refused bsda should be isArchivedFor transporter", async () => {
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
        {
          node: indexedBsda
        }
      ]);
    });

    it("refused bsda should be isArchivedFor destination", async () => {
      const { query } = makeClient(destination.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isArchivedFor: [destination.company.siret]
            }
          }
        }
      );

      expect(data.bsds.edges).toEqual([
        {
          node: indexedBsda
        }
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

    await indexBsda(bsda);
    await refreshElasticSearch();

    const { query } = makeClient(emitter.user);
    let res = await query<Pick<Query, "bsds">, QueryBsdsArgs>(GET_BSDS, {});

    // created bsda is indexed
    const ids = res.data.bsds.edges.map(edge => edge.node.id);
    expect(ids).toEqual([bsda.id]);

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
    await indexBsda(bsda);

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

    await indexBsda(bsda);
    await refreshElasticSearch();

    const { query } = makeClient(emitter.user);
    const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
      GET_BSDS,
      {}
    );

    // duplicated bsda is indexed

    const ids = data.bsds.edges.map(edge => edge.node.id);
    expect(ids.length).toEqual(2); // initial + duplicated bsda
    expect(ids).toEqual(expect.arrayContaining([bsda.id, duplicateBsda.id]));
  });
});
