import { addYears } from "date-fns";
import {
  Company,
  User,
  UserRole,
  WasteAcceptationStatus
} from ".prisma/client";
import prisma from "../../../../prisma";
import {
  Query,
  QueryBsdsArgs,
  Mutation,
  MutationCreateDraftBsdasriArgs,
  MutationPublishBsdasriArgs,
  MutationSignBsdasriArgs
} from "../../../../generated/graphql/types";
import {
  resetDatabase,
  refreshElasticSearch
} from "../../../../../integration-tests/helper";
import makeClient from "../../../../__tests__/testClient";
import { ErrorCode } from "../../../../common/errors";

import { userWithCompanyFactory } from "../../../../__tests__/factories";
const CREATE_DRAFT_DASRI = `
mutation CreateDraftDasri($bsdasriCreateInput: BsdasriCreateInput!) {
  createDraftBsdasri(bsdasriCreateInput: $bsdasriCreateInput)  {
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
mutation SignDasri($id: ID!, $signatureInput: BsdasriSignatureInput
!) {
  signBsdasri(id: $id, signatureInput: $signatureInput	) {
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

describe("Query.bsds.dasris", () => {
  let emitter: { user: User; company: Company };
  let transporter: { user: User; company: Company };
  let recipient: { user: User; company: Company };
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
    recipient = await userWithCompanyFactory(UserRole.ADMIN, {
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
          bsdasriCreateInput: {
            emitter: {
              company: {
                name: "hopital blanc",
                siret: emitter.company.siret,
                contact: "jean durand",
                phone: "06 18 76 02 00",
                mail: "emitter@test.fr",
                address: "avenue de la mer"
              }
            },
            emission: {
              wasteCode: "18 01 03*",
              wasteDetails: {
                quantity: 23,
                quantityType: "REAL",
                onuCode: "xyz 33",
                packagingInfos: [
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
              receipt: "123456789",
              receiptDepartment: "69",
              receiptValidityLimit: addYears(new Date(), 1).toISOString() as any
            },
            transport: {
              takenOverAt: new Date().toISOString() as any,
              wasteDetails: {
                quantity: 99,
                quantityType: "REAL",
                packagingInfos: [{ type: "FUT", quantity: 44, volume: 123 }]
              },
              wasteAcceptation: { status: WasteAcceptationStatus.ACCEPTED }
            },
            recipient: {
              company: {
                siret: recipient.company.siret,
                name: "JEANNE COLLECTEUR",
                address: "38 bis allée des anges",
                contact: "Jeanne",
                mail: "jeanne@gmail.com",
                phone: "06"
              }
            },
            reception: {
              wasteDetails: {
                quantity: 99,
                quantityType: "REAL",
                packagingInfos: [{ type: "FUT", quantity: 44, volume: 123 }]
              },
              wasteAcceptation: { status: WasteAcceptationStatus.ACCEPTED },
              receivedAt: new Date().toISOString() as any
            },
            operation: {
              processingOperation: "D10",
              processedAt: new Date().toISOString() as any
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
    it("draft dasri should be isDraftFor recipient", async () => {
      const { query } = makeClient(recipient.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isDraftFor: [recipient.company.siret]
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

    it("published dasri should be isFollowFor recipient", async () => {
      const { query } = makeClient(recipient.user);
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
  });

  describe("when the bsd is signed by the producer", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(emitter.user);

      await mutate<Pick<Mutation, "signBsdasri">, MutationSignBsdasriArgs>(
        SIGN_DASRI,
        {
          variables: {
            id: dasriId,
            signatureInput: { type: "EMISSION", author: "Marcel" }
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

    it("signed by emitter dasri should be isFollowFor recipient", async () => {
      const { query } = makeClient(recipient.user);
      const { data } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              isFollowFor: [recipient.company.siret]
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
            signatureInput: { type: "TRANSPORT", author: "Bill" }
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

    it("sent by emitter dasri should be isForActionFor recipient", async () => {
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
        expect.objectContaining({ node: { id: dasriId } })
      ]);
    });
  });

  describe("when the dasri reception is signed by the recipient", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(recipient.user);

      await mutate<Pick<Mutation, "signBsdasri">, MutationSignBsdasriArgs>(
        SIGN_DASRI,
        {
          variables: {
            id: dasriId,
            signatureInput: { type: "RECEPTION", author: "Bill" }
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

    it("received by emitter dasri should be isForActionFor recipient", async () => {
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
        expect.objectContaining({ node: { id: dasriId } })
      ]);
    });
  });

  describe("when the dasri operation is signed by the recipient", () => {
    beforeAll(async () => {
      const { mutate } = makeClient(recipient.user);

      await mutate<Pick<Mutation, "signBsdasri">, MutationSignBsdasriArgs>(
        SIGN_DASRI,
        {
          variables: {
            id: dasriId,
            signatureInput: { type: "OPERATION", author: "Bill" }
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

    it("processed  dasri should be isArchivedFor recipient", async () => {
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
        expect.objectContaining({ node: { id: dasriId } })
      ]);
    });
  });

  describe("when the dasri is refused", () => {
    beforeAll(async () => {
      await prisma.bsdasri.update({
        where: { id: dasriId },
        data: { status: "REFUSED" }
      });

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

    it("refused  dasri should be isArchivedFor recipient", async () => {
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
        expect.objectContaining({ node: { id: dasriId } })
      ]);
    });
  });
});
