import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import makeClient from "../../../../__tests__/testClient";

const SIGN_VHU_FORM = `
mutation SignVhuForm($id: ID!, $vhuSignatureInput: VhuSignatureInput!) {
  bordereauVhu {
    sign(id: $id, input: $vhuSignatureInput) {
        id
    }
  }
}
`;

describe("Mutation.Vhu.sign", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate(SIGN_VHU_FORM, {
      variables: {
        id: 1,
        vhuSignatureInput: { type: "EMITTER", author: "The Ghost" }
      }
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
});
