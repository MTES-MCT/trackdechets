import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import { Mutation } from "../../../../generated/graphql/types";
import {
  companyFactory,
  siretify,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const CREATE_VHU_FORM = `
mutation CreateVhuForm($input: BsvhuInput!) {
  createDraftBsvhu(input: $input) {
    id
    customId
    destination {
      company {
          siret
      }
    }
    emitter {
      company {
          siret
      }
    }
    transporter {
      company {
        siret
        name
        address
        contact
        mail
        phone
      }
    }
    weight {
      value
    }
  }
}
`;

describe("Mutation.Vhu.createDraft", () => {
  afterEach(async () => {
    await resetDatabase();
  });

  it("should disallow unauthenticated user", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<Pick<Mutation, "createDraftBsvhu">>(
      CREATE_VHU_FORM,
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

  it("should disallow a user to create a form they are not part of", async () => {
    const user = await userFactory();

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createDraftBsvhu">>(
      CREATE_VHU_FORM,
      {
        variables: {
          input: {
            emitter: {
              company: {
                siret: siretify(7)
              }
            }
          }
        }
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

  it("create a form with an emitter and a destination", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const destination = await companyFactory({
      companyTypes: ["WASTE_VEHICLES"]
    });

    const input = {
      emitter: {
        company: {
          siret: company.siret
        }
      },
      destination: {
        company: {
          siret: destination.siret
        }
      }
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createDraftBsvhu">>(
      CREATE_VHU_FORM,
      {
        variables: {
          input
        }
      }
    );

    expect(data.createDraftBsvhu.destination!.company).toMatchObject(
      input.destination.company
    );
  });

  it("create a form with a customid", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const destination = await companyFactory({
      companyTypes: ["WASTE_VEHICLES"]
    });

    const input = {
      customId: "my custom id",
      emitter: {
        company: {
          siret: company.siret
        }
      },
      destination: {
        company: {
          siret: destination.siret
        }
      }
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createDraftBsvhu">>(
      CREATE_VHU_FORM,
      {
        variables: {
          input
        }
      }
    );

    expect(data.createDraftBsvhu.customId).toEqual("my custom id");
  });
});
