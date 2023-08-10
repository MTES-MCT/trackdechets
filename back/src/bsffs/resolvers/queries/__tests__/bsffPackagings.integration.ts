import { UserRole } from "@prisma/client";
import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Query,
  QueryBsffPackagingsArgs
} from "../../../../generated/graphql/types";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { OPERATION } from "../../../constants";
import {
  createBsff,
  createBsffAfterOperation
} from "../../../__tests__/factories";

const GET_BSFF_PACKAGINGS = gql`
  query GetBsffPackgings(
    $after: ID
    $first: Int
    $before: ID
    $last: Int
    $where: BsffPackagingWhere
  ) {
    bsffPackagings(
      after: $after
      first: $first
      before: $before
      last: $last
      where: $where
    ) {
      edges {
        node {
          id
        }
      }
    }
  }
`;

describe("Query.bsffPackagings", () => {
  afterEach(resetDatabase);

  it("should return the packagings of the user's company", async () => {
    const emitter = await userWithCompanyFactory(UserRole.MEMBER);
    const anotherEmitter = await userWithCompanyFactory(UserRole.MEMBER);
    const transporter = await userWithCompanyFactory(UserRole.MEMBER);
    const destination = await userWithCompanyFactory(UserRole.MEMBER);

    // this bsff packagings should be included
    const bsff = await createBsffAfterOperation({
      emitter,
      transporter,
      destination
    });

    // this bsff packagings should not be included
    await createBsffAfterOperation({
      emitter: anotherEmitter,
      transporter,
      destination
    });

    const { query } = makeClient(emitter.user);

    const { data } = await query<
      Pick<Query, "bsffPackagings">,
      QueryBsffPackagingsArgs
    >(GET_BSFF_PACKAGINGS);

    expect(data.bsffPackagings.edges).toHaveLength(1);
    expect(data.bsffPackagings.edges.map(({ node }) => node.id)).toEqual([
      bsff.packagings[0].id
    ]);
  });

  it("should filter bsff packagings with a given operation code", async () => {
    const emitter = await userWithCompanyFactory(UserRole.MEMBER);
    const transporter = await userWithCompanyFactory(UserRole.MEMBER);
    const destination = await userWithCompanyFactory(UserRole.MEMBER);

    // this bsff packagings should be included
    const bsff = await createBsffAfterOperation(
      {
        emitter,
        transporter,
        destination
      },
      {},
      { operationCode: OPERATION.R12.code }
    );

    // this bsff packagings should not be included
    await createBsffAfterOperation(
      {
        emitter,
        transporter,
        destination
      },
      {},
      { operationCode: OPERATION.R2.code }
    );

    const { query } = makeClient(emitter.user);

    const { data } = await query<
      Pick<Query, "bsffPackagings">,
      QueryBsffPackagingsArgs
    >(GET_BSFF_PACKAGINGS, {
      variables: { where: { operation: { code: { _eq: OPERATION.R12.code } } } }
    });

    expect(data.bsffPackagings.edges).toHaveLength(1);
    expect(data.bsffPackagings.edges.map(({ node }) => node.id)).toEqual([
      bsff.packagings[0].id
    ]);
  });

  it("should filter packagings where BSFF meets certain criteria", async () => {
    const emitter = await userWithCompanyFactory(UserRole.MEMBER);
    const transporter = await userWithCompanyFactory(UserRole.MEMBER);
    const destination = await userWithCompanyFactory(UserRole.MEMBER);

    // this bsff packagings should be included
    const bsff = await createBsffAfterOperation(
      {
        emitter,
        transporter,
        destination
      },
      { isDraft: false }
    );

    // this bsff packagings should not be included
    await createBsff(
      {
        emitter,
        transporter,
        destination
      },
      { isDraft: true }
    );

    const { query } = makeClient(emitter.user);

    const { data } = await query<
      Pick<Query, "bsffPackagings">,
      QueryBsffPackagingsArgs
    >(GET_BSFF_PACKAGINGS, {
      variables: { where: { bsff: { isDraft: false } } }
    });

    expect(data.bsffPackagings.edges).toHaveLength(1);
    expect(data.bsffPackagings.edges.map(({ node }) => node.id)).toEqual([
      bsff.packagings[0].id
    ]);
  });

  it("should filter packagings where nextBsff does not exist", async () => {
    const emitter = await userWithCompanyFactory(UserRole.MEMBER);
    const transporter = await userWithCompanyFactory(UserRole.MEMBER);
    const destination = await userWithCompanyFactory(UserRole.MEMBER);

    // this bsff packagings should not be included as they will be included
    // in a BSFF suite
    const bsff = await createBsffAfterOperation(
      {
        emitter,
        transporter,
        destination
      },
      {},
      { operationCode: OPERATION.R12.code }
    );

    // this bsff packagings should  be included
    const bsff2 = await createBsff({
      emitter,
      transporter,
      destination,
      previousPackagings: bsff.packagings
    });

    const { query } = makeClient(emitter.user);

    const { data } = await query<
      Pick<Query, "bsffPackagings">,
      QueryBsffPackagingsArgs
    >(GET_BSFF_PACKAGINGS, {
      variables: { where: { nextBsff: null } }
    });

    expect(data.bsffPackagings.edges).toHaveLength(1);
    expect(data.bsffPackagings.edges.map(({ node }) => node.id)).toEqual([
      bsff2.packagings[0].id
    ]);
  });

  it("should filter packagings where next BSFF has a particular ID", async () => {
    const emitter = await userWithCompanyFactory(UserRole.MEMBER);
    const transporter = await userWithCompanyFactory(UserRole.MEMBER);
    const destination = await userWithCompanyFactory(UserRole.MEMBER);

    // this bsff packagings should  be included
    const bsff = await createBsffAfterOperation(
      {
        emitter,
        transporter,
        destination
      },
      {},
      { operationCode: OPERATION.R12.code }
    );

    // this bsff packagings should not be included
    const bsff2 = await createBsff({
      emitter,
      transporter,
      destination,
      previousPackagings: bsff.packagings
    });

    const { query } = makeClient(emitter.user);

    const { data } = await query<
      Pick<Query, "bsffPackagings">,
      QueryBsffPackagingsArgs
    >(GET_BSFF_PACKAGINGS, {
      variables: { where: { nextBsff: { id: { _eq: bsff2.id } } } }
    });

    expect(data.bsffPackagings.edges).toHaveLength(1);
    expect(data.bsffPackagings.edges.map(({ node }) => node.id)).toEqual([
      bsff.packagings[0].id
    ]);
  });
});
