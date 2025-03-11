import {
  EmitterType,
  Status,
  UserRole,
  CompanyType,
  WasteProcessorType
} from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { ErrorCode } from "../../../../common/errors";
import {
  bsddTransporterFactory,
  companyFactory,
  formFactory,
  formWithTempStorageFactory,
  siretify,
  toIntermediaryCompany,
  userFactory,
  userWithCompanyFactory,
  transporterReceiptFactory,
  ecoOrganismeFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import type {
  FormInput,
  Mutation,
  MutationUpdateFormArgs,
  UpdateFormInput
} from "@td/codegen-back";
import getReadableId from "../../../readableId";
import { sirenifyFormInput } from "../../../sirenify";
import { sub } from "date-fns";
import { getFirstTransporter, getTransportersSync } from "../../../database";
import { getStream } from "../../../../activity-events";
import { updateAppendix2Queue } from "../../../../queue/producers/updateAppendix2";
import { waitForJobsCompletion } from "../../../../queue/helpers";
import {
  forbbidenProfilesForDangerousWaste,
  forbbidenProfilesForNonDangerousWaste
} from "./companyProfiles";

jest.mock("../../../sirenify");
(sirenifyFormInput as jest.Mock).mockImplementation(input =>
  Promise.resolve(input)
);

const UPDATE_FORM = `
  mutation UpdateForm($updateFormInput: UpdateFormInput!) {
    updateForm(updateFormInput: $updateFormInput) {
      id
      isDirectSupply
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
    (sirenifyFormInput as jest.Mock).mockClear();
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
        emittedAt: new Date(),
        takenOverAt: new Date(),
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
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : wasteDetailsCode",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should not be possible for the TTR to update final destination when emitter has signed", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const ttr = await userWithCompanyFactory("ADMIN");
    const destination = await companyFactory();

    const form = await formWithTempStorageFactory({
      ownerId: emitter.user.id,
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterCompanySiret: emitter.company.siret,
        recipientCompanySiret: ttr.company.siret,
        emittedAt: new Date()
      },
      forwardedInOpts: {
        recipientCompanySiret: destination.siret
      }
    });
    const { mutate } = makeClient(ttr.user);

    const newDestination = await companyFactory();
    const updateFormInput: UpdateFormInput = {
      id: form.id,
      temporaryStorageDetail: {
        destination: { company: { siret: newDestination.siret } }
      }
    };
    const { errors } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : forwardedIn"
      })
    ]);
  });

  it("should be possible for the TTR to resend the same data on the temporaryStorateDetail input", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const ttr = await userWithCompanyFactory("ADMIN", {
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    const destination = await companyFactory();

    const form = await formWithTempStorageFactory({
      ownerId: emitter.user.id,
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterCompanySiret: emitter.company.siret,
        recipientCompanySiret: ttr.company.siret,
        emittedAt: new Date()
      },
      forwardedInOpts: {
        recipientCompanySiret: destination.siret
      }
    });
    const { mutate } = makeClient(ttr.user);

    const updateFormInput: UpdateFormInput = {
      id: form.id,
      temporaryStorageDetail: {
        destination: { company: { siret: destination.siret } }
      }
    };
    const { errors } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });

    expect(errors).toBeUndefined();
  });

  it("should not be possible to update intermediaries when emitter has signed", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const destination = await userWithCompanyFactory("ADMIN", {
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    const intermediary1 = await companyFactory();
    const intermediary2 = await companyFactory();
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterCompanySiret: emitter.company.siret,
        recipientCompanySiret: destination.company.siret,
        emittedAt: new Date(),
        intermediaries: { create: toIntermediaryCompany(intermediary1) }
      }
    });
    const { mutate } = makeClient(destination.user);

    // Try changing the list of intermediaries
    const { errors: errors1 } = await mutate<
      Pick<Mutation, "updateForm">,
      MutationUpdateFormArgs
    >(UPDATE_FORM, {
      variables: {
        updateFormInput: {
          id: form.id,
          intermediaries: [toIntermediaryCompany(intermediary2)]
        }
      }
    });

    expect(errors1).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : intermediaries"
      })
    ]);

    // Try changing one field on the same intermediary
    const { errors: errors2 } = await mutate<
      Pick<Mutation, "updateForm">,
      MutationUpdateFormArgs
    >(UPDATE_FORM, {
      variables: {
        updateFormInput: {
          id: form.id,
          intermediaries: [
            { ...toIntermediaryCompany(intermediary2), name: "new name" }
          ]
        }
      }
    });

    expect(errors2).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : intermediaries"
      })
    ]);
  });

  it("should be possible to resend same intermediaries data when emitter has signed", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const destination = await userWithCompanyFactory("ADMIN", {
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    const intermediary1 = await companyFactory();
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterCompanySiret: emitter.company.siret,
        recipientCompanySiret: destination.company.siret,
        emittedAt: new Date(),
        intermediaries: { create: toIntermediaryCompany(intermediary1) }
      }
    });
    const { mutate } = makeClient(destination.user);

    const { errors } = await mutate<
      Pick<Mutation, "updateForm">,
      MutationUpdateFormArgs
    >(UPDATE_FORM, {
      variables: {
        updateFormInput: {
          id: form.id,
          intermediaries: [toIntermediaryCompany(intermediary1)]
        }
      }
    });

    expect(errors).toBeUndefined();
  });

  it("should be possible to resend same Decimal value when emitter has signed", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const destination = await userWithCompanyFactory("ADMIN", {
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    const intermediary1 = await companyFactory();
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterCompanySiret: emitter.company.siret,
        recipientCompanySiret: destination.company.siret,
        emittedAt: new Date(),
        intermediaries: { create: toIntermediaryCompany(intermediary1) }
      }
    });
    const { mutate } = makeClient(destination.user);

    const { errors } = await mutate<
      Pick<Mutation, "updateForm">,
      MutationUpdateFormArgs
    >(UPDATE_FORM, {
      variables: {
        updateFormInput: {
          id: form.id,
          wasteDetails: { quantity: form.wasteDetailsQuantity?.toNumber() }
        }
      }
    });

    expect(errors).toBeUndefined();
  });

  it.each(["emitter", "trader", "broker", "transporter"])(
    "should allow %p to update a draft form",
    async role => {
      const { user, company } = await userWithCompanyFactory("MEMBER");

      // recipient needs appropriate profiles and subprofiles
      const destination = await companyFactory({
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      });

      const form = await formFactory({
        ownerId: user.id,
        opt: {
          recipientCompanySiret: destination.siret,
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
      expect(sirenifyFormInput as jest.Mock).toHaveBeenCalledTimes(1);
    }
  );

  it("should allow recipient to update a draft form", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        recipientCompanySiret: company.siret
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
    expect(sirenifyFormInput as jest.Mock).toHaveBeenCalledTimes(1);
  });

  it.each(forbbidenProfilesForDangerousWaste)(
    "should forbid recipient without inappropriate profile %o on a draft bsdd with dangerous waste code",
    async opt => {
      const { user, company } = await userWithCompanyFactory("MEMBER", {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      });
      const form = await formFactory({
        ownerId: user.id,
        opt: {
          status: "DRAFT",
          emitterCompanySiret: company.siret
        }
      });

      const { mutate } = makeClient(user);
      const destination = await companyFactory(opt);
      const updateFormInput = {
        id: form.id,
        recipient: {
          company: { siret: destination.siret }
        }
      };
      const { errors } = await mutate<Pick<Mutation, "updateForm">>(
        UPDATE_FORM,
        {
          variables: { updateFormInput }
        }
      );
      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Le sous-profil sélectionné par l'établissement destinataire ne lui permet pas de prendre en charge ce type de déchet." +
            " Il lui appartient de mettre à jour son profil.",
          extensions: {
            code: "BAD_USER_INPUT"
          }
        })
      ]);
    }
  );

  it.each(forbbidenProfilesForDangerousWaste)(
    "should forbid recipient without inappropriate profile %o on a draft bsdd with non dangerous waste and isDangerous",
    async opt => {
      const { user, company } = await userWithCompanyFactory("MEMBER", {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      });
      const form = await formFactory({
        ownerId: user.id,
        opt: {
          status: "DRAFT",
          emitterCompanySiret: company.siret,
          wasteDetailsCode: "10 05 09",
          wasteDetailsIsDangerous: true
        }
      });

      const { mutate } = makeClient(user);
      const destination = await companyFactory(opt);
      const updateFormInput = {
        id: form.id,
        recipient: {
          company: { siret: destination.siret }
        }
      };
      const { errors } = await mutate<Pick<Mutation, "updateForm">>(
        UPDATE_FORM,
        {
          variables: { updateFormInput }
        }
      );
      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Le sous-profil sélectionné par l'établissement destinataire ne lui permet pas de prendre en charge ce type de déchet." +
            " Il lui appartient de mettre à jour son profil.",
          extensions: {
            code: "BAD_USER_INPUT"
          }
        })
      ]);
    }
  );

  it.each(forbbidenProfilesForDangerousWaste)(
    "should forbid recipient without inappropriate profile %o on a draft bsdd with non dangerous waste code and pop",
    async opt => {
      const { user, company } = await userWithCompanyFactory("MEMBER", {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      });
      const form = await formFactory({
        ownerId: user.id,
        opt: {
          status: "DRAFT",
          emitterCompanySiret: company.siret,
          wasteDetailsCode: "10 05 09",
          wasteDetailsPop: true
        }
      });

      const { mutate } = makeClient(user);
      const destination = await companyFactory(opt);
      const updateFormInput = {
        id: form.id,
        recipient: {
          company: { siret: destination.siret }
        }
      };
      const { errors } = await mutate<Pick<Mutation, "updateForm">>(
        UPDATE_FORM,
        {
          variables: { updateFormInput }
        }
      );
      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Le sous-profil sélectionné par l'établissement destinataire ne lui permet pas de prendre en charge ce type de déchet." +
            " Il lui appartient de mettre à jour son profil.",
          extensions: {
            code: "BAD_USER_INPUT"
          }
        })
      ]);
    }
  );

  it.each(forbbidenProfilesForNonDangerousWaste)(
    "should forbid recipient without inappropriate profile %o on a draft bsdd with non dangerous waste",
    async opt => {
      const { user, company } = await userWithCompanyFactory("MEMBER", {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      });
      const form = await formFactory({
        ownerId: user.id,
        opt: {
          status: "DRAFT",
          emitterCompanySiret: company.siret,
          wasteDetailsCode: "10 05 09",
          wasteDetailsIsDangerous: false,
          wasteDetailsPop: false
        }
      });

      const { mutate } = makeClient(user);
      const destination = await companyFactory(opt);
      const updateFormInput = {
        id: form.id,
        recipient: {
          company: { siret: destination.siret }
        }
      };
      const { errors } = await mutate<Pick<Mutation, "updateForm">>(
        UPDATE_FORM,
        {
          variables: { updateFormInput }
        }
      );
      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Le sous-profil sélectionné par l'établissement destinataire ne lui permet pas de prendre en charge ce type de déchet." +
            " Il lui appartient de mettre à jour son profil.",
          extensions: {
            code: "BAD_USER_INPUT"
          }
        })
      ]);
    }
  );

  it.each(forbbidenProfilesForDangerousWaste)(
    "should allow recipient with inappropriate profile %o on a draft bsdd with dangerous waste code on bsdd created before VERIFY_DESTINATION_PROFILES_FOR_BSDD_CREATED_AFTER",
    async opt => {
      const { user, company } = await userWithCompanyFactory("MEMBER", {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      });
      const form = await formFactory({
        ownerId: user.id,
        opt: {
          status: "DRAFT",
          emitterCompanySiret: company.siret,
          createdAt: new Date("2024-10-01T00:00:00.000Z") // created before VERIFY_DESTINATION_PROFILES_FOR_BSDD_CREATED_AFTER
        }
      });

      const { mutate } = makeClient(user);
      const destination = await companyFactory(opt);
      const updateFormInput = {
        id: form.id,
        recipient: {
          company: { siret: destination.siret }
        }
      };
      const { errors } = await mutate<Pick<Mutation, "updateForm">>(
        UPDATE_FORM,
        {
          variables: { updateFormInput }
        }
      );
      expect(errors).toBe(undefined);
    }
  );

  it.each(forbbidenProfilesForNonDangerousWaste)(
    "should allow recipient with inappropriate profile %o on a draft bsdd with non dangerous waste on bsdd created before VERIFY_DESTINATION_PROFILES_FOR_BSDD_CREATED_AFTER",
    async opt => {
      const { user, company } = await userWithCompanyFactory("MEMBER", {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      });
      const form = await formFactory({
        ownerId: user.id,
        opt: {
          status: "DRAFT",
          emitterCompanySiret: company.siret,
          wasteDetailsCode: "10 05 09",
          wasteDetailsIsDangerous: false,
          wasteDetailsPop: false,
          createdAt: new Date("2024-10-01T00:00:00.000Z") // created before VERIFY_DESTINATION_PROFILES_FOR_BSDD_CREATED_AFTER
        }
      });

      const { mutate } = makeClient(user);
      const destination = await companyFactory(opt);
      const updateFormInput = {
        id: form.id,
        recipient: {
          company: { siret: destination.siret }
        }
      };
      const { errors } = await mutate<Pick<Mutation, "updateForm">>(
        UPDATE_FORM,
        {
          variables: { updateFormInput }
        }
      );
      expect(errors).toBe(undefined);
    }
  );

  it("should forbid invalid transporter plates", async () => {
    const emitter = await companyFactory();

    const { user, company: transporterCompany } = await userWithCompanyFactory(
      "MEMBER",
      {
        companyTypes: ["TRANSPORTER"]
      }
    );

    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: emitter.siret,
        recipientCompanySiret: destination.siret,
        transporters: {
          create: {
            transporterCompanySiret: transporterCompany.siret,
            number: 1
          }
        }
      }
    });

    const { mutate } = makeClient(user);
    const updateFormInput = {
      id: form.id,
      transporter: {
        numberPlate: "XX" //too short
      }
    };
    const { errors } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Le numéro d'immatriculation doit faire entre 4 et 12 caractères"
      })
    ]);
  });

  it("should autocomplete transporter receipt with receipt pulled from db", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const transporterCompany = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });
    await transporterReceiptFactory({
      company: transporterCompany
    });

    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        recipientCompanySiret: destination.siret,
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

    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        recipientCompanySiret: destination.siret,
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

    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });

    // form receipt is filled
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        recipientCompanySiret: destination.siret,
        transporters: {
          create: {
            transporterCompanySiret: company.siret,
            number: 1,
            transporterReceipt: receipt.receiptNumber,
            transporterDepartment: receipt.department,
            transporterValidityLimit: receipt.validityLimit
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
    expect(data.updateForm.transporter!.receipt).toEqual(receipt.receiptNumber);
    expect(data.updateForm.transporter!.department).toEqual(receipt.department);
    expect(data.updateForm.transporter!.validityLimit).toEqual(
      receipt.validityLimit.toISOString()
    );
  });

  it("should autocomplete broker receipt with receipt pulled from db", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        brokerCompanySiret: siretify(),
        brokerReceipt: "BBBB",
        brokerDepartment: "13",
        brokerValidityLimit: new Date("2027-01-01")
      }
    });

    const recepisse = {
      receiptNumber: "AAAA",
      department: "07",
      validityLimit: new Date("2026-01-01")
    };

    const updatedBrokerCompany = await companyFactory({
      companyTypes: ["BROKER"],
      brokerReceipt: {
        create: recepisse
      }
    });

    const { mutate } = makeClient(user);
    const updateFormInput = {
      id: form.id,
      broker: {
        company: { siret: updatedBrokerCompany.siret }
      }
    };
    const { data } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });

    const updatedForm = await prisma.form.findUniqueOrThrow({
      where: { id: data.updateForm.id }
    });

    expect(updatedForm.brokerReceipt).toEqual(recepisse.receiptNumber);
    expect(updatedForm.brokerDepartment).toEqual(recepisse.department);
    expect(updatedForm.brokerValidityLimit).toEqual(recepisse.validityLimit);
  });

  it("should null broker receipt is they do not have receipt in db", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        brokerCompanySiret: siretify(),
        brokerReceipt: "BBBB",
        brokerDepartment: "13",
        brokerValidityLimit: new Date("2027-01-01")
      }
    });

    const updatedBrokerCompany = await companyFactory({
      companyTypes: ["BROKER"]
    });

    const { mutate } = makeClient(user);
    const updateFormInput = {
      id: form.id,
      broker: {
        company: { siret: updatedBrokerCompany.siret }
      }
    };
    const { data } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });

    const updatedForm = await prisma.form.findUniqueOrThrow({
      where: { id: data.updateForm.id }
    });

    expect(updatedForm.brokerReceipt).toEqual(null);
    expect(updatedForm.brokerDepartment).toEqual(null);
    expect(updatedForm.brokerValidityLimit).toBeNull();
  });

  it("should leave the broker receipt unchanged if broker is unchanged", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const recepisse = {
      receiptNumber: "AAAA",
      department: "07",
      validityLimit: new Date("2026-01-01")
    };

    const brokerCompany = await companyFactory({
      companyTypes: ["BROKER"],
      brokerReceipt: {
        create: recepisse
      }
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        brokerCompanySiret: brokerCompany.siret,
        brokerReceipt: recepisse.receiptNumber,
        brokerDepartment: recepisse.department,
        brokerValidityLimit: recepisse.validityLimit
      }
    });

    const { mutate } = makeClient(user);
    const updateFormInput = {
      id: form.id,
      broker: {
        company: { siret: brokerCompany.siret }
      }
    };
    const { data } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });

    const updatedForm = await prisma.form.findUniqueOrThrow({
      where: { id: data.updateForm.id }
    });

    expect(updatedForm.brokerReceipt).toEqual(recepisse.receiptNumber);
    expect(updatedForm.brokerDepartment).toEqual(recepisse.department);
    expect(updatedForm.brokerValidityLimit).toEqual(recepisse.validityLimit);
  });

  it("should autocomplete trader receipt with receipt pulled from db", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        traderCompanySiret: siretify(),
        traderReceipt: "BBBB",
        traderDepartment: "13",
        traderValidityLimit: new Date("2027-01-01")
      }
    });

    const recepisse = {
      receiptNumber: "AAAA",
      department: "07",
      validityLimit: new Date("2026-01-01")
    };

    const updatedTraderCompany = await companyFactory({
      companyTypes: ["TRADER"],
      traderReceipt: {
        create: recepisse
      }
    });

    const { mutate } = makeClient(user);
    const updateFormInput = {
      id: form.id,
      trader: {
        company: { siret: updatedTraderCompany.siret }
      }
    };
    const { data } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });

    const updatedForm = await prisma.form.findUniqueOrThrow({
      where: { id: data.updateForm.id }
    });

    expect(updatedForm.traderReceipt).toEqual(recepisse.receiptNumber);
    expect(updatedForm.traderDepartment).toEqual(recepisse.department);
    expect(updatedForm.traderValidityLimit).toEqual(recepisse.validityLimit);
  });

  it("should null trader receipt is they do not have receipt in db", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        traderCompanySiret: siretify(),
        traderReceipt: "BBBB",
        traderDepartment: "13",
        traderValidityLimit: new Date("2027-01-01")
      }
    });

    const updatedTraderCompany = await companyFactory({
      companyTypes: ["TRADER"]
    });

    const { mutate } = makeClient(user);
    const updateFormInput = {
      id: form.id,
      trader: {
        company: { siret: updatedTraderCompany.siret }
      }
    };
    const { data } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });

    const updatedForm = await prisma.form.findUniqueOrThrow({
      where: { id: data.updateForm.id }
    });

    expect(updatedForm.traderReceipt).toEqual(null);
    expect(updatedForm.traderDepartment).toEqual(null);
    expect(updatedForm.traderValidityLimit).toBeNull();
  });

  it("should leave the trader receipt unchanged if trader is unchanged", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const recepisse = {
      receiptNumber: "AAAA",
      department: "07",
      validityLimit: new Date("2026-01-01")
    };

    const traderCompany = await companyFactory({
      companyTypes: ["TRADER"],
      traderReceipt: {
        create: recepisse
      }
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        traderCompanySiret: traderCompany.siret,
        traderReceipt: recepisse.receiptNumber,
        traderDepartment: recepisse.department,
        traderValidityLimit: recepisse.validityLimit
      }
    });

    const { mutate } = makeClient(user);
    const updateFormInput = {
      id: form.id,
      trader: {
        company: { siret: traderCompany.siret }
      }
    };
    const { data } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });

    const updatedForm = await prisma.form.findUniqueOrThrow({
      where: { id: data.updateForm.id }
    });

    expect(updatedForm.traderReceipt).toEqual(recepisse.receiptNumber);
    expect(updatedForm.traderDepartment).toEqual(recepisse.department);
    expect(updatedForm.traderValidityLimit).toEqual(recepisse.validityLimit);
  });

  it.each(["emitter", "trader", "broker", "transporter"])(
    "should allow %p to update a sealed form",
    async role => {
      const { user, company } = await userWithCompanyFactory("MEMBER");

      // recipient needs appropriate profiles and subprofiles
      const destination = await companyFactory({
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      });

      const form = await formFactory({
        ownerId: user.id,
        opt: {
          recipientCompanySiret: destination.siret,

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

  it("should allow recipient to update a sealed form", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SEALED",

        recipientCompanySiret: company.siret
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
  });

  it.each(forbbidenProfilesForDangerousWaste)(
    "should forbid recipient without inappropriate profile %o on a sealed bsdd with dangerous waste code",
    async opt => {
      const { user, company } = await userWithCompanyFactory("MEMBER", {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      });
      const form = await formFactory({
        ownerId: user.id,
        opt: {
          status: "SEALED",
          emitterCompanySiret: company.siret
        }
      });

      const { mutate } = makeClient(user);
      const destination = await companyFactory(opt);
      const updateFormInput = {
        id: form.id,
        recipient: {
          company: { siret: destination.siret }
        }
      };
      const { errors } = await mutate<Pick<Mutation, "updateForm">>(
        UPDATE_FORM,
        {
          variables: { updateFormInput }
        }
      );
      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Le sous-profil sélectionné par l'établissement destinataire ne lui permet pas de prendre en charge ce type de déchet." +
            " Il lui appartient de mettre à jour son profil.",
          extensions: {
            code: "BAD_USER_INPUT"
          }
        })
      ]);
    }
  );

  it.each(forbbidenProfilesForDangerousWaste)(
    "should forbid recipient without inappropriate profile %o on a SEALED bsdd with non dangerous waste and isDangerous",
    async opt => {
      const { user, company } = await userWithCompanyFactory("MEMBER", {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      });
      const form = await formFactory({
        ownerId: user.id,
        opt: {
          status: "SEALED",
          emitterCompanySiret: company.siret,
          wasteDetailsCode: "10 05 09",
          wasteDetailsIsDangerous: true
        }
      });

      const { mutate } = makeClient(user);
      const destination = await companyFactory(opt);
      const updateFormInput = {
        id: form.id,
        recipient: {
          company: { siret: destination.siret }
        }
      };
      const { errors } = await mutate<Pick<Mutation, "updateForm">>(
        UPDATE_FORM,
        {
          variables: { updateFormInput }
        }
      );
      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Le sous-profil sélectionné par l'établissement destinataire ne lui permet pas de prendre en charge ce type de déchet." +
            " Il lui appartient de mettre à jour son profil.",
          extensions: {
            code: "BAD_USER_INPUT"
          }
        })
      ]);
    }
  );

  it.each(forbbidenProfilesForDangerousWaste)(
    "should forbid recipient without inappropriate profile %o on a sealed bsdd with non dangerous waste code and pop",
    async opt => {
      const { user, company } = await userWithCompanyFactory("MEMBER", {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      });
      const form = await formFactory({
        ownerId: user.id,
        opt: {
          status: "SEALED",
          emitterCompanySiret: company.siret,
          wasteDetailsCode: "10 05 09",
          wasteDetailsPop: true
        }
      });

      const { mutate } = makeClient(user);
      const destination = await companyFactory(opt);
      const updateFormInput = {
        id: form.id,
        recipient: {
          company: { siret: destination.siret }
        }
      };
      const { errors } = await mutate<Pick<Mutation, "updateForm">>(
        UPDATE_FORM,
        {
          variables: { updateFormInput }
        }
      );
      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Le sous-profil sélectionné par l'établissement destinataire ne lui permet pas de prendre en charge ce type de déchet." +
            " Il lui appartient de mettre à jour son profil.",
          extensions: {
            code: "BAD_USER_INPUT"
          }
        })
      ]);
    }
  );

  it.each(forbbidenProfilesForNonDangerousWaste)(
    "should forbid recipient without inappropriate profile %o on a sealed bsdd with non dangerous waste",
    async opt => {
      const { user, company } = await userWithCompanyFactory("MEMBER", {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      });
      const form = await formFactory({
        ownerId: user.id,
        opt: {
          status: "SEALED",
          emitterCompanySiret: company.siret,
          wasteDetailsCode: "10 05 09",
          wasteDetailsIsDangerous: false,
          wasteDetailsPop: false
        }
      });

      const { mutate } = makeClient(user);
      const destination = await companyFactory(opt);
      const updateFormInput = {
        id: form.id,
        recipient: {
          company: { siret: destination.siret }
        }
      };
      const { errors } = await mutate<Pick<Mutation, "updateForm">>(
        UPDATE_FORM,
        {
          variables: { updateFormInput }
        }
      );
      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Le sous-profil sélectionné par l'établissement destinataire ne lui permet pas de prendre en charge ce type de déchet." +
            " Il lui appartient de mettre à jour son profil.",
          extensions: {
            code: "BAD_USER_INPUT"
          }
        })
      ]);
    }
  );

  it.each(forbbidenProfilesForDangerousWaste)(
    "should allow recipient with inappropriate profile %o on a sealed bsdd with dangerous waste code on bsdd created before VERIFY_DESTINATION_PROFILES_FOR_BSDD_CREATED_AFTER",
    async opt => {
      const { user, company } = await userWithCompanyFactory("MEMBER", {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      });
      const form = await formFactory({
        ownerId: user.id,
        opt: {
          status: "SEALED",
          emitterCompanySiret: company.siret,
          createdAt: new Date("2024-10-01T00:00:00.000Z") // created before VERIFY_DESTINATION_PROFILES_FOR_BSDD_CREATED_AFTER
        }
      });

      const { mutate } = makeClient(user);
      const destination = await companyFactory(opt);
      const updateFormInput = {
        id: form.id,
        recipient: {
          company: { siret: destination.siret }
        }
      };
      const { errors } = await mutate<Pick<Mutation, "updateForm">>(
        UPDATE_FORM,
        {
          variables: { updateFormInput }
        }
      );
      expect(errors).toBe(undefined);
    }
  );

  it.each(forbbidenProfilesForNonDangerousWaste)(
    "should allow recipient with inappropriate profile %o on a sealed bsdd with non dangerous waste on bsdd created before VERIFY_DESTINATION_PROFILES_FOR_BSDD_CREATED_AFTER",
    async opt => {
      const { user, company } = await userWithCompanyFactory("MEMBER", {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      });
      const form = await formFactory({
        ownerId: user.id,
        opt: {
          status: "SEALED",
          emitterCompanySiret: company.siret,
          wasteDetailsCode: "10 05 09",
          wasteDetailsIsDangerous: false,
          wasteDetailsPop: false,
          createdAt: new Date("2024-10-01T00:00:00.000Z") // created before VERIFY_DESTINATION_PROFILES_FOR_BSDD_CREATED_AFTER
        }
      });

      const { mutate } = makeClient(user);
      const destination = await companyFactory(opt);
      const updateFormInput = {
        id: form.id,
        recipient: {
          company: { siret: destination.siret }
        }
      };
      const { errors } = await mutate<Pick<Mutation, "updateForm">>(
        UPDATE_FORM,
        {
          variables: { updateFormInput }
        }
      );
      expect(errors).toBe(undefined);
    }
  );

  it("should allow a destination after temp storage to update a form", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    //  recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });

    const form = await formWithTempStorageFactory({
      ownerId: user.id,
      opt: { status: "DRAFT", recipientCompanySiret: destination.siret },
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
    await ecoOrganismeFactory({
      siret: eo.siret!,
      handle: { handleBsdd: true }
    });

    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    const form = await formFactory({
      ownerId: user.id,

      opt: {
        status: "DRAFT",
        emitterType: "OTHER",
        ecoOrganismeName: eo.name,
        ecoOrganismeSiret: eo.siret,
        recipientCompanySiret: destination.siret
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

    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    const originalEO = await companyFactory({
      companyTypes: {
        set: ["ECO_ORGANISME"]
      }
    });
    await ecoOrganismeFactory({
      siret: originalEO.siret!,
      handle: { handleBsdd: true }
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        ecoOrganismeName: originalEO.name,
        ecoOrganismeSiret: originalEO.siret,
        recipientCompanySiret: destination.siret
      }
    });
    const newEO = await companyFactory({
      companyTypes: {
        set: ["ECO_ORGANISME"]
      }
    });
    await ecoOrganismeFactory({
      siret: newEO.siret!,
      handle: { handleBsdd: true }
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

    await ecoOrganismeFactory({
      siret: eo.siret!,
      handle: { handleBsdd: true }
    });
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        ecoOrganismeName: eo.name,
        ecoOrganismeSiret: eo.siret,
        recipientCompanySiret: destination.siret
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

  it("should add the first intermediary on an existing draft", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.MEMBER);
    const intermediary = await userWithCompanyFactory(UserRole.MEMBER);
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        recipientCompanySiret: destination.siret
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

    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        recipientCompanySiret: destination.siret,
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
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        recipientCompanySiret: destination.siret,
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
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        recipientCompanySiret: destination.siret,
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
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        recipientCompanySiret: destination.siret,
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
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SEALED",
        emitterCompanySiret: company.siret,
        recipientCompanySiret: destination.siret,
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
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        recipientCompanySiret: destination.siret
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

  it(
    "[deprecated] should empty transporter list and packagings when " +
      "adding a PIPELINE packaging",
    async () => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      // recipient needs appropriate profiles and subprofiles
      const destination = await companyFactory({
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      });
      const form = await formFactory({
        ownerId: user.id,
        opt: {
          status: "DRAFT",
          emitterCompanySiret: company.siret,
          recipientCompanySiret: destination.siret
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
      const { data, errors } = await mutate<Pick<Mutation, "updateForm">>(
        UPDATE_FORM,
        {
          variables: { updateFormInput }
        }
      );
      expect(errors).toBeUndefined();
      expect(data.updateForm).toMatchObject({
        isDirectSupply: true,
        wasteDetails: {
          packagingInfos: []
        },
        transporter: null
      });
    }
  );

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
          "Aucun conditionnement ne doit être renseigné dans le cadre d'un acheminement direct par pipeline ou convoyeur"
      }
    ]);
  });

  it("should be possible to set isDirectSupply=true", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        wasteDetailsPackagingInfos: [{ type: "CITERNE", quantity: 1 }]
      }
    });
    const { mutate } = makeClient(user);
    const { errors, data } = await mutate<
      Pick<Mutation, "updateForm">,
      MutationUpdateFormArgs
    >(UPDATE_FORM, {
      variables: {
        updateFormInput: {
          id: form.id,
          isDirectSupply: true,
          wasteDetails: { packagingInfos: [] },
          transporters: []
        }
      }
    });
    expect(errors).toBeUndefined();
    expect(data.updateForm).toMatchObject({
      isDirectSupply: true,
      wasteDetails: { packagingInfos: {} },
      transporter: null
    });
  });

  it("should throw error when trying to set isDirectSupply=true and transporters are present", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        wasteDetailsPackagingInfos: [{ type: "CITERNE", quantity: 1 }]
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
          isDirectSupply: true,
          wasteDetails: { packagingInfos: [] }
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne devez pas spécifier de transporteur dans le cas d'un acheminement direct par pipeline ou convoyeur"
      })
    ]);
  });

  it("should throw error when trying to set isDirectSupply=true and packagings are present", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        wasteDetailsPackagingInfos: [{ type: "CITERNE", quantity: 1 }]
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
          isDirectSupply: true,
          transporters: []
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Aucun conditionnement ne doit être renseigné dans le cadre d'un acheminement direct par pipeline ou convoyeur"
      })
    ]);
  });

  it("should add a temporary storage", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        recipientCompanySiret: destination.siret
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
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        recipientCompanySiret: destination.siret
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
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        recipientIsTempStorage: true,
        recipientCompanySiret: destination.siret,
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
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        recipientCompanySiret: destination.siret,
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
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        recipientCompanySiret: destination.siret
      }
    });
    const newRecipientCompany = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });

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
    // recipient needs appropriate profiles and subprofiles
    const originalRecipientCompany = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        recipientCompanySiret: originalRecipientCompany.siret
      }
    });

    const newRecipientCompany = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
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
        quantityReceived: 1,
        quantityGrouped: 1
      }
    });
    const toBeAppendixForm = await formFactory({
      ownerId: user.id,
      opt: {
        status: "AWAITING_GROUP",
        recipientCompanySiret: ttr.siret,
        quantityReceived: 1,
        quantityGrouped: 0
      }
    });
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        emitterType: EmitterType.APPENDIX2,
        status: "SEALED",
        emitterCompanySiret: ttr.siret,
        recipientCompanySiret: destination.siret,

        grouping: {
          create: {
            initialFormId: appendixForm.id,
            quantity: appendixForm.quantityReceived!.toNumber()
          }
        }
      }
    });

    const updateFormInput = {
      id: form.id,
      appendix2Forms: [{ id: toBeAppendixForm.id }]
    };
    const { mutate } = makeClient(user);
    const mutateFn = () =>
      mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
        variables: {
          updateFormInput
        }
      });

    await waitForJobsCompletion({
      fn: mutateFn,
      queue: updateAppendix2Queue,
      expectedJobCount: 2
    });

    // Old appendix form is back to AWAITING_GROUP
    const oldAppendix2Form = await prisma.form.findUniqueOrThrow({
      where: { id: appendixForm.id }
    });
    expect(oldAppendix2Form.status).toBe("AWAITING_GROUP");
    expect(oldAppendix2Form.quantityGrouped).toEqual(0);

    // New appendix form is now GROUPED
    const newAppendix2Form = await prisma.form.findUniqueOrThrow({
      where: { id: toBeAppendixForm.id }
    });
    expect(newAppendix2Form.status).toBe("GROUPED");
    expect(newAppendix2Form.quantityGrouped).toEqual(
      newAppendix2Form.quantityReceived?.toNumber()
    );
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
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SEALED",
        emitterCompanySiret: ttr.siret,
        emitterType: EmitterType.APPENDIX2,
        recipientCompanySiret: destination.siret,

        grouping: {
          create: {
            initialFormId: appendixForm.id,
            quantity: appendixForm.quantityReceived!.toNumber()
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
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });

    const form = await formFactory({
      ownerId: ttrUser.id,
      opt: {
        status: "SEALED",
        emitterCompanySiret: ttr.siret,
        emitterType: EmitterType.APPENDIX2,
        recipientCompanySiret: destination.siret,

        grouping: {
          create: {
            initialFormId: appendixForm.id,
            quantity: appendixForm.quantityReceived!.toNumber()
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
      // recipient needs appropriate profiles and subprofiles
      const destination = await companyFactory({
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      });

      const form = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.SEALED,
          emitterCompanySiret: ttr.siret,
          emitterType: EmitterType.APPENDIX2,
          recipientCompanySiret: destination.siret,

          grouping: {
            create: {
              initialFormId: initialAppendix2.id,
              quantity: initialAppendix2.quantityReceived!.toNumber()
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
      // recipient needs appropriate profiles and subprofiles
      const destination = await companyFactory({
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      });

      const form = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.SEALED,
          emitterCompanySiret: ttr.siret,
          emitterType: EmitterType.APPENDIX2,
          recipientCompanySiret: destination.siret,

          grouping: {
            create: {
              initialFormId: initialAppendix2.id,
              quantity: initialAppendix2.quantityReceived!.toNumber()
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
            quantity: wannaBeAppendix2.quantityReceived?.toNumber()
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
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: ttr.siret,
        emitterType: EmitterType.APPENDIX2,
        recipientCompanySiret: destination.siret,

        grouping: {
          create: {
            initialFormId: appendixForm.id,
            quantity: appendixForm.quantityReceived!.toNumber()
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
      // recipient needs appropriate profiles and subprofiles
      const destination = await companyFactory({
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      });

      const form = await formFactory({
        ownerId: user.id,
        opt: {
          status: "DRAFT",
          emitterCompanySiret: producer.siret,
          emitterType: EmitterType.PRODUCER,
          recipientCompanySiret: destination.siret
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

      // recipient needs appropriate profiles and subprofiles
      const destination = await companyFactory({
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      });

      const form = await formFactory({
        ownerId: user.id,
        opt: {
          status: "DRAFT",
          emitterCompanySiret: producer.siret,
          emitterType: EmitterType.PRODUCER,
          recipientCompanySiret: destination.siret
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
                quantity: appendixForm.quantityReceived?.toNumber()
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
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: ttr.siret,
        emitterType: EmitterType.APPENDIX2,
        recipientCompanySiret: destination.siret,

        grouping: {
          create: {
            initialFormId: appendixForm.id,
            quantity: appendixForm.quantityReceived!.toNumber()
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
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: ttr.siret,
        emitterType: EmitterType.APPENDIX2,
        recipientCompanySiret: destination.siret,

        grouping: {
          create: {
            initialFormId: appendixForm.id,
            quantity: appendixForm.quantityReceived!.toNumber()
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
        quantityReceived: 1,
        quantityGrouped: 1
      }
    });
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SEALED",
        emitterCompanySiret: ttr.siret,
        emitterType: EmitterType.APPENDIX2,
        recipientCompanySiret: destination.siret
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

    const updatedAppendixForm = await prisma.form.findUniqueOrThrow({
      where: { id: appendixForm.id }
    });

    expect(updatedAppendixForm.quantityGrouped).toEqual(1);
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
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });

    const groupingForm1 = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SEALED",
        emitterCompanySiret: ttr.siret,
        emitterType: EmitterType.APPENDIX2,
        recipientCompanySiret: destination.siret
      }
    });

    const groupingForm2 = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SEALED",
        emitterCompanySiret: ttr.siret,
        emitterType: EmitterType.APPENDIX2,
        recipientCompanySiret: destination.siret
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

    const updatedAppendixForm = await prisma.form.findFirstOrThrow({
      where: { id: appendixForm.id }
    });
    expect(updatedAppendixForm.quantityGrouped).toEqual(1);
  });

  it("should default to quantity left when no quantity is specified in grouping", async () => {
    // recipient needs appropriate profiles and subprofiles

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
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });

    const groupingForm = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SEALED",
        emitterCompanySiret: ttr.siret,
        emitterType: EmitterType.APPENDIX2,
        recipientCompanySiret: destination.siret
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
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        wasteDetailsCode: "20 03 01",
        wasteDetailsIsDangerous: false,
        recipientCompanySiret: destination.siret
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
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SEALED",
        emitterCompanySiret: ttr.siret,
        emitterType: EmitterType.APPENDIX2,
        wasteDetailsCode: "01 03 04*",
        recipientCompanySiret: destination.siret
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
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    const transporterCompany = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
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
        wasteDetailsCode: "01 03 04*",
        recipientCompanySiret: destination.siret
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
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });

    const { mutate } = makeClient(user);
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SEALED",
        emitterCompanySiret: company.siret,
        emitterType: EmitterType.APPENDIX2,
        wasteDetailsCode: "01 03 04*",
        recipientCompanySiret: destination.siret,
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

  it("should be possible to update a weight > 40 T when transport mode is not ROAD", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });

    const { mutate } = makeClient(user);
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SEALED",
        emitterCompanySiret: company.siret,
        emitterType: EmitterType.APPENDIX2,
        wasteDetailsCode: "01 03 04*",
        wasteDetailsQuantity: 10,
        recipientCompanySiret: destination.siret,
        transporters: {
          create: {
            transporterTransportMode: "ROAD",
            number: 1
          }
        }
      }
    });
    const { data } = await mutate<
      Pick<Mutation, "updateForm">,
      MutationUpdateFormArgs
    >(UPDATE_FORM, {
      variables: {
        updateFormInput: {
          id: form.id,
          wasteDetails: { quantity: 50 },
          transporter: { mode: "RIVER" }
        }
      }
    });
    const updatedForm = await prisma.form.findUniqueOrThrow({
      where: { id: data.updateForm.id },
      include: { transporters: true }
    });
    expect(updatedForm.wasteDetailsQuantity?.toNumber()).toEqual(50);

    expect(updatedForm.transporters).toHaveLength(1);
    expect(updatedForm.transporters[0]?.transporterTransportMode).toEqual(
      "RIVER"
    );
  });

  it("should be possible to update a weight > 40 T when deleting first transporter by road", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { mutate } = makeClient(user);
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SEALED",
        emitterCompanySiret: company.siret,
        emitterType: EmitterType.APPENDIX2,
        wasteDetailsCode: "01 03 04*",
        wasteDetailsQuantity: 10,
        recipientCompanySiret: destination.siret,
        transporters: {
          create: { transporterTransportMode: "ROAD", number: 1 }
        }
      }
    });
    // crée un second transporter fluivale
    await prisma.bsddTransporter.create({
      data: { transporterTransportMode: "RIVER", number: 2, formId: form.id }
    });

    const { data, errors } = await mutate<
      Pick<Mutation, "updateForm">,
      MutationUpdateFormArgs
    >(UPDATE_FORM, {
      variables: {
        updateFormInput: {
          id: form.id,
          wasteDetails: { quantity: 50 },
          // supprime le premier transporteur mais conserve les transporteurs suivants
          transporter: null
        }
      }
    });
    expect(errors).toBeUndefined();
    const updatedForm = await prisma.form.findUniqueOrThrow({
      where: { id: data.updateForm.id },
      include: { transporters: true }
    });
    expect(updatedForm.wasteDetailsQuantity?.toNumber()).toEqual(50);

    expect(updatedForm.transporters).toHaveLength(1);
    expect(updatedForm.transporters[0]?.transporterTransportMode).toEqual(
      "RIVER"
    );
  });

  it("should clean appendix1 items on update", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: producerCompany } = await userWithCompanyFactory("MEMBER");
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });

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
        recipientCompanySiret: destination.siret,
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

  it("should append appendix1 item on update", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: producerCompany } = await userWithCompanyFactory("MEMBER");
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });

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
        recipientCompanySiret: destination.siret,
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
        recipientCompanySiret: destination.siret,

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
          grouping: [
            { form: { id: appendix1_1.id } },
            { form: { id: appendix1_2.id } }
          ]
        }
      }
    });

    expect(data.updateForm.grouping!.length).toBe(2);
    expect(data.updateForm.grouping!.map(g => g.form.id)).toEqual([
      appendix1_1.id,
      appendix1_2.id
    ]);
  });

  it("should update appendix1 infos even if the grouping doesnt change", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: producerCompany } = await userWithCompanyFactory("MEMBER");
    const { company: newTransporter } = await userWithCompanyFactory("MEMBER");
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

    // Group with appendix1_1
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: Status.SEALED,
        wasteDetailsCode: "16 06 01*",
        emitterCompanySiret: company.siret,
        emitterType: EmitterType.APPENDIX1,
        recipientCompanySiret: destination.siret,

        grouping: { create: { initialFormId: appendix1_1.id, quantity: 0 } }
      }
    });

    // Update container
    const { data } = await mutate<
      Pick<Mutation, "updateForm">,
      MutationUpdateFormArgs
    >(UPDATE_FORM, {
      variables: {
        updateFormInput: {
          id: form.id,
          transporter: { company: { siret: newTransporter.siret } },
          recipient: {
            company: {
              contact: "New contact"
            }
          }
        }
      }
    });

    expect(data.updateForm.grouping!.length).toBe(1);
    expect(data.updateForm.grouping!.map(g => g.form.id)).toEqual([
      appendix1_1.id
    ]);
    expect(data.updateForm.transporter?.company?.siret).toBe(
      newTransporter.siret
    );

    const updatedAppendix1 = await prisma.form.findUniqueOrThrow({
      where: { id: appendix1_1.id },
      include: { transporters: true }
    });
    expect(updatedAppendix1.recipientCompanyContact).toEqual("New contact");
    expect(updatedAppendix1.transporters.length).toBe(1);
    expect(updatedAppendix1.transporters[0].transporterCompanySiret).toBe(
      newTransporter.siret
    );
  });

  it("should not allow to group an APPENDIX1_PRODUCER form with an emitter that is not registered", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { mutate } = makeClient(user);

    const appendix1_1 = await prisma.form.create({
      data: {
        readableId: getReadableId(),
        status: Status.DRAFT,
        emitterType: EmitterType.APPENDIX1_PRODUCER,
        emitterCompanySiret: "42172923700022",
        emitterCompanyName: "UnregisteredProducerCompany",
        emitterCompanyAddress: "rue de l'annexe",
        emitterCompanyContact: "Contact",
        emitterCompanyPhone: "01 01 01 01 01",
        emitterCompanyMail: "annexe1@test.com",
        wasteDetailsCode: "16 06 01*",
        owner: { connect: { id: user.id } }
      }
    });

    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    // Group with appendix1_1
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: Status.SEALED,
        wasteDetailsCode: "16 06 01*",
        emitterCompanySiret: company.siret,
        emitterType: EmitterType.APPENDIX1,
        recipientCompanySiret: destination.siret
      }
    });

    // Update container
    const { errors } = await mutate<
      Pick<Mutation, "updateForm">,
      MutationUpdateFormArgs
    >(UPDATE_FORM, {
      variables: {
        updateFormInput: {
          id: form.id,
          grouping: [{ form: { id: appendix1_1.id }, quantity: 0 }]
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `L'émetteur du bordereau d'annexe 1 ${appendix1_1.readableId} n'est pas inscrit sur Trackdéchets. Il est impossible de joindre cette annexe à un bordereau chapeau sans éco-organisme.`,
        extensions: {
          code: "BAD_USER_INPUT"
        }
      })
    ]);
  });

  it("should allow to group an APPENDIX1_PRODUCER form with an emitter that is not registered if the container has an eco organisme", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const ecoOrganisme = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["ECO_ORGANISME"]
      }
    });
    await ecoOrganismeFactory({
      siret: ecoOrganisme.company.siret!,
      handle: { handleBsdd: true }
    });

    const { mutate } = makeClient(user);

    const appendix1_1 = await prisma.form.create({
      data: {
        readableId: getReadableId(),
        status: Status.DRAFT,
        emitterType: EmitterType.APPENDIX1_PRODUCER,
        emitterCompanySiret: "42172923700022",
        emitterCompanyName: "UnregisteredProducerCompany",
        emitterCompanyAddress: "rue de l'annexe",
        emitterCompanyContact: "Contact",
        emitterCompanyPhone: "01 01 01 01 01",
        emitterCompanyMail: "annexe1@test.com",
        wasteDetailsCode: "16 06 01*",
        owner: { connect: { id: user.id } }
      }
    });

    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });

    // Group with appendix1_1
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: Status.SEALED,
        wasteDetailsCode: "16 06 01*",
        emitterCompanySiret: company.siret,
        emitterType: EmitterType.APPENDIX1,
        ecoOrganismeName: ecoOrganisme.company.name,
        ecoOrganismeSiret: ecoOrganisme.company.siret,
        recipientCompanySiret: destination.siret
      }
    });

    // Update container
    const { data } = await mutate<
      Pick<Mutation, "updateForm">,
      MutationUpdateFormArgs
    >(UPDATE_FORM, {
      variables: {
        updateFormInput: {
          id: form.id,
          grouping: [{ form: { id: appendix1_1.id }, quantity: 0 }]
        }
      }
    });

    expect(data.updateForm.grouping).toHaveLength(1);
  });

  it(
    "should be possible to update a form where transport is ROAD and wasteDetailsQuantity is > 40T " +
      "if it was created before (<=) process.env.MAX_WEIGHT_BY_ROAD_VALIDATE_AFTER",
    async () => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const { mutate } = makeClient(user);
      // recipient needs appropriate profiles and subprofiles
      const destination = await companyFactory({
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      });
      const form = await formFactory({
        ownerId: user.id,
        opt: {
          createdAt: new Date(0), // same as default value for MAX_WEIGHT_BY_ROAD_VALIDATE_AFTER
          status: "SEALED",
          emitterCompanySiret: company.siret,
          emitterType: EmitterType.APPENDIX2,
          recipientCompanySiret: destination.siret,

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

  it("should not allow updating appendix1 if one of them has been signed by the transporter for more than 5 days", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: producerCompany } = await userWithCompanyFactory("MEMBER");
    const { mutate } = makeClient(user);

    const fiveDaysAgo = sub(new Date(), { days: 5 });
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
        takenOverAt: fiveDaysAgo
      }
    });

    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    // Group with appendix1_1
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: Status.SENT,
        wasteDetailsCode: "16 06 01*",
        emitterCompanySiret: company.siret,
        emitterType: EmitterType.APPENDIX1,
        recipientCompanySiret: destination.siret,

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
      "Impossible d'ajouter une annexe 1. Un bordereau de tournée ne peut être utilisé que durant 5 jours consécutifs à partir du moment où la première collecte"
    );
  });

  it("should not allow grouping appendix1 into a container if this container is still a draft", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: producerCompany } = await userWithCompanyFactory("MEMBER");
    const { mutate } = makeClient(user);
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    // Group with appendix1_1
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: Status.DRAFT,
        wasteDetailsCode: "16 06 01*",
        emitterCompanySiret: company.siret,
        emitterType: EmitterType.APPENDIX1,
        recipientCompanySiret: destination.siret
      }
    });

    const appendix1 = await prisma.form.create({
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

    // Try to add appendix1
    const { errors } = await mutate<
      Pick<Mutation, "updateForm">,
      MutationUpdateFormArgs
    >(UPDATE_FORM, {
      variables: {
        updateFormInput: {
          id: form.id,
          grouping: [{ form: { id: appendix1.id } }]
        }
      }
    });

    expect(errors.length).toBe(1);
    expect(errors[0].message).toContain(
      "Impossible de regrouper des BSDD d'annexe 1 sur un bordereau de tournée en brouillon"
    );
  });

  it("should allow updating appendix1 if one of them has been signed by the transporter for less than 5 days but more than 4", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: producerCompany } = await userWithCompanyFactory("MEMBER");
    const { mutate } = makeClient(user);

    const fourDaysAgo = sub(new Date(), { days: 4 });
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
        takenOverAt: fourDaysAgo
      }
    });

    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    // Group with appendix1_1
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: Status.SENT,
        wasteDetailsCode: "16 06 01*",
        emitterCompanySiret: company.siret,
        emitterType: EmitterType.APPENDIX1,
        recipientCompanySiret: destination.siret,

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

    expect(errors).toBeUndefined();
  });

  it.each([Status.DRAFT, Status.SEALED, Status.SIGNED_BY_PRODUCER])(
    "should be possible to update transporter when status is %p",
    async status => {
      const { user, company } = await userWithCompanyFactory("MEMBER", {
        companyTypes: [CompanyType.WASTEPROCESSOR],
        wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      });
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
      transporterReceipt: {
        create: {
          receiptNumber: "TRANSPORTER-RECEIPT-NUMBER",
          validityLimit: TODAY.toISOString() as any,
          department: "TRANSPORTER- RECEIPT-DEPARTMENT"
        }
      }
    });
    const transporterReceipt =
      await prisma.transporterReceipt.findUniqueOrThrow({
        where: { id: transporter.company.transporterReceiptId! }
      });
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
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
        recipientCompanySiret: destination.siret,

        transporters: {
          create: {
            transporterCompanySiret: transporter.company.siret,
            transporterCompanyName: transporter.company.name,
            transporterCompanyAddress: transporter.company.address,
            transporterCompanyContact: transporter.company.contact,
            transporterCompanyPhone: transporter.company.contactPhone,
            transporterCompanyMail: transporter.company.contactEmail,
            transporterReceipt: transporterReceipt.receiptNumber,
            transporterDepartment: transporterReceipt.department,
            transporterValidityLimit: transporterReceipt.validityLimit,
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

  it("should be possible to update transporters with the `transporters` field", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter1 = await userWithCompanyFactory("MEMBER");
    const transporter2 = await userWithCompanyFactory("MEMBER");
    const transporter3 = await userWithCompanyFactory("MEMBER");
    const transporter4 = await userWithCompanyFactory("MEMBER");
    const transporter5 = await userWithCompanyFactory("MEMBER");
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: Status.DRAFT,
        emitterCompanySiret: emitter.company.siret,
        recipientCompanySiret: destination.siret
      }
    });

    const [
      bsddTransporter1,
      bsddTransporter2,
      bsddTransporter3,
      bsddTransporter4,
      bsddTransporter5
    ] = await Promise.all(
      [
        transporter1,
        transporter2,
        transporter3,
        transporter4,
        transporter5
      ].map((transporter, idx) => {
        return prisma.bsddTransporter.create({
          data: {
            number: idx + 1,
            transporterCompanySiret: transporter.company.siret
          }
        });
      })
    );

    // Initiate the form with two transporters
    await prisma.form.update({
      where: { id: form.id },
      data: {
        transporters: {
          connect: [{ id: bsddTransporter1.id }, { id: bsddTransporter2.id }]
        }
      }
    });

    const { mutate } = makeClient(emitter.user);

    // Update the form by removing the initial two transporters
    // and adding three others
    const updateFormInput: UpdateFormInput = {
      id: form.id,
      transporters: [
        bsddTransporter3.id,
        bsddTransporter4.id,
        bsddTransporter5.id
      ]
    };
    await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });

    const updatedForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: { transporters: true }
    });

    const transporters = getTransportersSync(updatedForm);

    expect(transporters).toHaveLength(3);
    expect(transporters[0]).toMatchObject({
      id: bsddTransporter3.id,
      number: 1 // number should have been set correctly
    });
    expect(transporters[1]).toMatchObject({
      id: bsddTransporter4.id,
      number: 2 // number should have been set correctly
    });
    expect(transporters[2]).toMatchObject({
      id: bsddTransporter5.id,
      number: 3 // number should have been set correctly
    });

    const transporter6 = await userWithCompanyFactory("MEMBER");
    const bsddTransporter6 = await prisma.bsddTransporter.create({
      data: {
        number: 6,
        transporterCompanySiret: transporter6.company.siret
      }
    });

    // it should not be possible though to set more than 5 transporters
    const { errors } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: {
        updateFormInput: {
          id: form.id,
          transporters: [
            bsddTransporter1.id,
            bsddTransporter2.id,
            bsddTransporter3.id,
            bsddTransporter4.id,
            bsddTransporter5.id,
            bsddTransporter6.id
          ]
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous ne pouvez pas ajouter plus de 5 transporteurs"
      })
    ]);
  });

  it("should be possible to swap the order of the different transporters", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter1 = await userWithCompanyFactory("MEMBER");
    const transporter2 = await userWithCompanyFactory("MEMBER");
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: Status.DRAFT,
        emitterCompanySiret: emitter.company.siret,
        recipientCompanySiret: destination.siret
      }
    });

    const [bsddTransporter1, bsddTransporter2] = await Promise.all(
      [transporter1, transporter2].map((transporter, idx) => {
        return prisma.bsddTransporter.create({
          data: {
            number: idx + 1,
            transporterCompanySiret: transporter.company.siret
          }
        });
      })
    );

    // Initiate the form with two transporters in a given order
    await prisma.form.update({
      where: { id: form.id },
      data: {
        transporters: {
          deleteMany: {},
          connect: [{ id: bsddTransporter1.id }, { id: bsddTransporter2.id }]
        }
      }
    });

    const { mutate } = makeClient(emitter.user);

    // swap the order
    const updateFormInput: UpdateFormInput = {
      id: form.id,
      transporters: [bsddTransporter2.id, bsddTransporter1.id]
    };
    const { errors } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });

    expect(errors).toBeUndefined();

    const updatedForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: { transporters: true }
    });

    const transporters = getTransportersSync(updatedForm);

    expect(transporters).toHaveLength(2);
    expect(transporters[0]).toMatchObject({
      id: bsddTransporter2.id,
      number: 1 // number should have been set correctly
    });
    expect(transporters[1]).toMatchObject({
      id: bsddTransporter1.id,
      number: 2 // number should have been set correctly
    });
  });

  it("should be possible to empty transporters list", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter1 = await userWithCompanyFactory("MEMBER");
    const transporter2 = await userWithCompanyFactory("MEMBER");
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: Status.DRAFT,
        emitterCompanySiret: emitter.company.siret,
        recipientCompanySiret: destination.siret
      }
    });

    const [bsddTransporter1, bsddTransporter2] = await Promise.all(
      [transporter1, transporter2].map((transporter, idx) => {
        return prisma.bsddTransporter.create({
          data: {
            number: idx + 1,
            transporterCompanySiret: transporter.company.siret
          }
        });
      })
    );

    // Initiate the form with two transporters
    await prisma.form.update({
      where: { id: form.id },
      data: {
        transporters: {
          deleteMany: {},
          connect: [{ id: bsddTransporter1.id }, { id: bsddTransporter2.id }]
        }
      }
    });

    const { mutate } = makeClient(emitter.user);

    const updateFormInput: UpdateFormInput = {
      id: form.id,
      transporters: []
    };
    const { errors } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });

    expect(errors).toBeUndefined();

    const updatedForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: { transporters: true }
    });

    const transporters = getTransportersSync(updatedForm);
    expect(transporters).toHaveLength(0);
  });

  it("should throw exception if transporters ID's don't exist", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: Status.DRAFT,
        emitterCompanySiret: emitter.company.siret
      }
    });
    const { mutate } = makeClient(emitter.user);

    const updateFormInput: UpdateFormInput = {
      id: form.id,
      transporters: ["ID1", "ID2"]
    };
    const { errors } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Aucun transporteur ne possède le ou les identifiants suivants : ID1, ID2"
      })
    ]);
  });

  it("should update the first transporter and do not updates next transporters", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter1 = await userWithCompanyFactory("MEMBER");
    const transporter2 = await userWithCompanyFactory("MEMBER");
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: Status.DRAFT,
        emitterCompanySiret: emitter.company.siret,
        recipientCompanySiret: destination.siret
      }
    });

    const [bsddTransporter1, bsddTransporter2] = await Promise.all(
      [transporter1, transporter2].map((transporter, idx) => {
        return prisma.bsddTransporter.create({
          data: {
            number: idx + 1,
            transporterCompanySiret: transporter.company.siret
          }
        });
      })
    );

    // Initiate the form with two transporters
    await prisma.form.update({
      where: { id: form.id },
      data: {
        transporters: {
          deleteMany: {},
          connect: [{ id: bsddTransporter1.id }, { id: bsddTransporter2.id }]
        }
      }
    });

    const { mutate } = makeClient(emitter.user);

    // update first transporter with deprecated field `transporter`
    const updateFormInput: UpdateFormInput = {
      id: form.id,
      transporter: { company: { name: "Transport Gégé" } }
    };
    const { errors } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });

    expect(errors).toBeUndefined();

    const updatedForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: { transporters: true }
    });

    const transporters = getTransportersSync(updatedForm);
    expect(transporters).toHaveLength(2);
    expect(transporters[0].id).toEqual(bsddTransporter1.id);
    expect(transporters[0].number).toEqual(1);
    expect(transporters[1].id).toEqual(bsddTransporter2.id);
    expect(transporters[1].number).toEqual(bsddTransporter2.number);
    expect(transporters[0].transporterCompanyName).toEqual("Transport Gégé");
  });

  it("should delete first transporter and do not updates next transporters", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter1 = await userWithCompanyFactory("MEMBER");
    const transporter2 = await userWithCompanyFactory("MEMBER");
    const transporter3 = await userWithCompanyFactory("MEMBER");
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: Status.DRAFT,
        emitterCompanySiret: emitter.company.siret,
        recipientCompanySiret: destination.siret
      }
    });

    const [bsddTransporter1, bsddTransporter2, bsddTransporter3] =
      await Promise.all(
        [transporter1, transporter2, transporter3].map((transporter, idx) => {
          return prisma.bsddTransporter.create({
            data: {
              number: idx + 1,
              transporterCompanySiret: transporter.company.siret
            }
          });
        })
      );

    // Initiate the form with two transporters
    await prisma.form.update({
      where: { id: form.id },
      data: {
        transporters: {
          deleteMany: {},
          connect: [
            { id: bsddTransporter1.id },
            { id: bsddTransporter2.id },
            { id: bsddTransporter3.id }
          ]
        }
      }
    });

    const { mutate } = makeClient(emitter.user);

    // set first transporter to `null` with deprecated field `transporter`
    const updateFormInput: UpdateFormInput = {
      id: form.id,
      transporter: null
    };
    const { errors } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });

    expect(errors).toBeUndefined();

    const updatedForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: { transporters: true }
    });

    const transporters = getTransportersSync(updatedForm);
    expect(transporters).toHaveLength(2);

    // transporters ordering should have been decremented
    expect(transporters[0].id).toEqual(bsddTransporter2.id);
    expect(transporters[0].number).toEqual(1);
    expect(transporters[1].id).toEqual(bsddTransporter3.id);
    expect(transporters[1].number).toEqual(bsddTransporter2.number);
  });

  it("should not be possible to update `transporters` when the form has been received", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter1 = await userWithCompanyFactory("MEMBER");
    const transporter2 = await userWithCompanyFactory("MEMBER");
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    // Create a form that has already been received
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: Status.ACCEPTED,
        emittedAt: new Date(),
        takenOverAt: new Date(),
        receivedAt: new Date(),
        emitterCompanySiret: emitter.company.siret,
        recipientCompanySiret: destination.siret,

        transporters: {
          create: {
            transporterCompanySiret: transporter1.company.siret,
            number: 1,
            readyToTakeOver: true,
            takenOverAt: new Date()
          }
        }
      }
    });

    const bsddTransporter1 = await getFirstTransporter(form);

    const bsddTransporter2 = await prisma.bsddTransporter.create({
      data: {
        number: 0,
        transporterCompanySiret: transporter2.company.siret,
        readyToTakeOver: true
      }
    });

    const { mutate } = makeClient(emitter.user);

    // Trying adding a new transporter
    const updateFormInput: UpdateFormInput = {
      id: form.id,
      transporters: [bsddTransporter1!.id, bsddTransporter2.id]
    };
    const { errors } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : transporters"
      })
    ]);
  });

  it("should not be possible to remove or permutate a transporter that has already signed when status is SENT", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter1 = await userWithCompanyFactory("MEMBER");
    const transporter2 = await userWithCompanyFactory("MEMBER");
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    // Create a form that has already been sent
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: Status.SENT,
        emittedAt: new Date(),
        takenOverAt: new Date(),
        emitterCompanySiret: emitter.company.siret,
        recipientCompanySiret: destination.siret,

        transporters: {
          create: {
            transporterCompanySiret: transporter1.company.siret,
            number: 1,
            readyToTakeOver: true,
            takenOverAt: new Date()
          }
        }
      }
    });

    const bsddTransporter1 = await getFirstTransporter(form);

    const bsddTransporter2 = await prisma.bsddTransporter.create({
      data: {
        number: 0,
        transporterCompanySiret: transporter2.company.siret,
        readyToTakeOver: true
      }
    });

    const { mutate } = makeClient(emitter.user);

    // Trying permuting two transporters
    const updateFormInput: UpdateFormInput = {
      id: form.id,
      transporters: [bsddTransporter2.id, bsddTransporter1!.id]
    };
    const { errors } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : transporters[0]"
      })
    ]);
  });

  it("should be possible to remove or permute transporters that has not signed yet when status is SENT", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter1 = await userWithCompanyFactory("MEMBER");
    const transporter2 = await userWithCompanyFactory("MEMBER");
    const transporter3 = await userWithCompanyFactory("MEMBER");
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    // Create a form that has already been signed by the first transporter
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: Status.SENT,
        emittedAt: new Date(),
        takenOverAt: new Date(),
        emitterCompanySiret: emitter.company.siret,
        recipientCompanySiret: destination.siret,

        transporters: {
          create: {
            transporterCompanySiret: transporter1.company.siret,
            number: 1,
            readyToTakeOver: true,
            takenOverAt: new Date()
          }
        }
      }
    });

    const bsddTransporter1 = await getFirstTransporter(form);

    // Transporter n°2 (not signed yet)
    const bsddTransporter2 = await bsddTransporterFactory({
      formId: form.id,
      opts: {
        transporterCompanySiret: transporter2.company.siret,
        takenOverAt: null
      }
    });

    // Transporter n°3 (not signed yet)
    const bsddTransporter3 = await bsddTransporterFactory({
      formId: form.id,
      opts: {
        transporterCompanySiret: transporter3.company.siret,
        takenOverAt: null
      }
    });

    // Permute transporter 2 and transporter 2
    const updateFormInput: UpdateFormInput = {
      id: form.id,
      transporters: [
        bsddTransporter1!.id,
        bsddTransporter3.id,
        bsddTransporter2.id
      ]
    };
    const { mutate } = makeClient(emitter.user);

    const { errors } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });

    expect(errors).toBeUndefined();
  });

  it("should not be possible to update `transporter` (first transporter) when the form has been sent", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter = await userWithCompanyFactory("MEMBER");
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    // Create a form that has already been sent
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: Status.SENT,
        emittedAt: new Date(),
        takenOverAt: new Date(),
        emitterCompanySiret: emitter.company.siret,
        recipientCompanySiret: destination.siret,

        transporters: {
          create: {
            transporterCompanySiret: transporter.company.siret,
            number: 1,
            readyToTakeOver: true,
            takenOverAt: new Date()
          }
        }
      }
    });

    const { mutate } = makeClient(emitter.user);

    // Try update first transporter
    const updateFormInput: UpdateFormInput = {
      id: form.id,
      transporter: { mode: "RAIL" }
    };
    const { errors } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : transporter"
      })
    ]);
  });

  it("should be possible to add a new transporter while the form has not been received", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter1 = await userWithCompanyFactory("MEMBER");
    const transporter2 = await userWithCompanyFactory("MEMBER");
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    // Create a form that has already been sent
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: Status.SENT,

        emittedAt: new Date(),
        takenOverAt: new Date(),
        emitterCompanySiret: emitter.company.siret,
        recipientCompanySiret: destination.siret,

        transporters: {
          create: {
            transporterCompanySiret: transporter1.company.siret,
            number: 1,
            readyToTakeOver: true,
            takenOverAt: new Date()
          }
        }
      }
    });

    const bsddTransporter1 = await getFirstTransporter(form);

    const bsddTransporter2 = await prisma.bsddTransporter.create({
      data: {
        number: 0,
        transporterCompanySiret: transporter2.company.siret,
        readyToTakeOver: true
      }
    });

    const { mutate } = makeClient(emitter.user);

    // Trying adding a new transporter after the first one
    const updateFormInput: UpdateFormInput = {
      id: form.id,
      transporters: [bsddTransporter1!.id, bsddTransporter2.id]
    };
    const { errors } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });

    expect(errors).toBeUndefined();
  });

  it("should not be possible to remove a transporter that has already signed", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter1 = await userWithCompanyFactory("MEMBER");
    const transporter2 = await userWithCompanyFactory("MEMBER");

    // Create a form that has already been sent
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: Status.SENT,
        emittedAt: new Date(),
        takenOverAt: new Date(),
        emitterCompanySiret: emitter.company.siret,
        transporters: {
          create: {
            transporterCompanySiret: transporter1.company.siret,
            number: 1,
            readyToTakeOver: true,
            takenOverAt: new Date()
          }
        }
      }
    });

    const bsddTransporter2 = await prisma.bsddTransporter.create({
      data: {
        number: 0,
        transporterCompanySiret: transporter2.company.siret,
        readyToTakeOver: true
      }
    });

    const { mutate } = makeClient(emitter.user);

    // Trying removing first transporter and set a different one
    const updateFormInput: UpdateFormInput = {
      id: form.id,
      transporters: [bsddTransporter2.id]
    };
    const { errors } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : transporters[0]"
      })
    ]);
  });

  it("Bugifx - It should be possible to add a tranporter on a SENT BSDD when first transporter has invalid plates", async () => {
    // Adding a transporter to an older SENT bsd with invalid plates used to fail

    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter1 = await userWithCompanyFactory("MEMBER");
    const transporter2 = await userWithCompanyFactory("MEMBER");

    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    // Create a form that has already been signed by the first transporter
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: Status.SENT,
        emittedAt: new Date(),
        takenOverAt: new Date(),
        emitterCompanySiret: emitter.company.siret,
        recipientCompanySiret: destination.siret,

        transporters: {
          create: {
            transporterCompanySiret: transporter1.company.siret,
            number: 1,
            readyToTakeOver: true,
            takenOverAt: new Date(),
            transporterTransportMode: "ROAD",
            transporterNumberPlate: "X"
          }
        }
      }
    });

    const bsddTransporter1 = await getFirstTransporter(form);

    //  Transporter n°2 (not signed yet)
    const bsddTransporter2 = await bsddTransporterFactory({
      formId: form.id,
      opts: {
        transporterCompanySiret: transporter2.company.siret,
        takenOverAt: null,
        transporterNumberPlate: "XY-ZE-23"
      }
    });

    const updateFormInput: UpdateFormInput = {
      id: form.id,
      transporters: [bsddTransporter1!.id, bsddTransporter2.id]
    };
    const { mutate } = makeClient(emitter.user);

    const { errors } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });

    expect(errors).toBeUndefined();
  });

  it("Should validate second transporter plate", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter1 = await userWithCompanyFactory("MEMBER");
    const transporter2 = await userWithCompanyFactory("MEMBER");

    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    // Create a form that has already been signed by the first transporter
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: Status.SENT,
        emittedAt: new Date(),
        takenOverAt: new Date(),
        emitterCompanySiret: emitter.company.siret,
        recipientCompanySiret: destination.siret,

        transporters: {
          create: {
            transporterCompanySiret: transporter1.company.siret,
            number: 1,
            readyToTakeOver: true,
            takenOverAt: new Date(),
            transporterTransportMode: "ROAD",
            transporterNumberPlate: "XY-23-AZ"
          }
        }
      }
    });

    const bsddTransporter1 = await getFirstTransporter(form);

    //  Transporter n°2 (not signed yet)
    const bsddTransporter2 = await bsddTransporterFactory({
      formId: form.id,
      opts: {
        transporterCompanySiret: transporter2.company.siret,
        takenOverAt: null,
        transporterNumberPlate: "XY"
      }
    });

    // Add second transporter
    const updateFormInput: UpdateFormInput = {
      id: form.id,
      transporters: [bsddTransporter1!.id, bsddTransporter2.id]
    };
    const { mutate } = makeClient(emitter.user);

    const { errors } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Le numéro d'immatriculation doit faire entre 4 et 12 caractères"
      })
    ]);
  });

  it("should be possible to add a transporter even if BSD has intermediaries", async () => {
    // Given
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter1 = await userWithCompanyFactory("MEMBER");
    const transporter2 = await userWithCompanyFactory("MEMBER");
    const intermediary1 = await userWithCompanyFactory("MEMBER", {
      address: "Adresse intermédiaire 1",
      contact: "Contact intermédiaire 1",
      name: "Nom intermédiaire 1",
      siret: siretify()
    });
    const intermediary2 = await userWithCompanyFactory("MEMBER", {
      address: "Adresse intermédiaire 2",
      contact: "Contact intermédiaire 2",
      name: "Nom intermédiaire 2",
      siret: siretify()
    });
    // recipient needs appropriate profiles and subprofiles
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: Status.SENT,
        takenOverAt: new Date(),
        emitterCompanySiret: emitter.company.siret,
        recipientCompanySiret: destination.siret,

        transporters: {
          create: {
            transporterCompanySiret: transporter1.company.siret,
            number: 1,
            readyToTakeOver: true,
            takenOverAt: new Date()
          }
        },
        intermediaries: {
          create: [
            toIntermediaryCompany(
              intermediary1.company,
              intermediary1.company.contact!
            ),
            toIntermediaryCompany(
              intermediary2.company,
              intermediary2.company.contact!
            )
          ]
        }
      }
    });

    const bsddTransporter1 = await getFirstTransporter(form);

    const bsddTransporter2 = await prisma.bsddTransporter.create({
      data: {
        number: 0,
        transporterCompanySiret: transporter2.company.siret,
        readyToTakeOver: true
      }
    });

    const { mutate } = makeClient(emitter.user);

    // When
    // Behave like our front and send back intermediaries data
    const updateFormInput: UpdateFormInput = {
      id: form.id,
      transporters: [bsddTransporter1!.id, bsddTransporter2.id],
      intermediaries: [
        {
          address: "Adresse intermédiaire 2",
          contact: "Contact intermédiaire 2",
          country: "FR",
          name: "Nom intermédiaire 2",
          siret: intermediary2.company.siret,
          vatNumber: null
        },
        {
          address: "Adresse intermédiaire 1",
          contact: "Contact intermédiaire 1",
          country: "FR",
          name: "Nom intermédiaire 1",
          siret: intermediary1.company.siret,
          vatNumber: null
        }
      ]
    };
    const { errors } = await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });

    // Then
    expect(errors).toBeUndefined();
  });

  it("should log in an event the updated data", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SEALED",
        emitterCompanySiret: company.siret,
        recipientCompanySiret: destination.siret
      }
    });

    const { mutate } = makeClient(user);
    const updateFormInput = {
      id: form.id,
      wasteDetails: {
        code: "08 01 11*"
      }
    };
    await mutate<Pick<Mutation, "updateForm">>(UPDATE_FORM, {
      variables: { updateFormInput }
    });

    const events = await getStream(form.id);

    const updateEvent = events.find(evt => evt.type === "BsddUpdated");
    expect(updateEvent).toBeDefined();
    expect(updateEvent?.data?.["content"]?.["wasteDetailsCode"]).toBe(
      "08 01 11*"
    );
  });
});
