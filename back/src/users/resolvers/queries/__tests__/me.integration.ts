import { resetDatabase } from "../../../../../integration-tests/helper";
import makeClient from "../../../../__tests__/testClient";
import { userFactory } from "../../../../__tests__/factories";

const ME = `
  query Me {
    me {
      id
    }
  }
`;

describe("query me", () => {
  afterAll(resetDatabase);

  it("should return authenticated user", async () => {
    const user = await userFactory();
    const { query } = makeClient(user);
    const { data } = await query(ME);
    expect(data.me.id).toEqual(user.id);
  });
});
