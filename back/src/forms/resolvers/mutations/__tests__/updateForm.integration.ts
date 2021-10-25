import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import { ErrorCode } from "../../../../common/errors";
import {
  companyFactory,
  formFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { Mutation } from "../../../../generated/graphql/types";
import { Status } from ".prisma/client";

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
        siret
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
        status: "DRAFT",
        emitterCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient();
    const { errors } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
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
        status: "DRAFT",
        emitterCompanySiret: company.siret
      }
    });
    const currentUser = await userFactory();

    const { mutate } = makeClient(currentUser);
    const { errors } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
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
        message: "Vous n'êtes pas autorisé à modifier ce bordereau",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should not be possible to update a signed form", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        status: "SENT"
      }
    });

    const { mutate } = makeClient(user);
    const updateFormInput = {
      id: form.id,
      wasteDetails: {
        code: "01 01 01"
      }
    };
    const { errors } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Seuls les bordereaux en brouillon ou en attente de collecte peuvent être modifiés",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it.each(["emitter", "trader", "recipient", "transporter"])(
    "should allow %p to update a draft form",
    async role => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const form = await formFactory({
        ownerId: user.id,
        opt: {
          status: "DRAFT",
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
      const { data } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
        variables: { updateFormInput }
      });
      expect(data.updateForm.wasteDetails).toMatchObject(
        updateFormInput.wasteDetails
      );
    }
  );

  it.each(["emitter", "trader", "recipient", "transporter"])(
    "should allow %p to update a sealed form",
    async role => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const form = await formFactory({
        ownerId: user.id,
        opt: {
          [`${role}CompanySiret`]: company.siret,
          status: "SEALED"
        }
      });

      const { mutate } = makeClient(user);
      const updateFormInput = {
        id: form.id,
        wasteDetails: {
          code: "08 01 11*"
        }
      };
      const { data } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
        variables: { updateFormInput }
      });

      expect(data.updateForm.wasteDetails).toMatchObject(
        updateFormInput.wasteDetails
      );
    }
  );

  it("should not be possible to invalidate a sealed form", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        status: "SEALED"
      }
    });

    const { mutate } = makeClient(user);
    const updateFormInput = {
      id: form.id,
      // try to set an empty siret
      recipient: {
        company: {
          siret: ""
        }
      }
    };
    const { errors } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });

    expect(errors).toMatchObject([
      expect.objectContaining({
        extensions: { code: ErrorCode.BAD_USER_INPUT },
        message: "Destinataire: Le siret de l'entreprise est obligatoire"
      })
    ]);
  });

  it("should not be possible to remove its own company from a sealed form", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        status: "SEALED"
      }
    });

    const { mutate } = makeClient(user);
    const updateFormInput = {
      id: form.id,
      // try to remove user's company from the form
      emitter: {
        company: {
          siret: "11111111111111"
        }
      }
    };
    const { errors } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });

    expect(errors).toMatchObject([
      expect.objectContaining({
        extensions: { code: ErrorCode.FORBIDDEN },
        message: "Vous ne pouvez pas enlever votre établissement du bordereau"
      })
    ]);
  });

  it("should allow an eco-organisme to update a form", async () => {
    const { user, company: eo } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["ECO_ORGANISME"]
      }
    });
    await prisma.ecoOrganisme.create({
      data: {
        address: "",
        name: eo.name,
        siret: eo.siret
      }
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterType: "OTHER",
        ecoOrganismeName: eo.name,
        ecoOrganismeSiret: eo.siret
      }
    });

    const updateFormInput = {
      id: form.id,
      wasteDetails: {
        code: "01 01 01"
      }
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
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
    const { errors } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
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
        emitterCompanySiret: company.siret,
        status: "DRAFT"
      }
    });

    const updateFormInput = {
      id: form.id,
      emitter: {
        type: "OTHER"
      },
      ecoOrganisme: {
        name: "",
        siret: "does_not_exist"
      }
    };
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: {
        updateFormInput
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `L'éco-organisme avec le siret "${updateFormInput.ecoOrganisme.siret}" n'est pas reconnu.`,
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should update the eco-organisme", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const originalEO = await companyFactory({
      companyTypes: {
        set: ["ECO_ORGANISME"]
      }
    });
    await prisma.ecoOrganisme.create({
      data: {
        address: "",
        name: originalEO.name,
        siret: originalEO.siret
      }
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        ecoOrganismeName: originalEO.name,
        ecoOrganismeSiret: originalEO.siret
      }
    });
    const newEO = await companyFactory({
      companyTypes: {
        set: ["ECO_ORGANISME"]
      }
    });
    await prisma.ecoOrganisme.create({
      data: {
        address: "",
        name: newEO.name,
        siret: newEO.siret
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: {
        updateFormInput: {
          id: form.id,
          emitter: {
            type: "OTHER"
          },
          ecoOrganisme: {
            name: newEO.name,
            siret: newEO.siret
          }
        }
      }
    });

    expect(data.updateForm.ecoOrganisme.siret).toBe(newEO.siret);
  });

  it("should remove the eco-organisme", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const eo = await companyFactory({
      companyTypes: {
        set: ["ECO_ORGANISME"]
      }
    });
    await prisma.ecoOrganisme.create({
      data: {
        address: "",
        name: eo.name,
        siret: eo.siret
      }
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        ecoOrganismeName: eo.name,
        ecoOrganismeSiret: eo.siret
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
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
        status: "DRAFT",
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
    const { data } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
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
        status: "DRAFT",
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
    const { data } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
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
        status: "DRAFT",
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
    const { data } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
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
        status: "DRAFT",
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
    const { data } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
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
        status: "DRAFT",
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
    const { data } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
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
        status: "DRAFT",
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
    const { data } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
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
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        recipientCompanySiret: originalRecipientCompany.siret
      }
    });

    const updateFormInput = {
      id: form.id,
      recipient: null
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
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
          status: "DRAFT",
          emitterCompanySiret: company.siret
        }
      });

      const { mutate } = makeClient(user);
      const { errors } = await mutate<Pick<Mutation, "updateForm">>(
        UPDATE_FORM,
        {
          variables: {
            updateFormInput: {
              id: form.id,
              wasteDetails: {
                code: wasteCode
              }
            }
          }
        }
      );

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

  it("should update appendix2 status", async () => {
    const { user, company: ttr } = await userWithCompanyFactory("MEMBER");

    const appendixForm = await formFactory({
      ownerId: user.id,
      opt: {
        status: "GROUPED",
        recipientCompanySiret: ttr.siret
      }
    });
    const toBeAppendixForm = await formFactory({
      ownerId: user.id,
      opt: {
        status: "AWAITING_GROUP",
        recipientCompanySiret: ttr.siret
      }
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SEALED",
        emitterCompanySiret: ttr.siret,
        appendix2Forms: { connect: { id: appendixForm.id } }
      }
    });

    const updateFormInput = {
      id: form.id,
      appendix2Forms: [{ id: toBeAppendixForm.id }]
    };
    const { mutate } = makeClient(user);
    await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: {
        updateFormInput
      }
    });

    // Old appendix form is back to AWAITING_GROUP
    const oldAppendix2Form = await prisma.form.findUnique({
      where: { id: appendixForm.id }
    });
    expect(oldAppendix2Form.status).toBe("AWAITING_GROUP");

    // New appendix form is now GROUPED
    const newAppendix2Form = await prisma.form.findUnique({
      where: { id: toBeAppendixForm.id }
    });
    expect(newAppendix2Form.status).toBe("GROUPED");
  });

  it("should disallow linking an appendix 2 form if the emitter of the regroupement form is not the recipient of the initial form", async () => {
    const { user, company: ttr } = await userWithCompanyFactory("MEMBER");
    const initialAppendix2 = await formFactory({
      ownerId: user.id,
      opt: { status: Status.AWAITING_GROUP, recipientCompanySiret: ttr.siret }
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: Status.SEALED,
        emitterCompanySiret: ttr.siret,
        appendix2Forms: { connect: [{ id: initialAppendix2.id }] }
      }
    });

    const wannaBeAppendix2 = await formFactory({
      ownerId: (await userFactory()).id,
      opt: { status: Status.AWAITING_GROUP }
    });

    const updateFormInput = {
      id: form.id,
      appendix2Forms: [{ id: wannaBeAppendix2.id }]
    };
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: `Le bordereau ${wannaBeAppendix2.id} n'est pas en possession du nouvel émetteur`
      })
    ]);
  });
});
