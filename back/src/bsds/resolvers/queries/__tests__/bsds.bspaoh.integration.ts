import {
  Company,
  User,
  UserRole,
  WasteAcceptationStatus
} from "@prisma/client";
import { prisma } from "@td/prisma";
import {
  Query,
  QueryBsdsArgs,
  Mutation,
  MutationCreateDraftBspaohArgs,
  MutationPublishBspaohArgs,
  MutationSignBspaohArgs,
  MutationDeleteBspaohArgs,
  MutationDuplicateBspaohArgs
} from "../../../../generated/graphql/types";
import {
  resetDatabase,
  refreshElasticSearch
} from "../../../../../integration-tests/helper";
import makeClient from "../../../../__tests__/testClient";
import { ErrorCode } from "../../../../common/errors";
import {
  BspaohForElasticInclude,
  getBspaohForElastic,
  indexBspaoh
} from "../../../../bspaoh/elastic";
import {
  userWithCompanyFactory,
  transporterReceiptFactory
} from "../../../../__tests__/factories";
import { bspaohFactory } from "../../../../bspaoh/__tests__/factories";
import gql from "graphql-tag";

const CREATE_DRAFT_BSPAOH = gql`
  mutation CreateDraftBspaoh($input: BspaohInput!) {
    createDraftBspaoh(input: $input) {
      id
    }
  }
`;

const PUBLISH_BSPAOH = gql`
  mutation PublishBspaoh($id: ID!) {
    publishBspaoh(id: $id) {
      id
      status
      isDraft
    }
  }
`;
export const SIGN_BSPAOH = gql`
  mutation SignBspaoh($id: ID!, $input: BspaohSignatureInput!) {
    signBspaoh(id: $id, input: $input) {
      id
    }
  }
`;

const GET_BSDS = gql`
  query GetBsds($where: BsdWhere) {
    bsds(where: $where) {
      edges {
        node {
          ... on Bspaoh {
            id
          }
        }
      }
    }
  }
`;

