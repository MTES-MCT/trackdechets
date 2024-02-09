import { resetDatabase } from "../../../../../integration-tests/helper";
import { formFactory, userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { Mutation } from "../../../../generated/graphql/types";

const REINDEX_BSDS = `
mutation reindexBsds($ids: String!) {
    reindexBsds(ids: $ids) {
      accepted
      rejected
    }
  }`;

describe("Mutation.reindexBsds", () => {
  afterEach(resetDatabase);

  it("should return error if ID is invalid", async () => {
    // Given
    const admin = await userFactory({ isAdmin: true });

    // When
    const { mutate } = makeClient(admin);
    const { errors } = await mutate<Pick<Mutation, "reindexBsds">>(
      REINDEX_BSDS,
      {
        variables: {
          ids: "invalidid"
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual(
      `"invalidid" n'est pas un identifiant de bordereau valide`
    );
  });

  it("should work with empty string", async () => {
    // Given
    const admin = await userFactory({ isAdmin: true });

    // When
    const { mutate } = makeClient(admin);
    const { data, errors } = await mutate<Pick<Mutation, "reindexBsds">>(
      REINDEX_BSDS,
      {
        variables: {
          ids: ""
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();
    expect(data.reindexBsds.accepted).toEqual([]);
    expect(data.reindexBsds.rejected).toEqual([]);
  });

  it("should work with one ID", async () => {
    // Given
    const admin = await userFactory({ isAdmin: true });
    const bsdd = await formFactory({ ownerId: admin.id });

    // When
    const { mutate } = makeClient(admin);
    const { data, errors } = await mutate<Pick<Mutation, "reindexBsds">>(
      REINDEX_BSDS,
      {
        variables: {
          ids: bsdd.readableId
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();
    expect(data.reindexBsds.accepted).toEqual([bsdd.readableId]);
    expect(data.reindexBsds.rejected).toEqual([]);
  });

  it("should reject invalid ID", async () => {
    // Given
    const admin = await userFactory({ isAdmin: true });
    const invalidId = "BSD-20230101-XXXXXXXXX";

    // When
    const { mutate } = makeClient(admin);
    const { data, errors } = await mutate<Pick<Mutation, "reindexBsds">>(
      REINDEX_BSDS,
      {
        variables: {
          ids: invalidId
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();
    expect(data.reindexBsds.accepted).toEqual([]);
    expect(data.reindexBsds.rejected).toEqual([invalidId]);
  });

  it("should work with multiple IDs, even if malformed", async () => {
    // Given
    const admin = await userFactory({ isAdmin: true });
    const bsdd1 = await formFactory({ ownerId: admin.id });
    const bsdd2 = await formFactory({ ownerId: admin.id });

    // When
    const { mutate } = makeClient(admin);
    const { data, errors } = await mutate<Pick<Mutation, "reindexBsds">>(
      REINDEX_BSDS,
      {
        variables: {
          ids: `${bsdd1.readableId} ${bsdd2.readableId.toLowerCase()}`
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();
    expect(data.reindexBsds.accepted).toEqual([
      bsdd1.readableId,
      bsdd2.readableId
    ]);
    expect(data.reindexBsds.rejected).toEqual([]);
  });

  it("should index all possible IDs, and reject others", async () => {
    // Given
    const admin = await userFactory({ isAdmin: true });
    const bsdd1 = await formFactory({ ownerId: admin.id });
    const invalidId = "BSD-20230101-XXXXXXXXX";
    const bsdd2 = await formFactory({ ownerId: admin.id });

    // When
    const { mutate } = makeClient(admin);
    const { data, errors } = await mutate<Pick<Mutation, "reindexBsds">>(
      REINDEX_BSDS,
      {
        variables: {
          ids: `${
            bsdd1.readableId
          } ${invalidId} ${bsdd2.readableId.toLowerCase()}`
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();
    expect(data.reindexBsds.accepted).toEqual([
      bsdd1.readableId,
      bsdd2.readableId
    ]);
    expect(data.reindexBsds.rejected).toEqual([invalidId]);
  });
});
