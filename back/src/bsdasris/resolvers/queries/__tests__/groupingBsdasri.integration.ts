import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  userWithCompanyFactory,
  companyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

import {
  bsdasriFactory,
  initialData,
  readyToReceiveData,
  readyToProcessData
} from "../../../__tests__/factories";
import type { Query } from "@td/codegen-back";
import { fullGroupingBsdasriFragment } from "../../../fragments";
import { gql } from "graphql-tag";
import { BsdasriType } from "@td/prisma";

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

  it("should get grouped dasris", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const initialDasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToReceiveData(),
        ...readyToProcessData,
        status: "PROCESSED",
        transporterTakenOverAt: new Date()
      }
    });

    const params = {
      opt: {
        ...initialData(company),
        type: BsdasriType.GROUPING,
        grouping: { connect: [{ id: initialDasri.id }] }
      }
    };

    const groupingDasri = await bsdasriFactory(params);

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsdasris">>(GET_BSDASRIS, {
      variables: {
        where: {
          id: { _in: [groupingDasri.id] }
        }
      }
    });

    expect(data.bsdasris.totalCount).toEqual(1);
    const grouping = data.bsdasris.edges[0].node.grouping;
    expect(grouping!.length).toEqual(1);
    expect(grouping![0].id).toEqual(initialDasri.id);
  });

  it("should retrieve grouping dasri with grouped bsds", async () => {
    // user belongs to the grouping dasri and can read grouping dasri and grouped dasris digests
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const transporterTakenOverAt = new Date();
    const toRegroup = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToReceiveData(),
        ...readyToProcessData,
        status: "PROCESSED",
        transporterTakenOverAt
      }
    });

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        type: BsdasriType.GROUPING,
        grouping: { connect: [{ id: toRegroup.id }] }
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsdasri">>(GET_BSDASRI, {
      variables: { id: dasri.id }
    });

    expect(data.bsdasri.id).toBe(dasri.id);
    const expectedRegroupedInfo = [
      {
        id: toRegroup.id,
        quantity: 3,
        volume: 66,
        postalCode: "92200",
        weight: 70,
        takenOverAt: transporterTakenOverAt.toISOString()
      }
    ];

    expect(data.bsdasri.grouping).toStrictEqual(expectedRegroupedInfo);
  });

  it("should allow emitter from grouped dasri to access grouping dasri", async () => {
    // user is emitter on the grouped dasri but does not appear on the grouping one, however they can access it
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const otherCompany = await companyFactory();
    const transporterTakenOverAt = new Date();
    // user is on the initial dasri
    const toRegroup = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToReceiveData(),
        ...readyToProcessData,
        status: "PROCESSED",
        transporterTakenOverAt
      }
    });

    // user is not on the grouping dasri
    const groupingDasri = await bsdasriFactory({
      opt: {
        ...initialData(otherCompany),
        type: BsdasriType.GROUPING,
        grouping: { connect: [{ id: toRegroup.id }] }
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsdasri">>(GET_BSDASRI, {
      variables: { id: groupingDasri.id }
    });

    expect(data.bsdasri.id).toBe(groupingDasri.id);
    const expectedGroupingInfo = [
      {
        id: toRegroup.id,
        quantity: 3,
        volume: 66,
        postalCode: "92200",
        weight: 70,
        takenOverAt: transporterTakenOverAt.toISOString()
      }
    ];

    expect(data.bsdasri.grouping).toStrictEqual(expectedGroupingInfo);
  });
});