describe("Query.bsds.bspaohs base workflow", () => {
  let emitter: { user: User; company: Company };
  let transporter: { user: User; company: Company };
  let destination: { user: User; company: Company };
  let bspaohId: string;

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
      },
      wasteProcessorTypes: {
        set: ["CREMATION"]
      }
    });
  });
  afterAll(resetDatabase);

  describe("when a draft bspaoh is freshly created", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(emitter.user);

      const {
        data: {
          createDraftBspaoh: { id }
        }
      } = await mutate<
        Pick<Mutation, "createDraftBspaoh">,
        MutationCreateDraftBspaohArgs
      >(CREATE_DRAFT_BSPAOH, {
        variables: {
          input: {
            waste: {
              adr: "plop",
              code: "18 01 02",
              packagings: [
                {
                  type: "RELIQUAIRE",
                  volume: 11,
                  quantity: 1,
                  containerNumber: "qsd",
                  consistence: "SOLIDE",
                  identificationCodes: ["abcdef"]
                },
                {
                  type: "LITTLE_BOX",
                  volume: 11,
                  quantity: 1,
                  containerNumber: "hhh",
                  consistence: "LIQUIDE",
                  identificationCodes: ["dddd", "ggg"]
                }
              ],
              type: "PAOH"
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
                detail: {
                  weight: {
                    value: 44,
                    isEstimate: true
                  },
                  quantity: 11
                }
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
                mode: "ROAD",
                plates: ["TRANSPORTER-PLATE"]
              }
            },
            destination: {
              cap: "cap",
              company: {
                siret: destination.company.siret,
                name: "crematorium",
                address: "38 bis allée des anges",
                contact: "Jeanne",
                mail: "jeanne@gmail.com",
                phone: "06"
              },
              reception: {
                acceptation: {
                  status: WasteAcceptationStatus.ACCEPTED,
                  packagings: [
                    {
                      id: "packaging_0",
                      acceptation: "ACCEPTED"
                    },
                    {
                      id: "packaging_1",
                      acceptation: "ACCEPTED"
                    }
                  ]
                },
                date: new Date().toISOString() as any,
                detail: {
                  receivedWeight: { value: 10 }
                }
              },
              operation: {
                code: "R 1",
                date: new Date().toISOString() as any
              }
            }
          }
        }
      });

      bspaohId = id;
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

    it("draft bspaoh should be isDraftFor emitter", async () => {
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
        expect.objectContaining({ node: { id: bspaohId } })
      ]);
    });

    it("draft bspaoh should be isDraftFor transporter", async () => {
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
        expect.objectContaining({ node: { id: bspaohId } })
      ]);
    });

    it("draft bspaoh should be isDraftFor destination", async () => {
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
        expect.objectContaining({ node: { id: bspaohId } })
      ]);
    });
  });

  describe("when the bspaoh is published", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(emitter.user);

      await mutate<Pick<Mutation, "publishBspaoh">, MutationPublishBspaohArgs>(
        PUBLISH_BSPAOH,
        {
          variables: {
            id: bspaohId
          }
        }
      );

      await refreshElasticSearch();
    });

    it("published bspaoh should be isForActionFor emitter", async () => {
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
        expect.objectContaining({ node: { id: bspaohId } })
      ]);
    });

    it("published bspaoh should be isFollowFor transporter", async () => {
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
        expect.objectContaining({ node: { id: bspaohId } })
      ]);
    });

    it("published bspaoh should be isFollowFor destination", async () => {
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
        expect.objectContaining({ node: { id: bspaohId } })
      ]);
    });
  });

  describe("when the bsd is signed by the producer", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(emitter.user);

      await mutate<Pick<Mutation, "signBspaoh">, MutationSignBspaohArgs>(
        SIGN_BSPAOH,
        {
          variables: {
            id: bspaohId,
            input: { type: "EMISSION", author: "Jean Producteur" }
          }
        }
      );

      await refreshElasticSearch();
    });

    it("signed by emitter bspaoh should be isFollowFor emitter", async () => {
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
        expect.objectContaining({ node: { id: bspaohId } })
      ]);
    });

    it("signed by emitter bspaoh should be isToCollectFor transporter", async () => {
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
        expect.objectContaining({ node: { id: bspaohId } })
      ]);
    });

    it("signed by emitter bspaoh should be isFollowFor destination", async () => {
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
        expect.objectContaining({ node: { id: bspaohId } })
      ]);
    });
  });

  describe("when the bsd is signed by the transporter (sent)", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(transporter.user);

      await mutate<Pick<Mutation, "signBspaoh">, MutationSignBspaohArgs>(
        SIGN_BSPAOH,
        {
          variables: {
            id: bspaohId,
            input: { type: "TRANSPORT", author: "Bill" }
          }
        }
      );

      await refreshElasticSearch();
    });

    it("sent bspaoh should be isFollowFor emitter", async () => {
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
        expect.objectContaining({ node: { id: bspaohId } })
      ]);
    });

    it("sent by emitter bspaoh should be isCollectedFor transporter", async () => {
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
        expect.objectContaining({ node: { id: bspaohId } })
      ]);
    });

    it("sent by emitter bspaoh should be isForActionFor destination", async () => {
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
        expect.objectContaining({ node: { id: bspaohId } })
      ]);
    });
  });

  describe("when the bspaoh reception is signed by the destination", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(destination.user);

      await mutate<Pick<Mutation, "signBspaoh">, MutationSignBspaohArgs>(
        SIGN_BSPAOH,
        {
          variables: {
            id: bspaohId,
            input: { type: "RECEPTION", author: "Bill" }
          }
        }
      );
      await refreshElasticSearch();
    });

    it("received bspaoh should be isFollowFor emitter", async () => {
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
        expect.objectContaining({ node: { id: bspaohId } })
      ]);
    });

    it("received by emitter bspaoh should be isFollowFor transporter", async () => {
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
        expect.objectContaining({ node: { id: bspaohId } })
      ]);
    });

    it("received by emitter bspaoh should be isForActionFor destination", async () => {
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
        expect.objectContaining({ node: { id: bspaohId } })
      ]);
    });
  });

  describe("when the bspaoh operation is signed by the destination", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(destination.user);
      await mutate<Pick<Mutation, "signBspaoh">, MutationSignBspaohArgs>(
        SIGN_BSPAOH,
        {
          variables: {
            id: bspaohId,
            input: { type: "OPERATION", author: "Bill" }
          }
        }
      );

      await refreshElasticSearch();
    });

    it("processed bspaoh should be isArchivedFor emitter", async () => {
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
        expect.objectContaining({ node: { id: bspaohId } })
      ]);
    });

    it("processed bspaoh should be isArchivedFor transporter", async () => {
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
        expect.objectContaining({ node: { id: bspaohId } })
      ]);
    });

    it("processed bspaoh should be isArchivedFor destination", async () => {
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
        expect.objectContaining({ node: { id: bspaohId } })
      ]);
    });
  });

  describe("when the bspaoh is refused", () => {
    beforeAll(async () => {
      const refusedBspaoh = await prisma.bspaoh.update({
        where: { id: bspaohId },
        data: { status: "REFUSED" },
        include: BspaohForElasticInclude
      });
      await indexBspaoh(refusedBspaoh);
      await refreshElasticSearch();
    });

    it("refused bspaoh should be isArchivedFor emitter", async () => {
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
        expect.objectContaining({ node: { id: bspaohId } })
      ]);
    });

    it("refused bspaoh should be isArchivedFor transporter", async () => {
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
        expect.objectContaining({ node: { id: bspaohId } })
      ]);
    });

    it("refused  bspaoh should be isArchivedFor destination", async () => {
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
        expect.objectContaining({ node: { id: bspaohId } })
      ]);
    });
  });

  describe("Query.bsds.bspaohs mutations", () => {
    afterAll(resetDatabase);

    it("deleted bspaoh should be removed from es index", async () => {
      const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
        companyTypes: {
          set: ["PRODUCER"]
        }
      });

      const bspaoh = await bspaohFactory({
        opt: {
          emitterCompanySiret: emitter.company.siret
        }
      });
      const bspaohElastic = await getBspaohForElastic(bspaoh);
      await indexBspaoh(bspaohElastic);
      await refreshElasticSearch();

      const { query } = makeClient(emitter.user);
      let res = await query<Pick<Query, "bsds">, QueryBsdsArgs>(GET_BSDS, {});

      // created bspaoh is indexed
      expect(res.data.bsds.edges).toEqual([
        expect.objectContaining({ node: { id: bspaoh.id } })
      ]);

      // let's delete this bspaoh
      const { mutate } = makeClient(emitter.user);
      const DELETE_BSPAOH = `
        mutation DeleteBspaoh($id: ID!){
          deleteBspaoh(id: $id)  {
            id
          }
        }
      `;

      await mutate<Pick<Mutation, "deleteBspaoh">, MutationDeleteBspaohArgs>(
        DELETE_BSPAOH,
        {
          variables: {
            id: bspaoh.id
          }
        }
      );

      await refreshElasticSearch();

      res = await query<Pick<Query, "bsds">, QueryBsdsArgs>(GET_BSDS, {});
      // bspaoh is not indexed anymore
      expect(res.data.bsds.edges).toEqual([]);
    });

    it("duplicated bspaoh should be indexed", async () => {
      const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
        companyTypes: {
          set: ["PRODUCER"]
        }
      });

      const bspaoh = await bspaohFactory({
        opt: {
          emitterCompanySiret: emitter.company.siret
        }
      });
      await indexBspaoh(await getBspaohForElastic(bspaoh));

      //duplicate bspaoh
      const { mutate } = makeClient(emitter.user);

      const DUPLICATE_BSPAOH = `
        mutation DuplicateBspaoh($id: ID!){
          duplicateBspaoh(id: $id)  {
            id
            status
            isDraft
          }
        }
        `;

      const {
        data: { duplicateBspaoh }
      } = await mutate<
        Pick<Mutation, "duplicateBspaoh">,
        MutationDuplicateBspaohArgs
      >(DUPLICATE_BSPAOH, {
        variables: {
          id: bspaoh.id
        }
      });

      await indexBspaoh(await getBspaohForElastic(bspaoh));
      await refreshElasticSearch();

      const { query } = makeClient(emitter.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {}
      );

      // duplicated bspaoh is indexed
      expect(data.bsds.edges.length).toEqual(2); // initial + duplicated bspaoh
      expect(data.bsds.edges).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ node: { id: bspaoh.id } }),
          expect.objectContaining({ node: { id: duplicateBspaoh.id } })
        ])
      );
    });
  });
});
