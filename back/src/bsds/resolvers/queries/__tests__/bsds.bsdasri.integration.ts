import {
  Company,
  User,
  UserRole,
  WasteAcceptationStatus
} from "@prisma/client";
import { prisma } from "@td/prisma";
import type {
  Query,
  QueryBsdsArgs,
  Mutation,
  MutationCreateDraftBsdasriArgs,
  MutationPublishBsdasriArgs,
  MutationSignBsdasriArgs,
  MutationDeleteBsdasriArgs,
  MutationDuplicateBsdasriArgs,
  MutationCreateBsdasriRevisionRequestArgs,
  MutationSubmitBsdasriRevisionRequestApprovalArgs
} from "@td/codegen-back";
import {
  resetDatabase,
  refreshElasticSearch
} from "../../../../../integration-tests/helper";
import makeClient from "../../../../__tests__/testClient";
import { ErrorCode } from "../../../../common/errors";
import {
  BsdasriForElasticInclude,
  getBsdasriForElastic,
  indexBsdasri
} from "../../../../bsdasris/elastic";
import {
  userWithCompanyFactory,
  transporterReceiptFactory
} from "../../../../__tests__/factories";
import { bsdasriFactory } from "../../../../bsdasris/__tests__/factories";
import gql from "graphql-tag";

const CREATE_DRAFT_DASRI = `
mutation CreateDraftDasri($input: BsdasriInput!) {
   createDraftBsdasri(input: $input)  {
    id
  }
}
`;

const PUBLISH_DASRI = `
mutation PublishDasri($id:  ID!){
  publishBsdasri(id: $id)  {
    id
    status
    isDraft
  }
}
`;
export const SIGN_DASRI = `
mutation SignDasri($id: ID!, $input: BsdasriSignatureInput
!) {
  signBsdasri(id: $id, input: $input	) {
    id
  }
}
`;
const GET_BSDS = `
  query GetBsds($where: BsdWhere) {
    bsds(where: $where) {
      edges {
        node {
          ... on Bsdasri {
            id
          }
        }
      }
    }
  }
`;

