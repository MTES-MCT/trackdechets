import { resetDatabase } from "integration-tests/helper";
import { ErrorCode } from "src/common/errors";
import { vhuFormFactory } from "src/vhu/__tests__/factories.vhu";
import { userFactory, userWithCompanyFactory } from "src/__tests__/factories";
import makeClient from "src/__tests__/testClient";

const EDIT_VHU_FORM = `
mutation EditVhuForm($id: ID!, $vhuFormInput: VhuFormInput!) {
    editVhuForm(id: $id, vhuFormInput: $vhuFormInput) {
      id
      isDraft
      recipient {
        company {
            siret
        }
      }
      emitter {
        agreement
        company {
            siret
        }
      }
      transporter {
        agreement
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

describe("Mutation.editVhuForm", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate(EDIT_VHU_FORM, {
      variables: { id: 1, vhuFormInput: {} }
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

  it("should disallow a user to update a form they are not part of", async () => {
    const { user: anotherUser, company } = await userWithCompanyFactory(
      "MEMBER"
    );
    const form = await vhuFormFactory({
      ownerId: anotherUser.id,
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const conenctedUser = await userFactory();
    const { mutate } = makeClient(conenctedUser);
    const { errors } = await mutate(EDIT_VHU_FORM, {
      variables: {
        id: form.id,
        vhuFormInput: {
          wasteDetails: {
            quantity: 4
          }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas modifier un bordereau sur lequel votre entreprise n'apparait pas",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should be possible to update a non signed form", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await vhuFormFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user);
    const vhuFormInput = {
      wasteDetails: {
        quantity: 4
      }
    };
    const { data } = await mutate(EDIT_VHU_FORM, {
      variables: { id: form.id, vhuFormInput }
    });

    expect(data.editVhuForm.wasteDetails.quantity).toBe(4);
  });

  it("should allow isDraft update before any signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await vhuFormFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user);
    const vhuFormInput = {
      isDraft: true
    };
    const { data } = await mutate(EDIT_VHU_FORM, {
      variables: { id: form.id, vhuFormInput }
    });

    expect(data.editVhuForm.isDraft).toBe(true);
  });

  it("should disallow isDraft update after any signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await vhuFormFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        emitterSignature: {
          create: {
            signatory: { connect: { id: user.id } },
            signedBy: "The Signatory"
          }
        }
      }
    });

    const { mutate } = makeClient(user);
    const vhuFormInput = {
      isDraft: true
    };
    const { errors } = await mutate(EDIT_VHU_FORM, {
      variables: { id: form.id, vhuFormInput }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été vérouillés via signature et ne peuvent plus être modifiés: isDraft",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should allow emitter fields update before emitter signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await vhuFormFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user);
    const vhuFormInput = {
      emitter: {
        agreement: "new agreement"
      }
    };
    const { data } = await mutate(EDIT_VHU_FORM, {
      variables: { id: form.id, vhuFormInput }
    });

    expect(data.editVhuForm.emitter.agreement).toBe("new agreement");
  });

  it("should disallow emitter fields update after emitter signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await vhuFormFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        emitterSignature: {
          create: {
            signatory: { connect: { id: user.id } },
            signedBy: "The Signatory"
          }
        }
      }
    });

    const { mutate } = makeClient(user);
    const vhuFormInput = {
      emitter: {
        agreement: "new agreement"
      }
    };
    const { errors } = await mutate(EDIT_VHU_FORM, {
      variables: { id: form.id, vhuFormInput }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été vérouillés via signature et ne peuvent plus être modifiés: emitter.agreement",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should allow transporter fields update after emitter signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await vhuFormFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        emitterSignature: {
          create: {
            signatory: { connect: { id: user.id } },
            signedBy: "The Signatory"
          }
        }
      }
    });

    const { mutate } = makeClient(user);
    const vhuFormInput = {
      transporter: {
        agreement: "new transporter agreement"
      }
    };
    const { data } = await mutate(EDIT_VHU_FORM, {
      variables: { id: form.id, vhuFormInput }
    });

    expect(data.editVhuForm.transporter.agreement).toBe(
      "new transporter agreement"
    );
  });
});
