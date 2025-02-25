import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import type { Mutation } from "@td/codegen-back";
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
      userId: user.id,
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

  it("should fail if the user is not part a the creator's companies", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: company2, user: user2 } = await userWithCompanyFactory(
      "ADMIN",
      {
        companyTypes: ["TRANSPORTER"]
      }
    );
    const form = await bsvhuFactory({
      userId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        transporterCompanySiret: company2.siret,
        isDraft: true
      }
    });

    const { mutate } = makeClient(user2);
    const { errors } = await mutate<Pick<Mutation, "publishBsvhu">>(
      PUBLISH_VHU_FORM,
      {
        variables: { id: form.id }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Votre établissement doit être visé sur le bordereau",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should fail when packaging is UNITE and identificationType is nullshould pass the form as non draft", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await bsvhuFactory({
      userId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        isDraft: true,
        packaging: "UNITE",
        identificationType: null
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "publishBsvhu">>(
      PUBLISH_VHU_FORM,
      {
        variables: { id: form.id }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "identificationType : Le type d'identification est obligatoire quand le conditionnement est en unité\n" +
          "Le type de numéro d'identification est un champ requis.",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });
});
