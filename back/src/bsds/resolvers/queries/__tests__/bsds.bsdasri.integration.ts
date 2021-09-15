import { addYears } from "date-fns";
import {
  Company,
  User,
  UserRole,
  WasteAcceptationStatus
} from "@prisma/client";
import prisma from "../../../../prisma";
import {
  Query,
  QueryBsdsArgs,
  Mutation,
  MutationCreateDraftBsdasriArgs,
  MutationPublishBsdasriArgs,
  MutationSignBsdasriArgs,
  MutationDeleteBsdasriArgs,
  MutationDuplicateBsdasriArgs
} from "../../../../generated/graphql/types";
import {
  resetDatabase,
  refreshElasticSearch
} from "../../../../../integration-tests/helper";
import makeClient from "../../../../__tests__/testClient";
import { ErrorCode } from "../../../../common/errors";
import { indexBsdasri } from "../../../../bsdasris/elastic";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import { bsdasriFactory } from "../../../../bsdasris/__tests__/factories";

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
  let dasriId: string;

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
              recepisse: {
                number: "123456789",
                department: "69",
                validityLimit: addYears(new Date(), 1).toISOString() as any
              },
              transport: {
                takenOverAt: new Date().toISOString() as any,

                weight: { value: 99, isEstimate: false },

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
                date: new Date().toISOString() as any
              }
            }
          }
        }
      });
      dasriId = id;
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

    it("draft dasri should be isDraftFor emitter", async () => {
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
        expect.objectContaining({ node: { id: dasriId } })
      ]);
    });
    it("draft dasri should be isDraftFor transporter", async () => {
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
        expect.objectContaining({ node: { id: dasriId } })
      ]);
    });
    it("draft dasri should be isDraftFor destination", async () => {
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
        expect.objectContaining({ node: { id: dasriId } })
      ]);
    });
  });

  describe("when the dasri is published", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(emitter.user);

      await mutate<
        Pick<Mutation, "publishBsdasri">,
        MutationPublishBsdasriArgs
      >(PUBLISH_DASRI, {
        variables: {
          id: dasriId
        }
      });

      await refreshElasticSearch();
    });

    it("published dasri should be isForActionFor emitter", async () => {
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
        expect.objectContaining({ node: { id: dasriId } })
      ]);
    });

    it("published dasri should be isToCollectFor transporter", async () => {
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
        expect.objectContaining({ node: { id: dasriId } })
      ]);
    });

    it("published dasri should be isFollowFor destination", async () => {
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
        expect.objectContaining({ node: { id: dasriId } })
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
            id: dasriId,
            input: { type: "EMISSION", author: "Marcel" }
          }
        }
      );

      await refreshElasticSearch();
    });

    it("signed by emitter dasri should be isFollowFor emitter", async () => {
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
        expect.objectContaining({ node: { id: dasriId } })
      ]);
    });

    it("signed by emitter dasri should be isToCollectFor transporter", async () => {
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
        expect.objectContaining({ node: { id: dasriId } })
      ]);
    });

    it("signed by emitter dasri should be isFollowFor destination", async () => {
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
        expect.objectContaining({ node: { id: dasriId } })
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
            id: dasriId,
            input: { type: "TRANSPORT", author: "Bill" }
          }
        }
      );

      await refreshElasticSearch();
    });

    it("sent dasri should be isFollowFor emitter", async () => {
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
        expect.objectContaining({ node: { id: dasriId } })
      ]);
    });

    it("sent by emitter dasri should be isCollectedFor transporter", async () => {
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
        expect.objectContaining({ node: { id: dasriId } })
      ]);
    });

    it("sent by emitter dasri should be isForActionFor destination", async () => {
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
        expect.objectContaining({ node: { id: dasriId } })
      ]);
    });
  });

  describe("when the dasri reception is signed by the destination", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(destination.user);

      await mutate<Pick<Mutation, "signBsdasri">, MutationSignBsdasriArgs>(
        SIGN_DASRI,
        {
          variables: {
            id: dasriId,
            input: { type: "RECEPTION", author: "Bill" }
          }
        }
      );

      await refreshElasticSearch();
    });

    it("received dasri should be isFollowFor emitter", async () => {
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
        expect.objectContaining({ node: { id: dasriId } })
      ]);
    });

    it("received by emitter dasri should be isFollowFor transporter", async () => {
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
        expect.objectContaining({ node: { id: dasriId } })
      ]);
    });

    it("received by emitter dasri should be isForActionFor destination", async () => {
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
        expect.objectContaining({ node: { id: dasriId } })
      ]);
    });
  });

  describe("when the dasri operation is signed by the destination", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(destination.user);

      await mutate<Pick<Mutation, "signBsdasri">, MutationSignBsdasriArgs>(
        SIGN_DASRI,
        {
          variables: {
            id: dasriId,
            input: { type: "OPERATION", author: "Bill" }
          }
        }
      );

      await refreshElasticSearch();
    });

    it("processed dasri should be isArchivedFor emitter", async () => {
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
        expect.objectContaining({ node: { id: dasriId } })
      ]);
    });

    it("processed dasri should be isArchivedFor transporter", async () => {
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
        expect.objectContaining({ node: { id: dasriId } })
      ]);
    });

    it("processed  dasri should be isArchivedFor destination", async () => {
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
        expect.objectContaining({ node: { id: dasriId } })
      ]);
    });
  });

  describe("when the dasri is refused", () => {
    beforeAll(async () => {
      const refusedDasri = await prisma.bsdasri.update({
        where: { id: dasriId },
        data: { status: "REFUSED" }
      });
      await indexBsdasri(refusedDasri);
      await refreshElasticSearch();
    });

    it("refused dasri should be isArchivedFor emitter", async () => {
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
        expect.objectContaining({ node: { id: dasriId } })
      ]);
    });

    it("refused dasri should be isArchivedFor transporter", async () => {
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
        expect.objectContaining({ node: { id: dasriId } })
      ]);
    });

    it("refused  dasri should be isArchivedFor destination", async () => {
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
        expect.objectContaining({ node: { id: dasriId } })
      ]);
    });
  });
});

describe("Query.bsds.dasris mutations", () => {
  afterAll(resetDatabase);

  it("deleted dasri should be removed from es index", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });

    const dasri = await bsdasriFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret
      }
    });

    await indexBsdasri(dasri);
    await refreshElasticSearch();

    const { query } = makeClient(emitter.user);
    let res = await query<Pick<Query, "bsds">, QueryBsdsArgs>(GET_BSDS, {});

    // created dasri is indexed
    expect(res.data.bsds.edges).toEqual([
      expect.objectContaining({ node: { id: dasri.id } })
    ]);

    // let's delete this dasri
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
          id: dasri.id
        }
      }
    );

    await refreshElasticSearch();

    res = await query<Pick<Query, "bsds">, QueryBsdsArgs>(GET_BSDS, {});
    // dasri si not indexed anymore
    expect(res.data.bsds.edges).toEqual([]);
  });

  it("duplicated dasri should be indexed", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });

    const dasri = await bsdasriFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret
      }
    });
    await indexBsdasri(dasri);

    //duplicate dasri
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
        id: dasri.id
      }
    });

    await indexBsdasri(dasri);
    await refreshElasticSearch();

    const { query } = makeClient(emitter.user);
    const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
      GET_BSDS,
      {}
    );

    // duplicated dasri is indexed
    expect(data.bsds.edges.length).toEqual(2); // initial + duplicated dasri
    expect(data.bsds.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ node: { id: dasri.id } }),
        expect.objectContaining({ node: { id: duplicateBsdasri.id } })
      ])
    );
  });
});
