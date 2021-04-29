import { resetDatabase } from "../../../../../integration-tests/helper";
import makeClient from "../../../../__tests__/testClient";
import { userFactory } from "../../../../__tests__/factories";
import { Query } from "../../../../generated/graphql/types";

const ME = `
  query Me {
    me {
      id
      isAdmin
    }
  }
`;

describe("query me", () => {
  afterAll(resetDatabase);

  it("should return authenticated user", async () => {
    const user = await userFactory();
    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "me">>(ME);
    expect(data.me.id).toEqual(user.id);
    expect(data.me.isAdmin).toEqual(false);
  });
});
