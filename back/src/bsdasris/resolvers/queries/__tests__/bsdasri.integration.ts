import { resetDatabase } from "../../../../../integration-tests/helper";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { ErrorCode } from "../../../../common/errors";
import {
  bsdasriFactory,
  initialData,
  readyToReceiveData,
  readyToProcessData,
  readyToPublishData
} from "../../../__tests__/factories";
import { Query } from "../../../../generated/graphql/types";
import { fullGroupingBsdasriFragment } from "../../../fragments";
import { gql } from "apollo-server-express";
import { BsdasriType } from "@prisma/client";

const GET_BSDASRI = gql`
  ${fullGroupingBsdasriFragment}
  query GetBsdasri($id: ID!) {
    bsdasri(id: $id) {
      ...FullGroupingBsdasriFragment
    }
  }
`;

describe("Query.Bsdasri", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { query } = makeClient();
    const { company } = await userWithCompanyFactory("MEMBER");
    const { company: destination } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToPublishData(destination)
      }
    });

    const { errors } = await query<Pick<Query, "bsdasri">>(GET_BSDASRI, {
      variables: { id: dasri.id }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas connecté.",
        extensions: expect.objectContaining({
          code: ErrorCode.UNAUTHENTICATED
        })
      })
    ]);
  });

  it("should forbid access to user not on the bsd", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");
    const { company: destination } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToPublishData(destination)
      }
    });
    const { user: otherUser } = await userWithCompanyFactory("MEMBER");

    const { query } = makeClient(otherUser);
    const { errors } = await query<Pick<Query, "bsdasri">>(GET_BSDASRI, {
      variables: { id: dasri.id }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas autorisé à accéder à ce bordereau",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should get a dasri by id", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: destination } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToPublishData(destination)
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsdasri">>(GET_BSDASRI, {
      variables: { id: dasri.id }
    });

    expect(data.bsdasri.id).toBe(dasri.id);
    expect(data.bsdasri.status).toBe("INITIAL");
    expect(data.bsdasri.grouping).toStrictEqual([]);
  });

  it("should retrieve grouped dasris", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: destination } = await userWithCompanyFactory("MEMBER");
    const transporterTakenOverAt = new Date();
    const toRegroup = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToPublishData(destination),
        ...readyToReceiveData(),
        ...readyToProcessData,
        status: "PROCESSED",
        transporterTakenOverAt
      }
    });

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToPublishData(destination),
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
});
