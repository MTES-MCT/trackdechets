import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import { Mutation } from "../../../../generated/graphql/types";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { bsvhuFactory } from "../../../__tests__/factories.vhu";

const PUBLISH_VHU_FORM = `
mutation PublishBsvhu($id: ID!) {
  publishBsvhu(id: $id) {
      id
      isDraft
  }
}
`;

describe("Mutation.Vhu.publish", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<Pick<Mutation, "publishBsvhu">>(
      PUBLISH_VHU_FORM,
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
    const form = await bsvhuFactory({
      opt: {
        emitterCompanySiret: company.siret,
        isDraft: false
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "publishBsvhu">>(
      PUBLISH_VHU_FORM,
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
    const form = await bsvhuFactory({
      opt: {
        emitterCompanySiret: company.siret,
        isDraft: true
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "publishBsvhu">>(
      PUBLISH_VHU_FORM,
      {
        variables: { id: form.id }
      }
    );

    expect(data.publishBsvhu.isDraft).toBe(false);
  });
});
