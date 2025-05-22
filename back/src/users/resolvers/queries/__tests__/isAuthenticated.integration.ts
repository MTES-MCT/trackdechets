import { resetDatabase } from "../../../../../integration-tests/helper";
import makeClient from "../../../../__tests__/testClient";
import { userFactory } from "../../../../__tests__/factories";
import type { Query } from "@td/codegen-back";
import { AuthType } from "../../../../auth/auth";

const IS_AUTHENTICATED = `
  query IsAuthenticated {
    isAuthenticated
  }
`;

describe("query isAuthenticated", () => {
  afterAll(resetDatabase);

  it("should return true if user is authenticated", async () => {
    // Given
    const user = await userFactory();

    // When
    const { query } = makeClient(user);
    const { data, errors } = await query<Pick<Query, "isAuthenticated">>(
      IS_AUTHENTICATED
    );

    // Then
    expect(errors).toBeUndefined();
    expect(data.isAuthenticated).toEqual(true);
  });

  it("should return false if user is not authenticated", async () => {
    // Given

    // When
    const { query } = makeClient();
    const { data, errors } = await query<Pick<Query, "isAuthenticated">>(
      IS_AUTHENTICATED
    );

    // Then
    expect(errors).toBeUndefined();
    expect(data.isAuthenticated).toEqual(false);
  });

  it("should return false if not SESSION", async () => {
    // Given
    const user = await userFactory();

    // When
    const { query } = makeClient({ ...user, auth: AuthType.Bearer });
    const { errors, data } = await query<Pick<Query, "isAuthenticated">>(
      IS_AUTHENTICATED
    );

    // Then
    expect(errors).toBeUndefined();
    expect(data.isAuthenticated).toEqual(false);
  });
});
