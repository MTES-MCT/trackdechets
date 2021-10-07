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
  MutationCreateDraftBsvhuArgs,
  MutationPublishBsvhuArgs,
  MutationSignBsvhuArgs,
  MutationDeleteBsvhuArgs,
  MutationDuplicateBsvhuArgs
} from "../../../../generated/graphql/types";
import {
  resetDatabase,
  refreshElasticSearch
} from "../../../../../integration-tests/helper";
import makeClient from "../../../../__tests__/testClient";
import { ErrorCode } from "../../../../common/errors";
import { indexBsvhu } from "../../../../bsvhu/elastic";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import { vhuFormFactory } from "../../../../bsvhu/__tests__/factories.vhu";

const GET_BSDS = `
  query GetBsds($where: BsdWhere) {
    bsds(where: $where) {
      edges {
        node {
          ... on Bsvhu {
            id
          }
        }
      }
    }
  }
`;
const CREATE_DRAFT_VHU = `
mutation CreateDraftVhu($input: BsvhuInput!) {
  createDraftBsvhu(input: $input) {
    id
     
  }
}
`;

const PUBLISH_VHU = `
mutation PublishBsvhu($id: ID!) {
  publishBsvhu(id: $id) {
      id
      isDraft
  }
}
`;

const SIGN_VHU = `
mutation SignVhuForm($id: ID!, $input: BsvhuSignatureInput!) {
  signBsvhu(id: $id, input: $input) {
      id
  }
}
`;

describe("Query.bsds.vhus base workflow", () => {
  let emitter: { user: User; company: Company };
  let transporter: { user: User; company: Company };
  let destination: { user: User; company: Company };
  let vhuId: string;

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

  describe("when a draft bsvhu is freshly created", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(emitter.user);

      const {
        data: {
          createDraftBsvhu: { id }
        }
      } = await mutate<
        Pick<Mutation, "createDraftBsvhu">,
        MutationCreateDraftBsvhuArgs
      >(CREATE_DRAFT_VHU, {
        variables: {
          input: {
            emitter: {
              company: {
                siret: emitter.company.siret,
                name: "The crusher",
                address: "Rue de la carcasse",
                contact: "Un centre VHU",
                phone: "0101010101",
                mail: "emitter@mail.com"
              },
              agrementNumber: "1234"
            },
            wasteCode: "16 01 06",
            packaging: "UNITE",
            identification: {
              numbers: ["123", "456"],
              type: "NUMERO_ORDRE_REGISTRE_POLICE"
            },
            quantity: 2,
            weight: {
              isEstimate: true,
              value: 1.3
            },
            destination: {
              type: "BROYEUR",
              plannedOperationCode: "R 12",
              agrementNumber: "xyz",

              company: {
                siret: destination.company.siret,
                name: "destination",
                address: "address",
                contact: "contactEmail",
                phone: "contactPhone",
                mail: "contactEmail@mail.com"
              }
            },
            transporter: {
              company: {
                siret: transporter.company.siret,
                name: "The transporter",
                address: "Rue de l'essuie glace'",
                contact: "Un transporteur de voiture cassée",
                phone: "0101010101",
                mail: "transporter@mail.com"
              },
              recepisse: {
                number: "122",
                department: "83",
                validityLimit: addYears(new Date(), 1).toISOString() as any
              }
            }
          }
        }
      });
      vhuId = id;
      await refreshElasticSearch();
    });

    it("should disallow unauthenticated user", async () => {
      const { query } = makeClient();

      const { errors } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {}
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

    it("draft vhu should be isDraftFor emitter", async () => {
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
        expect.objectContaining({ node: { id: vhuId } })
      ]);
    });
    it("draft vhu should be isDraftFor transporter", async () => {
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
        expect.objectContaining({ node: { id: vhuId } })
      ]);
    });
    it("draft vhu should be isDraftFor destination", async () => {
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
        expect.objectContaining({ node: { id: vhuId } })
      ]);
    });
  });

  describe("when the vhu is published", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(emitter.user);

      await mutate<Pick<Mutation, "publishBsvhu">, MutationPublishBsvhuArgs>(
        PUBLISH_VHU,
        {
          variables: {
            id: vhuId
          }
        }
      );

      await refreshElasticSearch();
    });

    it("published vhu should be isForActionFor emitter", async () => {
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
        expect.objectContaining({ node: { id: vhuId } })
      ]);
    });

    it("published vhu should be isToCollectFor transporter", async () => {
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
        expect.objectContaining({ node: { id: vhuId } })
      ]);
    });

    it("published vhu should be isFollowFor destination", async () => {
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
        expect.objectContaining({ node: { id: vhuId } })
      ]);
    });
  });

  describe("when the vhu is signed by the producer", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(emitter.user);

      await mutate<Pick<Mutation, "signBsvhu">, MutationSignBsvhuArgs>(
        SIGN_VHU,
        {
          variables: {
            id: vhuId,
            input: { type: "EMISSION", author: "Marcel" }
          }
        }
      );

      await refreshElasticSearch();
    });

    it("signed by emitter vhu should be isFollowFor emitter", async () => {
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
        expect.objectContaining({ node: { id: vhuId } })
      ]);
    });

    it("signed by emitter vhu should be isToCollectFor transporter", async () => {
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
        expect.objectContaining({ node: { id: vhuId } })
      ]);
    });

    it("signed by emitter vhu should be isFollowFor destination", async () => {
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
        expect.objectContaining({ node: { id: vhuId } })
      ]);
    });
  });

  describe("when the vhu is signed by the transporteur (sent)", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(transporter.user);

      await mutate<Pick<Mutation, "signBsvhu">, MutationSignBsvhuArgs>(
        SIGN_VHU,
        {
          variables: {
            id: vhuId,
            input: { type: "TRANSPORT", author: "Martine" }
          }
        }
      );

      await refreshElasticSearch();
    });

    it("sent vhu should be isFollowFor emitter", async () => {
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
        expect.objectContaining({ node: { id: vhuId } })
      ]);
    });

    it("sent vhu should be isCollectedFor transporter", async () => {
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
        expect.objectContaining({ node: { id: vhuId } })
      ]);
    });

    it("sent vhu should be isForActionFor destination", async () => {
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
        expect.objectContaining({ node: { id: vhuId } })
      ]);
    });
  });

  describe("when the vhu operation is signed by the destination", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(destination.user);
      await prisma.bsvhu.update({
        where: {
          id: vhuId
        },
        data: {
          destinationReceptionQuantity: 10.0,
          destinationReceptionWeight: 10.0,
          destinationReceptionAcceptationStatus:
            WasteAcceptationStatus.ACCEPTED,
          destinationOperationCode: "R 4"
        }
      });
      await mutate<Pick<Mutation, "signBsvhu">, MutationSignBsvhuArgs>(
        SIGN_VHU,
        {
          variables: {
            id: vhuId,
            input: { type: "OPERATION", author: "Hector" }
          }
        }
      );

      await refreshElasticSearch();
    });

    it("processed vhu should be isArchivedFor emitter", async () => {
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
        expect.objectContaining({ node: { id: vhuId } })
      ]);
    });

    it("processed vhu should be isArchivedFor transporter", async () => {
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
        expect.objectContaining({ node: { id: vhuId } })
      ]);
    });

    it("processed  vhu should be isArchivedFor destination", async () => {
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
        expect.objectContaining({ node: { id: vhuId } })
      ]);
    });
  });

  describe("when the vhu is refused", () => {
    beforeAll(async () => {
      const refusedVhu = await prisma.bsvhu.update({
        where: { id: vhuId },
        data: { status: "REFUSED" }
      });
      await indexBsvhu(refusedVhu);
      await refreshElasticSearch();
    });

    it("refused vhu should be isArchivedFor emitter", async () => {
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
        expect.objectContaining({ node: { id: vhuId } })
      ]);
    });

    it("refused vhu should be isArchivedFor transporter", async () => {
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
        expect.objectContaining({ node: { id: vhuId } })
      ]);
    });

    it("refused  vhu should be isArchivedFor recipient", async () => {
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
        expect.objectContaining({ node: { id: vhuId } })
      ]);
    });
  });
});

