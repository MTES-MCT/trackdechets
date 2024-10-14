import { gql } from "graphql-tag";
import {
  refreshElasticSearch,
  resetDatabase
} from "../../../../../integration-tests/helper";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import {
  createBsffAfterEmission,
  createBsffAfterOperation
} from "../../../../bsffs/__tests__/factories";
import { getBsffForElastic, indexBsff } from "../../../../bsffs/elastic";
import { prisma } from "@td/prisma";
import makeClient from "../../../../__tests__/testClient";
import { Query, QueryBsdsArgs } from "../../../../generated/graphql/types";

const GET_BSDS = gql`
  query GetBsds($where: BsdWhere) {
    bsds(where: $where) {
      edges {
        node {
          ... on Bsff {
            id
            packagings {
              numero
            }
          }
        }
      }
    }
  }
`;
describe("Bsff subresolver in query bsds", () => {
  afterEach(resetDatabase);

  test("Bsff.packagings should resolve correctly", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const destination = await userWithCompanyFactory("ADMIN");

    const bsff = await createBsffAfterEmission({ emitter, destination });
    const packagings = await prisma.bsff
      .findUniqueOrThrow({ where: { id: bsff.id } })
      .packagings();
    expect(packagings).toHaveLength(1);
    await indexBsff(await getBsffForElastic(bsff));
    await refreshElasticSearch();
    const { query } = makeClient(emitter.user);
    const { data, errors } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
      GET_BSDS,
      {}
    );
    expect(errors).toBeUndefined();
    const bsffs = data.bsds!.edges.map(e => e.node);
    expect(bsffs).toHaveLength(1);
    expect((bsffs[0] as any).packagings).toHaveLength(1);
  });

  describe("when bsff is refused", () => {
    let bsff;
    let emitter;
    let transporter;
    let destination;

    beforeAll(async () => {
      emitter = await userWithCompanyFactory();
      transporter = await userWithCompanyFactory();
      destination = await userWithCompanyFactory();
      bsff = await createBsffAfterOperation(
        { emitter, transporter, destination },
        {
          data: {
            status: "REFUSED",
            destinationReceptionDate: new Date()
          },
          packagingData: {
            acceptationStatus: "REFUSED"
          }
        }
      );
      await indexBsff(await getBsffForElastic(bsff));
      await refreshElasticSearch();
    });

    it("refused bsff should be isArchivedFor & isReturnFor transporter", async () => {
      // isArchivedFor
      const { query } = makeClient(transporter.user);
      const { data: archiveData } = await query<
        Pick<Query, "bsds">,
        QueryBsdsArgs
      >(GET_BSDS, {
        variables: {
          where: {
            isArchivedFor: [transporter.company.siret!]
          }
        }
      });

      expect(archiveData.bsds.edges.length).toBe(1);
      expect(archiveData.bsds.edges[0].node).toMatchObject({ id: bsff.id });

      // isReturnFor
      const { data: returnData } = await query<
        Pick<Query, "bsds">,
        QueryBsdsArgs
      >(GET_BSDS, {
        variables: {
          where: {
            isReturnFor: [transporter.company.siret!]
          }
        }
      });

      expect(returnData.bsds.edges.length).toBe(1);
      expect(returnData.bsds.edges[0].node).toMatchObject({ id: bsff.id });
    });
  });
});
