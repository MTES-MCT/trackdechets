import { gql } from "graphql-tag";
import {
  refreshElasticSearch,
  resetDatabase
} from "../../../../../integration-tests/helper";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import { createBsffAfterEmission } from "../../../../bsffs/__tests__/factories";
import { getBsffForElastic, indexBsff } from "../../../../bsffs/elastic";
import { prisma } from "@td/prisma";
import makeClient from "../../../../__tests__/testClient";
import { Query, QueryBsdsArgs } from "@td/codegen-back";

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
});
