import { resetDatabase } from "../../../../integration-tests/helper";
import {
  userWithCompanyFactory,
  userFactory,
  formFactory,
  companyFactory
} from "../../../__tests__/factories";
import makeClient from "../../../__tests__/testClient";
import { prisma } from "../../../generated/prisma-client";
import { ErrorCode } from "../../../common/errors";

const UPDATE_FORM = `
  mutation UpdateForm($updateFormInput: UpdateFormInput!) {
    updateForm(updateFormInput: $updateFormInput) {
      id
      wasteDetails {
        name
        code
      }
      recipient {
        company {
          siret
        }
      }
      emitter {
        workSite {
          name
          address
          city
          postalCode
          infos
        }
      }
      temporaryStorageDetail {
        destination {
          cap
        }
      }
      ecoOrganisme {
        id
      }
    }
  }
`;

describe("Mutation.updateForm", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient();
    const { errors } = await mutate(UPDATE_FORM, {
      variables: {
        updateFormInput: {
          id: form.id
        }
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

  it("should disallow a user to update a form they are not part of", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret
      }
    });
    const currentUser = await userFactory();

    const { mutate } = makeClient(currentUser);
    const { errors } = await mutate(UPDATE_FORM, {
      variables: {
        updateFormInput: {
          id: form.id,
          wasteDetails: {
            code: "01 01 01"
          }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous n'êtes pas autorisé à accéder à un bordereau sur lequel votre entreprise n'apparait pas.",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it.each(["emitter", "trader", "recipient", "transporter"])(
    "should allow %p to update a form",
    async role => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const form = await formFactory({
        ownerId: user.id,
        opt: {
          [`${role}CompanySiret`]: company.siret
        }
      });

      const { mutate } = makeClient(user);
      const updateFormInput = {
        id: form.id,
        wasteDetails: {
          code: "01 01 01"
        }
      };
      const { data } = await mutate(UPDATE_FORM, {
        variables: { updateFormInput }
      });

      expect(data.updateForm.wasteDetails).toMatchObject(
        updateFormInput.wasteDetails
      );
    }
  );

  it("should allow an eco-organisme to update a form", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const eo = await prisma.createEcoOrganisme({
      address: "an address",
      name: "a name",
      siret: company.siret
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        ecoOrganisme: {
          connect: {
            id: eo.id
          }
        }
      }
    });

    const updateFormInput = {
      id: form.id,
      wasteDetails: {
        code: "01 01 01"
      }
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate(UPDATE_FORM, {
      variables: {
        updateFormInput
      }
    });

    expect(data.updateForm.wasteDetails).toMatchObject(
      updateFormInput.wasteDetails
    );
  });

  it("should return an error when updating a non-existing form", async () => {
    const user = await userFactory();

    const updateFormInput = {
      id: "does_not_exist"
    };
    const { mutate } = makeClient(user);
    const { errors } = await mutate(UPDATE_FORM, {
      variables: {
        updateFormInput
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Le bordereau avec l'identifiant "${updateFormInput.id}" n'existe pas.`,
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should return an error when trying to add a non-existing eco-organisme", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const updateFormInput = {
      id: form.id,
      ecoOrganisme: {
        id: "does_not_exist"
      }
    };
    const { mutate } = makeClient(user);
    const { errors } = await mutate(UPDATE_FORM, {
      variables: {
        updateFormInput
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `L'éco-organisme avec l'identifiant "${updateFormInput.ecoOrganisme.id}" n'existe pas.`,
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should update the eco-organisme", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        ecoOrganisme: {
          create: {
            siret: "0".repeat(14),
            address: "Original EO Address",
            name: "Original EO Name"
          }
        }
      }
    });
    const newEO = await prisma.createEcoOrganisme({
      address: "New EO Address",
      name: "New EO Name",
      siret: "1".repeat(14)
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate(UPDATE_FORM, {
      variables: {
        updateFormInput: {
          id: form.id,
          ecoOrganisme: {
            id: newEO.id
          }
        }
      }
    });

    expect(data.updateForm.ecoOrganisme.id).toBe(newEO.id);
  });

  it("should remove the eco-organisme", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        ecoOrganisme: {
          create: {
            siret: "0".repeat(14),
            address: "Original EO Address",
            name: "Original EO Name"
          }
        }
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate(UPDATE_FORM, {
      variables: {
        updateFormInput: {
          id: form.id,
          ecoOrganisme: null
        }
      }
    });

    expect(data.updateForm.ecoOrganisme).toBeNull();
  });

  it("should update a form", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const updateFormInput = {
      id: form.id,
      wasteDetails: {
        name: "things"
      }
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate(UPDATE_FORM, {
      variables: { updateFormInput }
    });
    expect(data.updateForm.wasteDetails).toMatchObject(
      updateFormInput.wasteDetails
    );
  });

  it("should add a temporary storage", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const updateFormInput = {
      id: form.id,
      recipient: {
        isTempStorage: true
      },
      temporaryStorageDetail: {
        destination: {
          cap: "CAP"
        }
      }
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate(UPDATE_FORM, {
      variables: {
        updateFormInput
      }
    });

    expect(data.updateForm.temporaryStorageDetail.destination).toMatchObject(
      updateFormInput.temporaryStorageDetail.destination
    );
  });

  it("should update the temporary storage", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        recipientIsTempStorage: true,
        temporaryStorageDetail: {
          create: {
            destinationCap: "OLD CAP"
          }
        }
      }
    });

    const updateFormInput = {
      id: form.id,
      temporaryStorageDetail: {
        destination: {
          cap: "NEW CAP"
        }
      }
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate(UPDATE_FORM, {
      variables: {
        updateFormInput
      }
    });

    expect(data.updateForm.temporaryStorageDetail.destination).toMatchObject(
      updateFormInput.temporaryStorageDetail.destination
    );
  });

  it("should remove a temporary storage", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        temporaryStorageDetail: {
          create: {
            destinationCap: "CAP"
          }
        }
      }
    });

    const updateFormInput = {
      id: form.id,
      temporaryStorageDetail: null
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate(UPDATE_FORM, {
      variables: {
        updateFormInput
      }
    });

    expect(data.updateForm.temporaryStorageDetail).toBeNull();
  });

  it("should add a recipient", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret
      }
    });
    const newRecipientCompany = await companyFactory();

    const { mutate } = makeClient(user);
    const updateFormInput = {
      id: form.id,
      recipient: {
        company: {
          siret: newRecipientCompany.siret
        }
      }
    };
    const { data } = await mutate(UPDATE_FORM, {
      variables: {
        updateFormInput
      }
    });

    expect(data.updateForm.recipient.company).toMatchObject(
      updateFormInput.recipient.company
    );
  });

  it("should update the recipient", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const originalRecipientCompany = await companyFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        recipientCompanySiret: originalRecipientCompany.siret
      }
    });
    const newRecipientCompany = await companyFactory();

    const updateFormInput = {
      id: form.id,
      recipient: {
        company: {
          siret: newRecipientCompany.siret
        }
      }
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate(UPDATE_FORM, {
      variables: {
        updateFormInput
      }
    });

    expect(data.updateForm.recipient.company).toMatchObject(
      updateFormInput.recipient.company
    );
  });

  it("should remove the recipient", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const originalRecipientCompany = await companyFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        recipientCompanySiret: originalRecipientCompany.siret
      }
    });

    const updateFormInput = {
      id: form.id,
      recipient: null
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate(UPDATE_FORM, {
      variables: {
        updateFormInput
      }
    });

    expect(data.updateForm.recipient).toBeNull();
  });

  it.each([
    "abc",
    // Code of a category, not a waste
    "01",
    // Code of a sub-category, not a waste
    "01 01"
  ])(
    "should return an error when update a form with the invalid waste code %p",
    async wasteCode => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const form = await formFactory({
        ownerId: user.id,
        opt: {
          emitterCompanySiret: company.siret
        }
      });

      const { mutate } = makeClient(user);
      const { errors } = await mutate(UPDATE_FORM, {
        variables: {
          updateFormInput: {
            id: form.id,
            wasteDetails: {
              code: wasteCode
            }
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message: `Le code déchet "${wasteCode}" n'est pas reconnu comme faisant partie de la liste officielle du code de l'environnement.`,
          extensions: expect.objectContaining({
            code: ErrorCode.BAD_USER_INPUT
          })
        })
      ]);
    }
  );
});