describe("Query.bsds.dasris base workflow", () => {
  let emitter: { user: User; company: Company };
  let transporter: { user: User; company: Company };
  let destination: { user: User; company: Company };
  let bsdasriId: string;

  let revisionRequestId: string;

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
    await transporterReceiptFactory({ company: transporter.company });
    destination = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["WASTEPROCESSOR"]
      }
    });
  });
  afterAll(resetDatabase);

  describe("when a draft bsdasri is freshly created", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(emitter.user);

      const {
        data: {
          createDraftBsdasri: { id }
        }
      } = await mutate<
        Pick<Mutation, "createDraftBsdasri">,
        MutationCreateDraftBsdasriArgs
      >(CREATE_DRAFT_DASRI, {
        variables: {
          input: {
            waste: {
              code: "18 01 03*",
              adr: "xyz 33"
            },
            emitter: {
              company: {
                name: "hopital blanc",
                siret: emitter.company.siret,
                contact: "jean durand",
                phone: "06 18 76 02 00",
                mail: "emitter@test.fr",
                address: "avenue de la mer"
              },
              emission: {
                weight: { value: 23, isEstimate: false },
                packagings: [
                  {
                    type: "BOITE_CARTON",
                    volume: 22,
                    quantity: 3
                  }
                ]
              }
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
              transport: {
                takenOverAt: new Date().toISOString() as any,

                weight: { value: 99, isEstimate: false },
                plates: ["TRANSPORTER-PLATE"],
                packagings: [{ type: "FUT", quantity: 44, volume: 123 }],

                acceptation: { status: WasteAcceptationStatus.ACCEPTED }
              }
            },
            destination: {
              company: {
                siret: destination.company.siret,
                name: "JEANNE COLLECTEUR",
                address: "38 bis allée des anges",
                contact: "Jeanne",
                mail: "jeanne@gmail.com",
                phone: "06"
              },
              reception: {
                packagings: [{ type: "FUT", quantity: 44, volume: 123 }],
                acceptation: { status: WasteAcceptationStatus.ACCEPTED },
                date: new Date().toISOString() as any
              },
              operation: {
                weight: { value: 99 },
                code: "D10",
                mode: "ELIMINATION",
                date: new Date().toISOString() as any
              }
            }
          }
        }
      });
      bsdasriId = id;
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

    it("draft bsdasri should be isDraftFor emitter", async () => {
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
        expect.objectContaining({ node: { id: bsdasriId } })
      ]);
    });
    it("draft bsdasri should be isDraftFor transporter", async () => {
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
        expect.objectContaining({ node: { id: bsdasriId } })
      ]);
    });
    it("draft bsdasri should be isDraftFor destination", async () => {
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
        expect.objectContaining({ node: { id: bsdasriId } })
      ]);
    });
  });

  describe("when the bsdasri is published", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(emitter.user);

      await mutate<
        Pick<Mutation, "publishBsdasri">,
        MutationPublishBsdasriArgs
      >(PUBLISH_DASRI, {
        variables: {
          id: bsdasriId
        }
      });

      await refreshElasticSearch();
    });

    it("published bsdasri should be isForActionFor emitter", async () => {
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
        expect.objectContaining({ node: { id: bsdasriId } })
      ]);
    });

    it("published bsdasri should be isToCollectFor transporter", async () => {
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
        expect.objectContaining({ node: { id: bsdasriId } })
      ]);
    });

    it("published bsdasri should be isFollowFor destination", async () => {
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
        expect.objectContaining({ node: { id: bsdasriId } })
      ]);
    });
  });

  describe("when the bsd is signed by the producer", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(emitter.user);

      await mutate<Pick<Mutation, "signBsdasri">, MutationSignBsdasriArgs>(
        SIGN_DASRI,
        {
          variables: {
            id: bsdasriId,
            input: { type: "EMISSION", author: "Marcel" }
          }
        }
      );

      await refreshElasticSearch();
    });

    it("signed by emitter bsdasri should be isFollowFor emitter", async () => {
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
        expect.objectContaining({ node: { id: bsdasriId } })
      ]);
    });

    it("signed by emitter bsdasri should be isToCollectFor transporter", async () => {
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
        expect.objectContaining({ node: { id: bsdasriId } })
      ]);
    });

    it("signed by emitter bsdasri should be isFollowFor destination", async () => {
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
        expect.objectContaining({ node: { id: bsdasriId } })
      ]);
    });
  });

  describe("when the bsd is signed by the transporteur (sent)", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(transporter.user);

      await mutate<Pick<Mutation, "signBsdasri">, MutationSignBsdasriArgs>(
        SIGN_DASRI,
        {
          variables: {
            id: bsdasriId,
            input: { type: "TRANSPORT", author: "Bill" }
          }
        }
      );

      await refreshElasticSearch();
    });

    it("sent bsdasri should be isFollowFor emitter", async () => {
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
        expect.objectContaining({ node: { id: bsdasriId } })
      ]);
    });

    it("sent by emitter bsdasri should be isCollectedFor transporter", async () => {
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
        expect.objectContaining({ node: { id: bsdasriId } })
      ]);
    });

    it("sent by emitter bsdasri should be isForActionFor destination", async () => {
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
        expect.objectContaining({ node: { id: bsdasriId } })
      ]);
    });
  });

  describe("when the bsdasri reception is signed by the destination", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(destination.user);

      await mutate<Pick<Mutation, "signBsdasri">, MutationSignBsdasriArgs>(
        SIGN_DASRI,
        {
          variables: {
            id: bsdasriId,
            input: { type: "RECEPTION", author: "Bill" }
          }
        }
      );

      await refreshElasticSearch();
    });

    it("received bsdasri should be isFollowFor emitter", async () => {
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
        expect.objectContaining({ node: { id: bsdasriId } })
      ]);
    });

    it("received by emitter bsdasri should be isFollowFor transporter", async () => {
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
        expect.objectContaining({ node: { id: bsdasriId } })
      ]);
    });

    it("received by emitter bsdasri should be isForActionFor destination", async () => {
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
        expect.objectContaining({ node: { id: bsdasriId } })
      ]);
    });
  });

  describe("when the bsdasri operation is signed by the destination", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(destination.user);

      await mutate<Pick<Mutation, "signBsdasri">, MutationSignBsdasriArgs>(
        SIGN_DASRI,
        {
          variables: {
            id: bsdasriId,
            input: { type: "OPERATION", author: "Bill" }
          }
        }
      );

      await refreshElasticSearch();
    });

    it("processed bsdasri should be isArchivedFor emitter", async () => {
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
        expect.objectContaining({ node: { id: bsdasriId } })
      ]);
    });

    it("processed bsdasri should be isArchivedFor transporter", async () => {
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
        expect.objectContaining({ node: { id: bsdasriId } })
      ]);
    });

    it("processed bsdasri should be isArchivedFor destination", async () => {
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
        expect.objectContaining({ node: { id: bsdasriId } })
      ]);
    });
  });

  describe("when the bsdasri is under revision", () => {
    beforeAll(async () => {
      expect(bsdasriId).toBeDefined();
      const { mutate } = makeClient(destination.user);
      const CREATE_BSDASRI_REVISION_REQUEST = gql`
        mutation CreateBsdasriRevisionRequest(
          $input: CreateBsdasriRevisionRequestInput!
        ) {
          createBsdasriRevisionRequest(input: $input) {
            id
          }
        }
      `;

      const { errors, data } = await mutate<
        Pick<Mutation, "createBsdasriRevisionRequest">,
        MutationCreateBsdasriRevisionRequestArgs
      >(CREATE_BSDASRI_REVISION_REQUEST, {
        variables: {
          input: {
            bsdasriId,
            authoringCompanySiret: destination.company.siret!,
            comment: "oups",
            content: { waste: { code: "18 02 02*" } }
          }
        }
      });
      expect(errors).toBeUndefined();
      revisionRequestId = data.createBsdasriRevisionRequest.id;
      await refreshElasticSearch();
    });

    it("should list bsd in emitter `isIsRevisionFor` bsdasris", async () => {
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
        expect.objectContaining({ node: { id: bsdasriId } })
      ]);
    });

    it("should list bsd in destination `isIsRevisionFor` bsdasris", async () => {
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
        expect.objectContaining({ node: { id: bsdasriId } })
      ]);
    });
  });

  describe("when the bsdasri revision has been accepted", () => {
    beforeAll(async () => {
      expect(bsdasriId).toBeDefined();
      const SUBMIT_BSDASRI_REVISION_REQUEST_APPROVAL = gql`
        mutation SubmitBsdasriRevisionRequestApproval(
          $id: ID!
          $isApproved: Boolean!
          $comment: String
        ) {
          submitBsdasriRevisionRequestApproval(
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
        Pick<Mutation, "submitBsdasriRevisionRequestApproval">,
        MutationSubmitBsdasriRevisionRequestApprovalArgs
      >(SUBMIT_BSDASRI_REVISION_REQUEST_APPROVAL, {
        variables: {
          id: revisionRequestId,
          isApproved: true
        }
      });
      expect(emitterErrors).toBeUndefined();

      await refreshElasticSearch();
    });

    it("should list bsd in emitter `isRevisedFor` bsdasris", async () => {
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
        expect.objectContaining({ node: { id: bsdasriId } })
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
        expect.objectContaining({ node: { id: bsdasriId } })
      ]);
    });
  });

  describe("when the bsdasri is refused", () => {
    // should be run after revisions tests
    beforeAll(async () => {
      const refusedDasri = await prisma.bsdasri.update({
        where: { id: bsdasriId },
        data: { status: "REFUSED" },
        include: BsdasriForElasticInclude
      });
      await indexBsdasri(refusedDasri);
      await refreshElasticSearch();
    });

    it("refused bsdasri should be isArchivedFor emitter", async () => {
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
        expect.objectContaining({ node: { id: bsdasriId } })
      ]);
    });

    it("refused bsdasri should be isArchivedFor transporter", async () => {
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
        expect.objectContaining({ node: { id: bsdasriId } })
      ]);
    });

    it("refused  bsdasri should be isArchivedFor destination", async () => {
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
        expect.objectContaining({ node: { id: bsdasriId } })
      ]);
    });
  });
});

describe("Query.bsds.dasris mutations", () => {
  afterAll(resetDatabase);

  it("deleted bsdasri should be removed from es index", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });

    const bsdasri = await bsdasriFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret
      }
    });

    await indexBsdasri(await getBsdasriForElastic(bsdasri));
    await refreshElasticSearch();

    const { query } = makeClient(emitter.user);
    let res = await query<Pick<Query, "bsds">, QueryBsdsArgs>(GET_BSDS, {});

    // created bsdasri is indexed
    expect(res.data.bsds.edges).toEqual([
      expect.objectContaining({ node: { id: bsdasri.id } })
    ]);

    // let's delete this bsdasri
    const { mutate } = makeClient(emitter.user);
    const DELETE_DASRI = `
      mutation DeleteDasri($id: ID!){
        deleteBsdasri(id: $id)  {
          id
        }
      }
    `;

    await mutate<Pick<Mutation, "deleteBsdasri">, MutationDeleteBsdasriArgs>(
      DELETE_DASRI,
      {
        variables: {
          id: bsdasri.id
        }
      }
    );

    await refreshElasticSearch();

    res = await query<Pick<Query, "bsds">, QueryBsdsArgs>(GET_BSDS, {});
    // bsdasri si not indexed anymore
    expect(res.data.bsds.edges).toEqual([]);
  });

  it("duplicated bsdasri should be indexed", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });

    const bsdasri = await bsdasriFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret
      }
    });
    await indexBsdasri(await getBsdasriForElastic(bsdasri));

    //duplicate bsdasri
    const { mutate } = makeClient(emitter.user);

    const DUPLICATE_DASRI = `
    mutation DuplicateDasri($id: ID!){
      duplicateBsdasri(id: $id)  {
        id
        status
        isDraft
      }
    }
    `;

    const {
      data: { duplicateBsdasri }
    } = await mutate<
      Pick<Mutation, "duplicateBsdasri">,
      MutationDuplicateBsdasriArgs
    >(DUPLICATE_DASRI, {
      variables: {
        id: bsdasri.id
      }
    });

    await indexBsdasri(await getBsdasriForElastic(bsdasri));
    await refreshElasticSearch();

    const { query } = makeClient(emitter.user);
    const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
      GET_BSDS,
      {}
    );

    // duplicated bsdasri is indexed
    expect(data.bsds.edges.length).toEqual(2); // initial + duplicated bsdasri
    expect(data.bsds.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ node: { id: bsdasri.id } }),
        expect.objectContaining({ node: { id: duplicateBsdasri!.id } })
      ])
    );
  });
});

describe("Bsdasri sub-resolvers in query bsds", () => {
  afterEach(resetDatabase);

  const GET_BSDS = gql`
    query GetBsds($where: BsdWhere) {
      bsds(where: $where) {
        edges {
          node {
            ... on Bsdasri {
              id
              grouping {
                id
              }
              synthesizing {
                id
              }
            }
          }
        }
      }
    }
  `;

  test("Bsdasri.grouping should resolve correctly", async () => {
    const ttr = await userWithCompanyFactory(UserRole.ADMIN);
    const intialBsdasri = await bsdasriFactory({
      opt: {
        destinationCompanySiret: ttr.company.siret,
        status: "AWAITING_GROUP"
      }
    });
    const bsdasri = await bsdasriFactory({
      opt: {
        type: "GROUPING",
        emitterCompanySiret: ttr.company.siret,
        status: "INITIAL",
        grouping: { connect: { id: intialBsdasri.id } }
      }
    });
    await indexBsdasri(await getBsdasriForElastic(intialBsdasri));
    await indexBsdasri(await getBsdasriForElastic(bsdasri));
    await refreshElasticSearch();

    const { query } = makeClient(ttr.user);
    const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
      GET_BSDS,
      {}
    );
    const bsdasris = data.bsds!.edges.map(e => e.node);
    expect(bsdasris).toHaveLength(2);
    const queriedBsdasri = bsdasris.find(bsd => bsd.id === bsdasri.id);
    expect(queriedBsdasri).toBeDefined();
    const grouping = (queriedBsdasri as any)!.grouping!;
    expect(grouping).toHaveLength(1);
    expect(grouping[0].id).toEqual(intialBsdasri.id);
  });

  test("Bsdasri.synthesizing should resolve correctly", async () => {
    const ttr = await userWithCompanyFactory(UserRole.ADMIN);
    const intialBsdasri = await bsdasriFactory({
      opt: {
        destinationCompanySiret: ttr.company.siret,
        status: "AWAITING_GROUP"
      }
    });
    const bsdasri = await bsdasriFactory({
      opt: {
        type: "SYNTHESIS",
        emitterCompanySiret: ttr.company.siret,
        status: "INITIAL",
        synthesizing: { connect: { id: intialBsdasri.id } }
      }
    });
    await indexBsdasri(await getBsdasriForElastic(intialBsdasri));
    await indexBsdasri(await getBsdasriForElastic(bsdasri));
    await refreshElasticSearch();

    const { query } = makeClient(ttr.user);
    const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
      GET_BSDS,
      {}
    );
    const bsdasris = data.bsds!.edges.map(e => e.node);
    expect(bsdasris).toHaveLength(2);
    const queriedBsdasri = bsdasris.find(bsd => bsd.id === bsdasri.id);
    expect(queriedBsdasri).toBeDefined();
    const synthesizing = (queriedBsdasri as any)!.synthesizing!;
    expect(synthesizing).toHaveLength(1);
    expect(synthesizing[0].id).toEqual(intialBsdasri.id);
  });
});