describe("Query.bsds.vhus mutations", () => {
  afterAll(resetDatabase);

  it("deleted vhu should be removed from es index", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });

    const vhu = await vhuFormFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret
      }
    });

    await indexBsvhu(vhu);
    await refreshElasticSearch();

    const { query } = makeClient(emitter.user);
    let res = await query<Pick<Query, "bsds">, QueryBsdsArgs>(GET_BSDS, {});

    // created vhu is indexed
    expect(res.data.bsds.edges).toEqual([
      expect.objectContaining({ node: { id: vhu.id } })
    ]);

    // let's delete this vhu
    const { mutate } = makeClient(emitter.user);
    const DELETE_VHU = `
      mutation DeleteVhu($id: ID!){
        deleteBsvhu(id: $id)  {
          id
        }
      }
    `;

    await mutate<Pick<Mutation, "deleteBsvhu">, MutationDeleteBsvhuArgs>(
      DELETE_VHU,
      {
        variables: {
          id: vhu.id
        }
      }
    );

    await refreshElasticSearch();

    res = await query<Pick<Query, "bsds">, QueryBsdsArgs>(GET_BSDS, {});
    // vhu si not indexed anymore
    expect(res.data.bsds.edges).toEqual([]);
  });

  it("duplicated vhu should be indexed", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });

    const vhu = await vhuFormFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret
      }
    });
    await indexBsvhu(vhu);

    //duplicate vhu
    const { mutate } = makeClient(emitter.user);

    const DUPLICATE_VHU = `
    mutation DuplicateVhu($id: ID!){
      duplicateBsvhu(id: $id)  {
        id
        status
        isDraft
      }
    }
    `;

    const {
      data: { duplicateBsvhu }
    } = await mutate<
      Pick<Mutation, "duplicateBsvhu">,
      MutationDuplicateBsvhuArgs
    >(DUPLICATE_VHU, {
      variables: {
        id: vhu.id
      }
    });

    await indexBsvhu(vhu);
    await refreshElasticSearch();

    const { query } = makeClient(emitter.user);
    const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
      GET_BSDS,
      {}
    );

    // duplicated vhu is indexed
    expect(data.bsds.edges.length).toEqual(2); // initial + duplicated vhu
    expect(data.bsds.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ node: { id: vhu.id } }),
        expect.objectContaining({ node: { id: duplicateBsvhu.id } })
      ])
    );
  });
});
