import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import {
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { Mutation } from "../../../../generated/graphql/types";

const CREATE_DRAFT_DASRI = `
mutation DasriCreate($input: BsdasriCreateInput!) {
  createDraftBsdasri(input: $input)  {
    id
    isDraft
    status
    recipient {
      company {
        siret
      }
    }
  }
}
`;
describe("Mutation.createDraftBsdasri", () => {
  afterEach(async () => {
    await resetDatabase();
  });

  it("should disallow unauthenticated user", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<Pick<Mutation, "createDraftBsdasri">>(
      CREATE_DRAFT_DASRI,
      {
        variables: { input: {} }
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

  it("should disallow a user to create a dasri they are not part of", async () => {
    const user = await userFactory();

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createDraftBsdasri">>(
      CREATE_DRAFT_DASRI,
      {
        variables: {
          input: {
            emitter: {
              company: {
                siret: "9999"
              }
            }
          }
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas créer un bordereau sur lequel votre entreprise n'apparaît pas",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("create a draft dasri with an emitter and a recipient", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const input = {
      emitter: {
        company: {
          siret: company.siret
        }
      },
      recipient: {
        company: {
          siret: "11111111111111"
        }
      }
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createDraftBsdasri">>(
      CREATE_DRAFT_DASRI,
      {
        variables: {
          input
        }
      }
    );

    expect(data.createDraftBsdasri.isDraft).toBe(true);
    expect(data.createDraftBsdasri.status).toBe("INITIAL");
    expect(data.createDraftBsdasri.recipient.company).toMatchObject(
      input.recipient.company
    );
  });
});
