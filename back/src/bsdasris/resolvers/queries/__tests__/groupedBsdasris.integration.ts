import { resetDatabase } from "../../../../../integration-tests/helper";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { bsdasriFactory, initialData } from "../../../__tests__/factories";
import { Query } from "../../../../generated/graphql/types";

const GET_BSDASRIS = `
query bsDasris($where: BsdasriWhere) {
  bsdasris(where: $where) {
    totalCount
    pageInfo {
      startCursor
      endCursor
      hasNextPage
    }
    edges {

      node {
        id
        status
        bsdasriType
        regroupedBsdasris
        synthesizedBsdasris
      }
    }
  }
}`;

describe("Query.Bsdasris", () => {
  afterEach(resetDatabase);

  it("should retrieve synthesized dasris IDs", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const toRegroup = await bsdasriFactory({
      ownerId: user.id,
      opt: {
        ...initialData(company),
        status: "PROCESSED"
      }
    });
    const dasri = await bsdasriFactory({
      ownerId: user.id,
      opt: {
        ...initialData(company),
        regroupedBsdasris: { connect: [{ id: toRegroup.id }] }
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsdasris">>(GET_BSDASRIS, {
      variables: {
        where: {
          id_in: [dasri.id]
        }
      }
    });
    const ids = data.bsdasris.edges.map(edge => edge.node.id);

    expect(ids).toEqual([dasri.id]);

    expect(data.bsdasris.totalCount).toBe(1);
    expect(data.bsdasris.edges[0].node.regroupedBsdasris).toStrictEqual([
      toRegroup.id
    ]);
    expect(data.bsdasris.edges[0].node.synthesizedBsdasris).toStrictEqual([]);
  });

  it("should retrieve grouped dasris IDs", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const toRegroup = await bsdasriFactory({
      ownerId: user.id,
      opt: {
        ...initialData(company),
        status: "PROCESSED"
      }
    });

    const dasri = await bsdasriFactory({
      ownerId: user.id,
      opt: {
        ...initialData(company),
        synthesizedBsdasris: { connect: [{ id: toRegroup.id }] }
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsdasris">>(GET_BSDASRIS, {
      variables: {
        where: {
          id_in: [dasri.id]
        }
      }
    });
    const ids = data.bsdasris.edges.map(edge => edge.node.id);

    expect(ids).toEqual([dasri.id]);

    expect(data.bsdasris.totalCount).toBe(1);
    expect(data.bsdasris.edges[0].node.synthesizedBsdasris).toStrictEqual([
      toRegroup.id
    ]);
    expect(data.bsdasris.edges[0].node.regroupedBsdasris).toStrictEqual([]);
  });
});
