import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import type { Mutation } from "@td/codegen-back";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { bsdaFactory } from "../../../__tests__/factories";

const PUBLISH_BSDA = `
mutation PublishBsda($id: ID!) {
  publishBsda(id: $id) {
      id
      isDraft
  }
}
`;

describe("Mutation.Bsda.publish", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<Pick<Mutation, "publishBsda">>(
      PUBLISH_BSDA,
      {
        variables: {
          id: 1
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas connecté.",
        extensions: expect.objectContaining({
          code: ErrorCode.UNAUTHENTICATED
        })
      })
    ]);
  });

  it("should fail if the form is not a draft", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret,
        isDraft: false
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "publishBsda">>(
      PUBLISH_BSDA,
      {
        variables: { id: form.id }
      }
    );

    expect(errors[0].message).toBe(
      "Impossible de publier un bordereau qui n'est pas un brouillon"
    );
  });

  it("should pass the form as non draft", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await bsdaFactory({
      userId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        isDraft: true
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "publishBsda">>(PUBLISH_BSDA, {
      variables: { id: form.id }
    });

    expect(data.publishBsda.isDraft).toBe(false);
  });
});
