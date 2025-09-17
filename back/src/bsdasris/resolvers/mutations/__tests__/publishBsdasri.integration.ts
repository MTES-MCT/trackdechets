import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import {
  bsdasriFactory,
  initialData,
  readyToPublishData
} from "../../../__tests__/factories";
import type { Mutation } from "@td/codegen-back";

const PUBLISH_DASRI = `
mutation PublishDasri($id: ID!){
  publishBsdasri(id: $id)  {
    id
    status
    isDraft
  }
}
`;
describe("Mutation.publishBsdasri", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });
    const { mutate } = makeClient(); // unauthenticated user
    const { errors } = await mutate<Pick<Mutation, "publishBsdasri">>(
      PUBLISH_DASRI,
      {
        variables: {
          id: dasri.id
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

  it("should publish a draft dasri without emitterWastePackagings", async () => {
    // Test new rule: `emitterWastePackagings` is not required for publication anymore
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: destination } = await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      userId: user.id,
      opt: {
        isDraft: true,
        ...initialData(company),
        ...readyToPublishData(destination),
        emitterWastePackagings: []
      }
    });

    const { mutate } = makeClient(user); // emitter

    const { data } = await mutate<Pick<Mutation, "publishBsdasri">>(
      PUBLISH_DASRI,
      {
        variables: {
          id: dasri.id
        }
      }
    );

    expect(data.publishBsdasri.status).toBe("INITIAL");
    expect(data.publishBsdasri.isDraft).toBe(false);
  });

  it("should publish a draft dasri", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: destination } = await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      userId: user.id,
      opt: {
        isDraft: true,
        ...initialData(company),
        ...readyToPublishData(destination)
      }
    });

    const { mutate } = makeClient(user); // emitter

    const { data } = await mutate<Pick<Mutation, "publishBsdasri">>(
      PUBLISH_DASRI,
      {
        variables: {
          id: dasri.id
        }
      }
    );

    expect(data.publishBsdasri.status).toBe("INITIAL");
    expect(data.publishBsdasri.isDraft).toBe(false);
  });

  it("should not publish an already published dasri", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: destination } = await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToPublishData(destination)
      }
    });

    const { mutate } = makeClient(user); // emitter

    const { errors } = await mutate<Pick<Mutation, "publishBsdasri">>(
      PUBLISH_DASRI,
      {
        variables: {
          id: dasri.id
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous ne pouvez pas publier ce bordereau.",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should  publish a draft dasri if auto completable fields are not filled", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: destination } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      userId: user.id,
      opt: {
        isDraft: true,
        ...initialData(company),
        ...readyToPublishData(destination),
        emitterCompanyName: null, // missing field, will be completed by sirenify
        destinationCompanyName: null // missing field, will be completed by sirenify
      }
    });

    const { mutate } = makeClient(user); // emitter

    const { data } = await mutate<Pick<Mutation, "publishBsdasri">>(
      PUBLISH_DASRI,
      {
        variables: {
          id: dasri.id
        }
      }
    );
    expect(data.publishBsdasri.status).toBe("INITIAL");
    expect(data.publishBsdasri.isDraft).toBe(false);
  });

  it("should  not  publish a draft dasri if mandatory fields are  not filled", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: destination } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      userId: user.id,
      opt: {
        isDraft: true,
        ...initialData(company),
        ...readyToPublishData(destination),

        destinationCompanySiret: null // missing field
      }
    });

    const { mutate } = makeClient(user); // emitter

    const { errors } = await mutate<Pick<Mutation, "publishBsdasri">>(
      PUBLISH_DASRI,
      {
        variables: {
          id: dasri.id
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Le SIRET du destinataire est un champ requis.",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });
});
