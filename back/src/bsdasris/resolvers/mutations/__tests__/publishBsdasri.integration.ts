import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { bsdasriFactory, initialData } from "../../../__tests__/factories";
import { Mutation } from "../../../../generated/graphql/types";
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

  it("should publish a draft dasri", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      opt: {
        isDraft: true,
        ...initialData(company)
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

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company)
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

  it("should not publish a draft dasri if mandatory fields are not filled", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      opt: {
        isDraft: true,
        ...initialData(company),
        emitterCompanyName: null // missing field
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
        message: "Émetteur: Le nom de l'entreprise est obligatoire",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });
});
