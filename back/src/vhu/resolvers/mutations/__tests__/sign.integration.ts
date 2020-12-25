import { resetDatabase } from "integration-tests/helper";
import { ErrorCode } from "src/common/errors";
import makeClient from "src/__tests__/testClient";

const SIGN_VHU_FORM = `
mutation SignVhuForm($id: ID!, $vhuSignatureInput: VhuSignatureInput!) {
    signVhuForm(id: $id, vhuSignatureInput: $vhuSignatureInput) {
        id
    }
}
`;

describe("Mutation.signVhuForm", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate(SIGN_VHU_FORM, {
      variables: {
        id: 1,
        vhuSignatureInput: { type: "SENT", signedBy: "The Ghost" }
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
