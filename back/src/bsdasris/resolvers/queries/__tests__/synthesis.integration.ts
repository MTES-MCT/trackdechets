import { resetDatabase } from "../../../../../integration-tests/helper";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

import {
  bsdasriFactory,
  initialData,
  readyToReceiveData
} from "../../../__tests__/factories";
import { Query } from "../../../../generated/graphql/types";
import { fullGroupingBsdasriFragment } from "../../../fragments";
import { gql } from "apollo-server-express";
import { BsdasriType } from "@prisma/client";

const GET_BSDASRIS = gql`
  ${fullGroupingBsdasriFragment}
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
          ...FullGroupingBsdasriFragment
        }
      }
    }
  }
`;
const GET_BSDASRI = gql`
  ${fullGroupingBsdasriFragment}
  query GetBsdasri($id: ID!) {
    bsdasri(id: $id) {
      ...FullGroupingBsdasriFragment
    }
  }
`;
describe("Query.Bsdasris", () => {
  afterEach(resetDatabase);

  it("should get synthesized dasris", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const initialParams = {
      opt: {
        ...readyToReceiveData(company)
      }
    };

    const initialDasri = await bsdasriFactory(initialParams);
    const params = {
      opt: {
        ...initialData(company),
        type: BsdasriType.SYNTHESIS,
        synthesizing: { connect: [{ id: initialDasri.id }] }
      }
    };
    const synthesizingDasri = await bsdasriFactory(params);

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsdasris">>(GET_BSDASRIS, {
      variables: {
        where: {
          id: { _in: [synthesizingDasri.id] }
        }
      }
    });

    expect(data.bsdasris.totalCount).toEqual(1);
    const synthesizing = data.bsdasris.edges[0].node.synthesizing;
    expect(synthesizing.length).toEqual(1);
    expect(synthesizing[0].id).toEqual(initialDasri.id);
  });

  it("should retrieve associated dasris", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const transporterTakenOverAt = new Date();
    const initialParams = {
      opt: {
        ...initialData(company),
        ...readyToReceiveData(company),
        transporterTakenOverAt
      }
    };

    const initialDasri = await bsdasriFactory(initialParams);
    const params = {
      opt: {
        ...initialData(company),
        type: BsdasriType.SYNTHESIS,
        synthesizing: { connect: [{ id: initialDasri.id }] }
      }
    };
    const synthesizingDasri = await bsdasriFactory(params);

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsdasri">>(GET_BSDASRI, {
      variables: { id: synthesizingDasri.id }
    });

    expect(data.bsdasri.id).toBe(synthesizingDasri.id);
    const expectedSynthesizedInfo = [
      {
        id: initialDasri.id,
        quantity: 3,
        volume: 66,
        postalCode: "92200",
        weight: 22,
        takenOverAt: transporterTakenOverAt.toISOString()
      }
    ];

    expect(data.bsdasri.synthesizing).toStrictEqual(expectedSynthesizedInfo);
  });
});
