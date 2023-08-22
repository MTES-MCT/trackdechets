import { EmitterType, Status, UserRole } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import { ErrorCode } from "../../../../common/errors";
import {
  companyFactory,
  formFactory,
  formWithTempStorageFactory,
  siretify,
  toIntermediaryCompany,
  userFactory,
  userWithCompanyFactory,
  transporterReceiptFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import {
  FormInput,
  Mutation,
  MutationUpdateFormArgs,
  UpdateFormInput
} from "../../../../generated/graphql/types";
import getReadableId from "../../../readableId";
import * as sirenify from "../../../sirenify";
import { sub } from "date-fns";

const sirenifyMock = jest
  .spyOn(sirenify, "sirenifyFormInput")
  .mockImplementation(input => Promise.resolve(input));

const UPDATE_FORM = `
  mutation UpdateForm($updateFormInput: UpdateFormInput!) {
    updateForm(updateFormInput: $updateFormInput) {
      id
      wasteDetails {
        name
        code
        isDangerous
        packagingInfos {
          type
          other
          quantity
        }
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
        company {
          siret
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
      appendix2Forms {
        id
      }
      grouping {
        quantity
        form {
          id
        }
      }
      intermediaries {
        siret
        name
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
        isExemptedOfReceipt
        receipt
        department
        validityLimit
        numberPlate
        customInfo
        mode
      }
    }
  }
`;

describe("Mutation.updateForm", () => {
  afterEach(async () => {
    await resetDatabase();
    sirenifyMock.mockClear();
  });

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

  it.each(["emitter", "trader", "broker", "recipient", "transporter"])(
    "should allow %p to update a draft form",
    async role => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const form = await formFactory({
        ownerId: user.id,
        opt: {
          status: "DRAFT",
          ...(role === "transporter"
            ? {
                transporters: {
                  create: {
                    [`${role}CompanySiret`]: company.siret,
                    number: 1
                  }
                }
              }
            : {
                [`${role}CompanySiret`]: company.siret
              })
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
      // check input is sirenified
      expect(sirenifyMock).toHaveBeenCalledTimes(1);
    }
  );

  it("should autocomplete transporter receipt with receipt pulled from db", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const transporterCompany = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });
    await transporterReceiptFactory({
      company: transporterCompany
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        transporters: {
          create: {
            transporterCompanySiret: company.siret,
            number: 1
          }
        }
      }
    });

    const { mutate } = makeClient(user);
    const updateFormInput = {
      id: form.id,
      transporter: {
        company: { siret: transporterCompany.siret }
      }
    };
    const { data } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });
    // receipt data is pulled from db
    expect(data.updateForm.transporter!.receipt).toEqual("the number");
    expect(data.updateForm.transporter!.department).toEqual("83");
    expect(data.updateForm.transporter!.validityLimit).toEqual(
      "2055-01-01T00:00:00.000Z"
    );
  });

  it("should null transporter receipt is they do not have receipt in db", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    // transporter has not receipt stored in db
    const transporterCompany = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        transporters: {
          create: {
            transporterCompanySiret: company.siret,
            number: 1,
            transporterReceipt: "plop",
            transporterDepartment: "65",
            transporterValidityLimit: new Date()
          }
        }
      }
    });

    const { mutate } = makeClient(user);
    const updateFormInput = {
      id: form.id,
      transporter: {
        company: { siret: transporterCompany.siret }
      }
    };
    const { data } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });
    // receipt data is pulled from db
    expect(data.updateForm.transporter!.receipt).toEqual(null);
    expect(data.updateForm.transporter!.department).toEqual(null);
    expect(data.updateForm.transporter!.validityLimit).toEqual(null);
  });

  it("should let the transporter receipt unchanged if transporter is unchanged", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const receipt = await transporterReceiptFactory({ company });
    // form receipt is fileld
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        transporters: {
          create: {
            transporterCompanySiret: company.siret,
            number: 1,
            transporterReceipt: receipt.transporterReceiptNumber,
            transporterDepartment: receipt.transporterReceiptNumber,
            transporterValidityLimit: receipt.transporterReceiptValidityLimit
          }
        }
      }
    });

    const { mutate } = makeClient(user);
    // transporter is unchanged
    const updateFormInput = {
      id: form.id,
      wasteDetails: {
        code: "01 01 01"
      }
    };
    const { data } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });
    // receipt data is unchanged
    expect(data.updateForm.transporter!.receipt).toEqual(
      receipt.transporterReceiptNumber
    );
    expect(data.updateForm.transporter!.department).toEqual(
      receipt.transporterReceiptNumber
    );
    expect(data.updateForm.transporter!.validityLimit).toEqual(
      receipt.transporterReceiptValidityLimit?.toISOString()
    );
  });

  it.each(["emitter", "trader", "broker", "recipient", "transporter"])(
    "should allow %p to update a sealed form",
    async role => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const form = await formFactory({
        ownerId: user.id,
        opt: {
          status: "SEALED",
          ...(role === "transporter"
            ? {
                transporters: {
                  create: {
                    [`${role}CompanySiret`]: company.siret,
                    number: 1
                  }
                }
              }
            : {
                [`${role}CompanySiret`]: company.siret
              }),
          ...(["trader", "broker"].includes(role)
            ? {
                [`${role}CompanyName`]: "Trader or Broker",
                [`${role}CompanyContact`]: "Mr Trader or Broker",
                [`${role}CompanyMail`]: "traderbroker@trackdechets.fr",
                [`${role}CompanyAddress`]: "Wall street",
                [`${role}CompanyPhone`]: "00 00 00 00 00",
                [`${role}Receipt`]: "receipt",
                [`${role}Department`]: "07",
                [`${role}ValidityLimit`]: new Date("2023-01-01")
              }
            : {})
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

  it("should allow a destination after temp storage to update a form", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const form = await formWithTempStorageFactory({
      ownerId: user.id,
      opt: { status: "DRAFT" },
      forwardedInOpts: { recipientCompanySiret: company.siret }
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
  });

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
          siret: siretify(7)
        }
      }
    };
    const { errors } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        }),
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
        siret: eo.siret!
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
        siret: siretify(3)
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
        siret: originalEO.siret!
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
        siret: newEO.siret!
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

    expect(data.updateForm.ecoOrganisme!.siret).toBe(newEO.siret);
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
        siret: eo.siret!
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

  it("should add the first intermediary on an existing ", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.MEMBER);
    const intermediary = await userWithCompanyFactory(UserRole.MEMBER);

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: {
        updateFormInput: {
          id: form.id,
          intermediaries: [toIntermediaryCompany(intermediary.company)]
        }
      }
    });
    // replace the previous
    expect(data.updateForm.intermediaries).toEqual([
      expect.objectContaining({
        name: intermediary.company.name,
        siret: intermediary.company.siret
      })
    ]);
  });

  it("should update the intermediary (twice)", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.MEMBER);
    const intermediary = await userWithCompanyFactory(UserRole.MEMBER);
    const intermediary2 = await userWithCompanyFactory(UserRole.MEMBER);

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        intermediaries: {
          create: [toIntermediaryCompany(intermediary.company)]
        }
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
          intermediaries: [toIntermediaryCompany(intermediary2.company)]
        }
      }
    });
    // replace the previous
    expect(data.updateForm.intermediaries).toEqual([
      expect.objectContaining({
        name: intermediary2.company.name,
        siret: intermediary2.company.siret
      })
    ]);
    //update a 2nd time
    const { data: data2 } = await mutate<Pick<Mutation, "updateForm">>(
      UPDATE_FORM,
      {
        variables: {
          updateFormInput: {
            id: form.id,
            emitter: {
              type: "OTHER"
            },
            intermediaries: [
              toIntermediaryCompany(intermediary2.company),
              toIntermediaryCompany(intermediary.company)
            ]
          }
        }
      }
    );

    expect(data2.updateForm.intermediaries).toEqual([
      {
        name: intermediary2.company.name,
        siret: intermediary2.company.siret
      },
      {
        name: intermediary.company.name,
        siret: intermediary.company.siret
      }
    ]);
  });

  it("should remove the intermediary when input is an empty array", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.MEMBER);
    const intermediary = await userWithCompanyFactory(UserRole.MEMBER);

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        intermediaries: {
          create: [toIntermediaryCompany(intermediary.company)]
        }
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
          intermediaries: []
        }
      }
    });

    expect(data.updateForm.intermediaries).toEqual([]);
  });

  it("should remove the intermediary when input intermediaries is null", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.MEMBER);
    const intermediary = await userWithCompanyFactory(UserRole.MEMBER);

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        intermediaries: {
          create: [toIntermediaryCompany(intermediary.company)]
        }
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
          intermediaries: null
        }
      }
    });

    expect(data.updateForm.intermediaries).toEqual([]);
  });

  it("should not update the intermediary when no input", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.MEMBER);
    const intermediary = await userWithCompanyFactory(UserRole.MEMBER);

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        intermediaries: {
          create: [toIntermediaryCompany(intermediary.company)]
        }
      }
    });
    const { mutate } = makeClient(user);

    const { data } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: {
        updateFormInput: {
          id: form.id,
          emitter: {
            type: "OTHER"
          }
        }
      }
    });

    expect(data.updateForm.intermediaries).toEqual([
      {
        name: intermediary.company.name,
        siret: intermediary.company.siret
      }
    ]);
  });

  it("should update a form as an intermediary", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const intermediary = await userWithCompanyFactory(UserRole.MEMBER);
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SEALED",
        emitterCompanySiret: company.siret,
        intermediaries: {
          create: [toIntermediaryCompany(intermediary.company)]
        }
      }
    });

    const updateFormInput = {
      id: form.id,
      wasteDetails: {
        name: "things"
      }
    };
    const { mutate } = makeClient(intermediary.user);
    const { data } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });
    expect(data.updateForm.wasteDetails).toMatchObject(
      updateFormInput.wasteDetails
    );
    expect(data.updateForm.intermediaries).toEqual([
      {
        name: intermediary.company.name,
        siret: intermediary.company.siret
      }
    ]);
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

  it("should update a form with a PIPELINE packaging, erasing transporter infos and forcing transporter mode OTHER", async () => {
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
      transporter: {
        mode: "ROAD",
        company: {
          siret: siretify(1)
        }
      },
      wasteDetails: {
        name: "things",
        packagingInfos: [{ type: "PIPELINE", quantity: 1 }]
      }
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });
    expect(data.updateForm.wasteDetails).toMatchObject(
      updateFormInput.wasteDetails
    );
    expect(data.updateForm.transporter).toMatchObject({
      mode: "OTHER",
      company: null
    });
  });

  it("should error updating form with a PIPELINE packaging, and any other packaging", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        wasteDetailsPackagingInfos: [{ type: "PIPELINE", quantity: 1 }]
      }
    });

    const updateFormInput = {
      id: form.id,
      transporter: {
        mode: "ROAD",
        company: {
          siret: siretify(1)
        }
      },
      wasteDetails: {
        name: "things",
        packagingInfos: [
          { type: "CITERNE", quantity: 1 },
          { type: "PIPELINE", quantity: 1 }
        ]
      }
    };
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });
    expect(errors).toMatchObject([
      {
        extensions: { code: "BAD_USER_INPUT" },
        message:
          "wasteDetailsPackagingInfos ne peut pas à la fois contenir 1 citerne, 1 pipeline ou 1 benne et un autre conditionnement."
      }
    ]);
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

    expect(data.updateForm.temporaryStorageDetail!.destination).toMatchObject(
      updateFormInput.temporaryStorageDetail.destination
    );
  });

  it("should add a temporary storage even if temporaryStorageDetail is empty ", async () => {
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
      }
    };
    const { mutate } = makeClient(user);
    await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: {
        updateFormInput
      }
    });

    const tempStorage = await prisma.form
      .findUniqueOrThrow({
        where: { id: form.id }
      })
      .forwardedIn();

    expect(tempStorage?.readableId).toBe(`${form.readableId}-suite`);
  });

  it("should update the temporary storage", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        recipientIsTempStorage: true,
        forwardedIn: {
          create: {
            readableId: getReadableId(),
            ownerId: user.id,
            recipientCap: "OLD CAP"
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

    expect(data.updateForm.temporaryStorageDetail!.destination).toMatchObject(
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
        forwardedIn: {
          create: {
            readableId: getReadableId(),
            ownerId: user.id,
            recipientCap: "CAP"
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

    expect(data.updateForm.recipient!.company).toMatchObject(
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

    expect(data.updateForm.recipient!.company).toMatchObject(
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
        recipientCompanySiret: ttr.siret,
        quantityReceived: 1
      }
    });
    const toBeAppendixForm = await formFactory({
      ownerId: user.id,
      opt: {
        status: "AWAITING_GROUP",
        recipientCompanySiret: ttr.siret,
        quantityReceived: 1
      }
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        emitterType: EmitterType.APPENDIX2,
        status: "SEALED",
        emitterCompanySiret: ttr.siret,
        grouping: {
          create: {
            initialFormId: appendixForm.id,
            quantity: appendixForm.quantityReceived!
          }
        }
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
    const oldAppendix2Form = await prisma.form.findUniqueOrThrow({
      where: { id: appendixForm.id }
    });
    expect(oldAppendix2Form.status).toBe("AWAITING_GROUP");

    // New appendix form is now GROUPED
    const newAppendix2Form = await prisma.form.findUniqueOrThrow({
      where: { id: toBeAppendixForm.id }
    });
    expect(newAppendix2Form.status).toBe("GROUPED");
  });

  it("should be possible to update data on a form containing appendix 2", async () => {
    const { user, company: ttr } = await userWithCompanyFactory("MEMBER");

    const appendixForm = await formFactory({
      ownerId: user.id,
      opt: {
        status: "GROUPED",
        recipientCompanySiret: ttr.siret,
        quantityReceived: 1
      }
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SEALED",
        emitterCompanySiret: ttr.siret,
        emitterType: EmitterType.APPENDIX2,
        grouping: {
          create: {
            initialFormId: appendixForm.id,
            quantity: appendixForm.quantityReceived!
          }
        }
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: {
        updateFormInput: {
          id: form.id,
          wasteDetails: {
            code: "01 03 04*"
          }
        }
      }
    });
    expect(data.updateForm.wasteDetails!.code).toEqual("01 03 04*");
  });
  it("should be impossible to update emitter siret on a form containing appendix 2", async () => {
    const { user: transporterUser, company: transporter } =
      await userWithCompanyFactory("MEMBER");
    const { user: ttrUser, company: ttr } = await userWithCompanyFactory(
      "MEMBER"
    );
    const { company: otherEmitter } = await userWithCompanyFactory("MEMBER");

    const appendixForm = await formFactory({
      ownerId: ttrUser.id,
      opt: {
        status: "GROUPED",
        recipientCompanySiret: ttr.siret,
        quantityReceived: 1
      }
    });

    const form = await formFactory({
      ownerId: ttrUser.id,
      opt: {
        status: "SEALED",
        emitterCompanySiret: ttr.siret,
        emitterType: EmitterType.APPENDIX2,
        grouping: {
          create: {
            initialFormId: appendixForm.id,
            quantity: appendixForm.quantityReceived!
          }
        },
        transporters: {
          create: {
            transporterCompanySiret: transporter.siret,
            number: 1
          }
        }
      }
    });

    const { mutate } = makeClient(transporterUser);
    const { errors } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: {
        updateFormInput: {
          id: form.id,
          emitter: {
            company: { siret: otherEmitter.siret }
          }
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des bordereaux figurent dans l'annexe, le siret de l'émetteur ne peut pas être modifié.",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });
  it(
    "should disallow linking an appendix 2 form if the emitter of the regroupement" +
      " form is not the recipient of the initial form (using UpdateFormInput.appendix2Forms)",
    async () => {
      const { user, company: ttr } = await userWithCompanyFactory("MEMBER");
      const initialAppendix2 = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.AWAITING_GROUP,
          recipientCompanySiret: ttr.siret,
          quantityReceived: 1
        }
      });

      const form = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.SEALED,
          emitterCompanySiret: ttr.siret,
          emitterType: EmitterType.APPENDIX2,
          grouping: {
            create: {
              initialFormId: initialAppendix2.id,
              quantity: initialAppendix2.quantityReceived!
            }
          }
        }
      });

      const wannaBeAppendix2 = await formFactory({
        ownerId: (await userFactory()).id,
        opt: { status: Status.AWAITING_GROUP, quantityReceived: 1 }
      });

      const updateFormInput = {
        id: form.id,
        appendix2Forms: [{ id: wannaBeAppendix2.id }]
      };
      const { mutate } = makeClient(user);
      const { errors } = await mutate<Pick<Mutation, "createForm">>(
        UPDATE_FORM,
        {
          variables: { updateFormInput }
        }
      );
      expect(errors).toEqual([
        expect.objectContaining({
          message: `Le bordereau ${wannaBeAppendix2.id} n'est pas en possession du nouvel émetteur`
        })
      ]);
    }
  );

  it(
    "should disallow linking an appendix 2 form if the emitter of the regroupement" +
      " form is not the recipient of the initial form (using UpdateFormInput.grouping)",
    async () => {
      const { user, company: ttr } = await userWithCompanyFactory("MEMBER");
      const initialAppendix2 = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.AWAITING_GROUP,
          recipientCompanySiret: ttr.siret,
          quantityReceived: 1
        }
      });

      const form = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.SEALED,
          emitterCompanySiret: ttr.siret,
          emitterType: EmitterType.APPENDIX2,
          grouping: {
            create: {
              initialFormId: initialAppendix2.id,
              quantity: initialAppendix2.quantityReceived!
            }
          }
        }
      });

      const wannaBeAppendix2 = await formFactory({
        ownerId: (await userFactory()).id,
        opt: { status: Status.AWAITING_GROUP, quantityReceived: 1 }
      });

      const updateFormInput: UpdateFormInput = {
        id: form.id,
        grouping: [
          {
            form: { id: wannaBeAppendix2.id },
            quantity: wannaBeAppendix2.quantityReceived
          }
        ]
      };
      const { mutate } = makeClient(user);
      const { errors } = await mutate<Pick<Mutation, "createForm">>(
        UPDATE_FORM,
        {
          variables: { updateFormInput }
        }
      );
      expect(errors).toEqual([
        expect.objectContaining({
          message: `Le bordereau ${wannaBeAppendix2.id} n'est pas en possession du nouvel émetteur`
        })
      ]);
    }
  );

  it("should not be possible to change emitter.type when existing appendix2Forms is not empty", async () => {
    const { user, company: ttr } = await userWithCompanyFactory("MEMBER");

    const appendixForm = await formFactory({
      ownerId: user.id,
      opt: {
        status: "GROUPED",
        recipientCompanySiret: ttr.siret,
        quantityReceived: 1
      }
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: ttr.siret,
        emitterType: EmitterType.APPENDIX2,
        grouping: {
          create: {
            initialFormId: appendixForm.id,
            quantity: appendixForm.quantityReceived!
          }
        }
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "updateForm">,
      MutationUpdateFormArgs
    >(UPDATE_FORM, {
      variables: {
        updateFormInput: {
          id: form.id,
          emitter: { type: EmitterType.PRODUCER }
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "emitter.type doit être égal à APPENDIX2 ou APPENDIX1 lorsque `appendix2Forms` ou `grouping` n'est pas vide"
      })
    ]);
  });

  it(
    "should not be possible to add appendix2Forms to an existing form" +
      " which emitter.type is not APPENDIX2 (using UpdateFormInput.appendix2Forms)",
    async () => {
      const { user, company: producer } = await userWithCompanyFactory(
        "MEMBER"
      );

      const appendixForm = await formFactory({
        ownerId: user.id,
        opt: {
          status: "AWAITING_GROUP",
          recipientCompanySiret: producer.siret
        }
      });

      const form = await formFactory({
        ownerId: user.id,
        opt: {
          status: "DRAFT",
          emitterCompanySiret: producer.siret,
          emitterType: EmitterType.PRODUCER
        }
      });

      const { mutate } = makeClient(user);
      const { errors } = await mutate<
        Pick<Mutation, "updateForm">,
        MutationUpdateFormArgs
      >(UPDATE_FORM, {
        variables: {
          updateFormInput: {
            id: form.id,
            appendix2Forms: [{ id: appendixForm.id }]
          }
        }
      });
      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "emitter.type doit être égal à APPENDIX2 ou APPENDIX1 lorsque `appendix2Forms` ou `grouping` n'est pas vide"
        })
      ]);
    }
  );

  it(
    "should not be possible to add appendix2Forms to an existing form" +
      " which emitter.type is not APPENDIX2 (using UpdateFormInput.grouping)",
    async () => {
      const { user, company: producer } = await userWithCompanyFactory(
        "MEMBER"
      );

      const appendixForm = await formFactory({
        ownerId: user.id,
        opt: {
          status: "AWAITING_GROUP",
          recipientCompanySiret: producer.siret,
          quantityReceived: 1
        }
      });

      const form = await formFactory({
        ownerId: user.id,
        opt: {
          status: "DRAFT",
          emitterCompanySiret: producer.siret,
          emitterType: EmitterType.PRODUCER
        }
      });

      const { mutate } = makeClient(user);
      const { errors } = await mutate<
        Pick<Mutation, "updateForm">,
        MutationUpdateFormArgs
      >(UPDATE_FORM, {
        variables: {
          updateFormInput: {
            id: form.id,
            grouping: [
              {
                form: { id: appendixForm.id },
                quantity: appendixForm.quantityReceived
              }
            ]
          }
        }
      });
      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "emitter.type doit être égal à APPENDIX2 ou APPENDIX1 lorsque `appendix2Forms` ou `grouping` n'est pas vide"
        })
      ]);
    }
  );

  it("should be possible to change both emitter.type and set appendix2Forms to []", async () => {
    const { user, company: ttr } = await userWithCompanyFactory("MEMBER");

    const appendixForm = await formFactory({
      ownerId: user.id,
      opt: {
        status: "GROUPED",
        recipientCompanySiret: ttr.siret,
        quantityReceived: 1
      }
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: ttr.siret,
        emitterType: EmitterType.APPENDIX2,
        grouping: {
          create: {
            initialFormId: appendixForm.id,
            quantity: appendixForm.quantityReceived!
          }
        }
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "updateForm">,
      MutationUpdateFormArgs
    >(UPDATE_FORM, {
      variables: {
        updateFormInput: {
          id: form.id,
          emitter: { type: EmitterType.PRODUCER },
          appendix2Forms: []
        }
      }
    });
    expect(data.updateForm.grouping).toEqual([]);
    expect(data.updateForm.appendix2Forms).toEqual(null);
  });

  it("should be possible to change both emitter.type and set grouping to []", async () => {
    const { user, company: ttr } = await userWithCompanyFactory("MEMBER");

    const appendixForm = await formFactory({
      ownerId: user.id,
      opt: {
        status: "GROUPED",
        recipientCompanySiret: ttr.siret,
        quantityReceived: 1
      }
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: ttr.siret,
        emitterType: EmitterType.APPENDIX2,
        grouping: {
          create: {
            initialFormId: appendixForm.id,
            quantity: appendixForm.quantityReceived!
          }
        }
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "updateForm">,
      MutationUpdateFormArgs
    >(UPDATE_FORM, {
      variables: {
        updateFormInput: {
          id: form.id,
          emitter: { type: EmitterType.PRODUCER },
          grouping: []
        }
      }
    });
    expect(data.updateForm.grouping).toEqual([]);
    expect(data.updateForm.appendix2Forms).toEqual(null);
  });

  it("should be possible to re-associate same appendix2 (using UpdateFormInput.appendix2Forms)", async () => {
    const { user, company: ttr } = await userWithCompanyFactory("MEMBER");

    const appendixForm = await formFactory({
      ownerId: user.id,
      opt: {
        status: "AWAITING_GROUP",
        recipientCompanySiret: ttr.siret,
        quantityReceived: 1
      }
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SEALED",
        emitterCompanySiret: ttr.siret,
        emitterType: EmitterType.APPENDIX2
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "updateForm">,
      MutationUpdateFormArgs
    >(UPDATE_FORM, {
      variables: {
        updateFormInput: {
          id: form.id,
          appendix2Forms: [{ id: appendixForm.id }]
        }
      }
    });

    expect(data.updateForm.appendix2Forms).toHaveLength(1);

    const { data: data2 } = await mutate<
      Pick<Mutation, "updateForm">,
      MutationUpdateFormArgs
    >(UPDATE_FORM, {
      variables: {
        updateFormInput: {
          id: form.id,
          appendix2Forms: [{ id: appendixForm.id }]
        }
      }
    });

    expect(data2.updateForm.appendix2Forms).toHaveLength(1);
  });

  it("should be possible to re-associate same appendix2 (using UpdateFormInput.grouping)", async () => {
    const { user, company: ttr } = await userWithCompanyFactory("MEMBER");

    const appendixForm = await formFactory({
      ownerId: user.id,
      opt: {
        status: "AWAITING_GROUP",
        recipientCompanySiret: ttr.siret,
        quantityReceived: 1
      }
    });

    const groupingForm1 = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SEALED",
        emitterCompanySiret: ttr.siret,
        emitterType: EmitterType.APPENDIX2
      }
    });

    const groupingForm2 = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SEALED",
        emitterCompanySiret: ttr.siret,
        emitterType: EmitterType.APPENDIX2
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "updateForm">,
      MutationUpdateFormArgs
    >(UPDATE_FORM, {
      variables: {
        updateFormInput: {
          id: groupingForm1.id,
          grouping: [
            {
              form: { id: appendixForm.id },
              quantity: 0.8
            }
          ]
        }
      }
    });
    expect(data.updateForm.grouping).toHaveLength(1);

    const { data: data2 } = await mutate<
      Pick<Mutation, "updateForm">,
      MutationUpdateFormArgs
    >(UPDATE_FORM, {
      variables: {
        updateFormInput: {
          id: groupingForm2.id,
          grouping: [
            {
              form: { id: appendixForm.id },
              quantity: 0.2
            }
          ]
        }
      }
    });

    expect(data2.updateForm.grouping).toHaveLength(1);

    const { data: data3 } = await mutate<
      Pick<Mutation, "updateForm">,
      MutationUpdateFormArgs
    >(UPDATE_FORM, {
      variables: {
        updateFormInput: {
          id: groupingForm2.id,
          grouping: [
            {
              form: { id: appendixForm.id },
              quantity: 0.2
            }
          ]
        }
      }
    });
    expect(data3.updateForm.grouping).toHaveLength(1);
  }, 30000);

  it("should default to quantity left when no quantity is specified in grouping", async () => {
    const { user, company: ttr } = await userWithCompanyFactory("MEMBER");

    const appendix2Form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "AWAITING_GROUP",
        recipientCompanySiret: ttr.siret,
        quantityReceived: 1
      }
    });

    await formFactory({
      ownerId: user.id,
      opt: {
        status: Status.SEALED,
        recipientCompanySiret: ttr.siret,
        grouping: {
          create: {
            quantity: 0.2,
            initialFormId: appendix2Form.id
          }
        }
      }
    });

    const groupingForm = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SEALED",
        emitterCompanySiret: ttr.siret,
        emitterType: EmitterType.APPENDIX2
      }
    });

    const { mutate } = makeClient(user);
    const updateFormInput: UpdateFormInput = {
      id: groupingForm.id,
      grouping: [{ form: { id: appendix2Form.id } }]
    };

    const { data } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });

    expect(data.updateForm.grouping).toEqual([
      expect.objectContaining({ form: { id: appendix2Form.id }, quantity: 0.8 })
    ]);
  });

  it("should not be possible to set isDangerous=false with a waste code containing an *", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        wasteDetailsCode: "20 01 27*",
        wasteDetailsIsDangerous: true
      }
    });

    const { mutate } = makeClient(user);
    const updateFormInput: UpdateFormInput = {
      id: form.id,
      // try to set isDangerous to false
      wasteDetails: {
        isDangerous: false
      }
    };
    const { errors } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });

    expect(errors).toMatchObject([
      expect.objectContaining({
        extensions: { code: ErrorCode.BAD_USER_INPUT },
        message:
          "Un déchet avec un code comportant un astérisque est forcément dangereux"
      })
    ]);
  });

  it("should be possible to set isDangerous=true with a waste code without *", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        wasteDetailsCode: "20 03 01",
        wasteDetailsIsDangerous: false
      }
    });

    const { mutate } = makeClient(user);
    const updateFormInput: UpdateFormInput = {
      id: form.id,
      wasteDetails: {
        isDangerous: true
      }
    };
    const { data } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });
    expect(data.updateForm.wasteDetails!.isDangerous).toBe(true);
  });

  it("should perform update in transaction", async () => {
    const { user, company: ttr } = await userWithCompanyFactory("MEMBER");

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SEALED",
        emitterCompanySiret: ttr.siret,
        emitterType: EmitterType.APPENDIX2,
        wasteDetailsCode: "01 03 04*"
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "updateForm">,
      MutationUpdateFormArgs
    >(UPDATE_FORM, {
      variables: {
        updateFormInput: {
          id: form.id,
          wasteDetails: {
            code: "01 03 05*"
          },
          // throw an exception in appendix 2 association
          appendix2Forms: [{ id: "does-not-exist" }]
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Les BSDD initiaux does-not-exist n'existent pas ou ne sont pas en attente de regroupement`
      })
    ]);

    const updatedForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });

    // check form has not been updated
    expect(updatedForm.wasteDetailsCode).toEqual("01 03 04*");
  });

  it("should update denormalized fields", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const transporterCompany = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });
    await transporterReceiptFactory({ company: transporterCompany });

    const intermediaryCompany = await companyFactory();
    const { mutate } = makeClient(user);

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SEALED",
        emitterCompanySiret: company.siret,
        emitterType: EmitterType.APPENDIX2,
        wasteDetailsCode: "01 03 04*"
      }
    });

    const { data } = await mutate<
      Pick<Mutation, "updateForm">,
      MutationUpdateFormArgs
    >(UPDATE_FORM, {
      variables: {
        updateFormInput: {
          id: form.id,
          transporter: { company: { siret: transporterCompany.siret } },
          recipient: { company: { siret: company.siret } },
          intermediaries: [toIntermediaryCompany(intermediaryCompany)]
        }
      }
    });

    const updatedForm = await prisma.form.findUniqueOrThrow({
      where: { id: data.updateForm.id }
    });

    expect(updatedForm.recipientsSirets).toContain(company.siret);
    expect(updatedForm.transportersSirets).toContain(transporterCompany.siret);
    expect(updatedForm.intermediariesSirets).toContain(
      intermediaryCompany.siret
    );
  });

  it("should not be possible to update a weight > 40 T when transport mode is ROAD", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { mutate } = makeClient(user);
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SEALED",
        emitterCompanySiret: company.siret,
        emitterType: EmitterType.APPENDIX2,
        wasteDetailsCode: "01 03 04*",
        transporters: {
          create: {
            transporterTransportMode: "ROAD",
            number: 1
          }
        }
      }
    });
    const { errors } = await mutate<
      Pick<Mutation, "updateForm">,
      MutationUpdateFormArgs
    >(UPDATE_FORM, {
      variables: {
        updateFormInput: {
          id: form.id,
          wasteDetails: { quantity: 50 }
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Déchet : le poids doit être inférieur à 40 tonnes lorsque le transport se fait par la route"
      })
    ]);
  });

  it("should clean appendix1 items on update", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: producerCompany } = await userWithCompanyFactory("MEMBER");
    const { mutate } = makeClient(user);

    const appendix1_1 = await prisma.form.create({
      data: {
        readableId: getReadableId(),
        status: Status.DRAFT,
        emitterType: EmitterType.APPENDIX1_PRODUCER,
        emitterCompanySiret: producerCompany.siret,
        emitterCompanyName: "ProducerCompany",
        emitterCompanyAddress: "rue de l'annexe",
        emitterCompanyContact: "Contact",
        emitterCompanyPhone: "01 01 01 01 01",
        emitterCompanyMail: "annexe1@test.com",
        wasteDetailsCode: "16 06 01*",
        owner: { connect: { id: user.id } }
      }
    });
    const appendix1_2 = await prisma.form.create({
      data: {
        readableId: getReadableId(),
        status: Status.DRAFT,
        emitterType: EmitterType.APPENDIX1_PRODUCER,
        emitterCompanySiret: producerCompany.siret,
        emitterCompanyName: "ProducerCompany",
        emitterCompanyAddress: "rue de l'annexe",
        emitterCompanyContact: "Contact",
        emitterCompanyPhone: "01 01 01 01 01",
        emitterCompanyMail: "annexe1@test.com",
        wasteDetailsCode: "16 06 01*",
        owner: { connect: { id: user.id } }
      }
    });

    // Group with appendix1_1
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: Status.SEALED,
        wasteDetailsCode: "16 06 01*",
        emitterCompanySiret: company.siret,
        emitterType: EmitterType.APPENDIX1,
        grouping: { create: { initialFormId: appendix1_1.id, quantity: 0 } }
      }
    });

    // Update and group with appendix1_2
    const { data } = await mutate<
      Pick<Mutation, "updateForm">,
      MutationUpdateFormArgs
    >(UPDATE_FORM, {
      variables: {
        updateFormInput: {
          id: form.id,
          grouping: [{ form: { id: appendix1_2.id } }]
        }
      }
    });

    expect(data.updateForm.grouping!.length).toBe(1);

    const updatedAppendix1_1 = await prisma.form.findUniqueOrThrow({
      where: { id: appendix1_1.id },
      include: { groupedIn: true }
    });
    expect(updatedAppendix1_1.groupedIn).toEqual([]);
  });

  it(
    "should be possible to update a form where transport is ROAD and wasteDetailsQuantity is > 40T " +
      "if it was created before (<=) process.env.MAX_WEIGHT_BY_ROAD_VALIDATE_AFTER",
    async () => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const { mutate } = makeClient(user);
      const form = await formFactory({
        ownerId: user.id,
        opt: {
          createdAt: new Date(0), // same as default value for MAX_WEIGHT_BY_ROAD_VALIDATE_AFTER
          status: "SEALED",
          emitterCompanySiret: company.siret,
          emitterType: EmitterType.APPENDIX2,
          wasteDetailsCode: "01 03 04*",
          wasteDetailsQuantity: 50,
          transporters: {
            create: {
              transporterTransportMode: "ROAD",
              number: 1
            }
          }
        }
      });
      const { errors } = await mutate<
        Pick<Mutation, "updateForm">,
        MutationUpdateFormArgs
      >(UPDATE_FORM, {
        variables: {
          updateFormInput: {
            id: form.id,
            wasteDetails: { consistence: "SOLID" }
          }
        }
      });

      expect(errors).toBeUndefined();
    }
  );

  it("should not allow updating appendix1 if one of them has been signed by the transporter for more than 3 days", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: producerCompany } = await userWithCompanyFactory("MEMBER");
    const { mutate } = makeClient(user);

    const threeDaysAgo = sub(new Date(), { days: 3 });
    const appendix1_1 = await prisma.form.create({
      data: {
        readableId: getReadableId(),
        status: Status.SENT,
        emitterType: EmitterType.APPENDIX1_PRODUCER,
        emitterCompanySiret: producerCompany.siret,
        emitterCompanyName: "ProducerCompany",
        emitterCompanyAddress: "rue de l'annexe",
        emitterCompanyContact: "Contact",
        emitterCompanyPhone: "01 01 01 01 01",
        emitterCompanyMail: "annexe1@test.com",
        wasteDetailsCode: "16 06 01*",
        owner: { connect: { id: user.id } },
        takenOverAt: threeDaysAgo
      }
    });

    // Group with appendix1_1
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: Status.SENT,
        wasteDetailsCode: "16 06 01*",
        emitterCompanySiret: company.siret,
        emitterType: EmitterType.APPENDIX1,
        grouping: { create: { initialFormId: appendix1_1.id, quantity: 0 } }
      }
    });

    const appendix1_2 = await prisma.form.create({
      data: {
        readableId: getReadableId(),
        status: Status.DRAFT,
        emitterType: EmitterType.APPENDIX1_PRODUCER,
        emitterCompanySiret: producerCompany.siret,
        emitterCompanyName: "ProducerCompany",
        emitterCompanyAddress: "rue de l'annexe",
        emitterCompanyContact: "Contact",
        emitterCompanyPhone: "01 01 01 01 01",
        emitterCompanyMail: "annexe1@test.com",
        wasteDetailsCode: "16 06 01*",
        owner: { connect: { id: user.id } }
      }
    });

    // Add appendix1_2
    const { errors } = await mutate<
      Pick<Mutation, "updateForm">,
      MutationUpdateFormArgs
    >(UPDATE_FORM, {
      variables: {
        updateFormInput: {
          id: form.id,
          grouping: [
            { form: { id: appendix1_1.id } },
            { form: { id: appendix1_2.id } }
          ]
        }
      }
    });

    expect(errors.length).toBe(1);
    expect(errors[0].message).toContain(
      "Impossible d'ajouter une annexe 1. Un bordereau de tournée ne peut être utilisé que durant 3 jours consécutifs à partir du moment où la première collecte"
    );
  });

  it.each([Status.DRAFT, Status.SEALED, Status.SIGNED_BY_PRODUCER])(
    "should be possible to update transporter when status is %p",
    async status => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const transporter = await companyFactory({
        companyTypes: ["TRANSPORTER"]
      });
      const form = await formFactory({
        ownerId: user.id,
        opt: {
          status,
          recipientCompanySiret: company.siret
        }
      });

      const { mutate } = makeClient(user);
      const updateFormInput: FormInput = {
        id: form.id,
        transporter: { company: { siret: transporter.siret } }
      };
      const { data, errors } = await mutate<Pick<Mutation, "updateForm">>(
        UPDATE_FORM,
        {
          variables: { updateFormInput }
        }
      );

      expect(errors).toBeUndefined();
      expect(data.updateForm.transporter?.company?.siret).toEqual(
        transporter.siret
      );
    }
  );

  it("should empty the transporter and receipt infos", async () => {
    const TODAY = new Date();
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter = await userWithCompanyFactory("MEMBER", {
      transporterReceiptNumber: "TRANSPORTER-RECEIPT-NUMBER",
      transporterReceiptValidityLimit: TODAY.toISOString() as any,
      transporterReceiptDepartment: "TRANSPORTER- RECEIPT-DEPARTMENT"
    });
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: Status.DRAFT,
        emitterCompanySiret: emitter.company.siret,
        emitterCompanyName: emitter.company.name,
        emitterCompanyAddress: emitter.company.address,
        emitterCompanyContact: emitter.company.contact,
        emitterCompanyPhone: emitter.company.contactPhone,
        emitterCompanyMail: emitter.company.contactEmail,
        transporters: {
          create: {
            transporterCompanySiret: transporter.company.siret,
            transporterCompanyName: transporter.company.name,
            transporterCompanyAddress: transporter.company.address,
            transporterCompanyContact: transporter.company.contact,
            transporterCompanyPhone: transporter.company.contactPhone,
            transporterCompanyMail: transporter.company.contactEmail,
            transporterReceipt: transporter.company.transporterReceiptNumber,
            transporterDepartment:
              transporter.company.transporterReceiptDepartment,
            transporterValidityLimit:
              transporter.company.transporterReceiptValidityLimit,
            number: 1
          }
        }
      }
    });
    const { mutate } = makeClient(emitter.user);
    const updateFormInput: FormInput = {
      id: form.id,
      transporter: null
    };
    const { data, errors } = await mutate<Pick<Mutation, "updateForm">>(
      UPDATE_FORM,
      {
        variables: { updateFormInput }
      }
    );

    expect(errors).toBeUndefined();
    expect(data.updateForm.transporter?.receipt).toBeUndefined();
    expect(data.updateForm.transporter?.department).toBeUndefined();
    expect(data.updateForm.transporter?.validityLimit).toBeUndefined();
    expect(data.updateForm.transporter?.company?.siret).toBeUndefined();
  });
});
