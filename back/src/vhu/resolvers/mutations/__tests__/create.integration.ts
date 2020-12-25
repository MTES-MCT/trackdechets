import { resetDatabase } from "integration-tests/helper";
import { ErrorCode } from "src/common/errors";
import { userFactory, userWithCompanyFactory } from "src/__tests__/factories";
import makeClient from "src/__tests__/testClient";

const CREATE_VHU_FORM = `
mutation CreateVhuForm($vhuFormInput: VhuFormInput!) {
    createVhuForm(vhuFormInput: $vhuFormInput) {
      id
      recipient {
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
      wasteDetails {
        quantity
      }
    }
  }
`;

describe("Mutation.createVhuForm", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate(CREATE_VHU_FORM, {
      variables: { vhuFormInput: {} }
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

  it("should disallow a user to create a form they are not part of", async () => {
    const user = await userFactory();

    const { mutate } = makeClient(user);
    const { errors } = await mutate(CREATE_VHU_FORM, {
      variables: {
        vhuFormInput: {
          emitter: {
            company: {
              siret: "siret"
            }
          }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas créer un bordereau sur lequel votre entreprise n'apparait pas",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("create a form with an emitter and a recipient", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const vhuFormInput = {
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
    const { data } = await mutate(CREATE_VHU_FORM, {
      variables: {
        vhuFormInput
      }
    });

    expect(data.createVhuForm.recipient.company).toMatchObject(
      vhuFormInput.recipient.company
    );
  });
});
