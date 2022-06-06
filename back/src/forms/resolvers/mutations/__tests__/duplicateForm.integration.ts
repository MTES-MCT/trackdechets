import { UserRole } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { Mutation } from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import {
  formFactory,
  formWithTempStorageFactory,
  toIntermediaryCompany,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const DUPLICATE_FORM = `
  mutation DuplicateForm($id: ID!) {
    duplicateForm(id: $id) {
      id
      intermediaries {
        siret
        name
      }
    }
  }
`;

const validateIntermediariesInputMock = jest.fn();
jest.mock("../../../validation", () => ({
  validateIntermediariesInput: jest.fn((...args) =>
    validateIntermediariesInputMock(...args)
  )
}));

describe("Mutation.duplicateForm", () => {
  beforeEach(() => {
    validateIntermediariesInputMock.mockReset();
  });
  afterEach(() => resetDatabase());

  it.each([
    [
      "",
      {
        transporterNumberPlate: "AB-1234-56",
        transporterCustomInfo: "T001"
      }
    ],
    [
      "with an eco-organisme",
      {
        ecoOrganismeName: "COREPILE",
        ecoOrganismeSiret: "12345678912345"
      }
    ]
  ])("should duplicate a form %s", async (_, opt) => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const {
      id,
      nextDestinationProcessingOperation,
      nextDestinationCompanyName,
      nextDestinationCompanySiret,
      nextDestinationCompanyAddress,
      nextDestinationCompanyCountry,
      nextDestinationCompanyContact,
      nextDestinationCompanyPhone,
      nextDestinationCompanyMail,
      emitterType,
      emitterPickupSite,
      emitterWorkSiteName,
      emitterWorkSiteAddress,
      emitterWorkSiteCity,
      emitterWorkSitePostalCode,
      emitterWorkSiteInfos,
      emitterCompanyName,
      emitterCompanySiret,
      emitterCompanyAddress,
      emitterCompanyContact,
      emitterCompanyPhone,
      emitterCompanyMail,
      recipientCap,
      recipientProcessingOperation,
      recipientCompanyName,
      recipientCompanySiret,
      recipientCompanyAddress,
      recipientCompanyContact,
      recipientCompanyPhone,
      recipientCompanyMail,
      transporterCompanyName,
      transporterCompanySiret,
      transporterCompanyAddress,
      transporterCompanyContact,
      transporterCompanyPhone,
      transporterCompanyMail,
      transporterIsExemptedOfReceipt,
      transporterReceipt,
      transporterDepartment,
      transporterValidityLimit,
      wasteDetailsCode,
      wasteDetailsName,
      wasteDetailsOnuCode,
      wasteDetailsPackagingInfos,
      wasteDetailsQuantity,
      wasteDetailsQuantityType,
      wasteDetailsConsistence,
      wasteDetailsPop,
      traderCompanyName,
      traderCompanySiret,
      traderCompanyAddress,
      traderCompanyContact,
      traderCompanyPhone,
      traderCompanyMail,
      traderReceipt,
      traderDepartment,
      traderValidityLimit,
      ecoOrganismeName,
      ecoOrganismeSiret,
      nextTransporterSiret
    } = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        ...opt
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "duplicateForm">>(
      DUPLICATE_FORM,
      {
        variables: {
          id
        }
      }
    );
    const duplicatedForm = await prisma.form.findUnique({
      where: { id: data.duplicateForm.id }
    });

    expect(duplicatedForm).toMatchObject({
      customId: null,
      isDeleted: false,
      isImportedFromPaper: false,
      signedByTransporter: null,
      status: "DRAFT",
      sentAt: null,
      sentBy: null,
      isAccepted: false,
      wasteAcceptationStatus: null,
      wasteRefusalReason: null,
      receivedBy: null,
      receivedAt: null,
      signedAt: null,
      quantityReceived: null,
      processedBy: null,
      processedAt: null,
      processingOperationDone: null,
      processingOperationDescription: null,
      noTraceability: null,
      nextDestinationProcessingOperation,
      nextDestinationCompanyName,
      nextDestinationCompanySiret,
      nextDestinationCompanyAddress,
      nextDestinationCompanyCountry,
      nextDestinationCompanyContact,
      nextDestinationCompanyPhone,
      nextDestinationCompanyMail,
      emitterType,
      emitterPickupSite,
      emitterWorkSiteName,
      emitterWorkSiteAddress,
      emitterWorkSiteCity,
      emitterWorkSitePostalCode,
      emitterWorkSiteInfos,
      emitterCompanyName,
      emitterCompanySiret,
      emitterCompanyAddress,
      emitterCompanyContact,
      emitterCompanyPhone,
      emitterCompanyMail,
      recipientCap,
      recipientProcessingOperation,
      recipientIsTempStorage: false,
      recipientCompanyName,
      recipientCompanySiret,
      recipientCompanyAddress,
      recipientCompanyContact,
      recipientCompanyPhone,
      recipientCompanyMail,
      transporterCompanyName,
      transporterCompanySiret,
      transporterCompanyAddress,
      transporterCompanyContact,
      transporterCompanyPhone,
      transporterCompanyMail,
      transporterIsExemptedOfReceipt,
      transporterReceipt,
      transporterDepartment,
      transporterValidityLimit,
      transporterNumberPlate: null,
      transporterCustomInfo: null,
      wasteDetailsCode,
      wasteDetailsName,
      wasteDetailsOnuCode,
      wasteDetailsPackagingInfos,
      wasteDetailsQuantity,
      wasteDetailsQuantityType,
      wasteDetailsConsistence,
      wasteDetailsPop,
      traderCompanyName,
      traderCompanySiret,
      traderCompanyAddress,
      traderCompanyContact,
      traderCompanyPhone,
      traderCompanyMail,
      traderReceipt,
      traderDepartment,
      traderValidityLimit,
      ecoOrganismeName,
      ecoOrganismeSiret,
      currentTransporterSiret: null,
      nextTransporterSiret
    });
  });

  it("should duplicate the temporary storage detail", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formWithTempStorageFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: company.siret }
    });
    const {
      destinationCompanyName,
      destinationCompanySiret,
      destinationCompanyAddress,
      destinationCompanyContact,
      destinationCompanyPhone,
      destinationCompanyMail,
      destinationCap,
      destinationProcessingOperation,
      wasteDetailsOnuCode,
      wasteDetailsPackagingInfos,
      wasteDetailsQuantity,
      wasteDetailsQuantityType,
      transporterCompanyName,
      transporterCompanySiret,
      transporterCompanyAddress,
      transporterCompanyContact,
      transporterCompanyPhone,
      transporterCompanyMail,
      transporterIsExemptedOfReceipt,
      transporterReceipt,
      transporterDepartment,
      transporterValidityLimit
    } = await prisma.form
      .findUnique({ where: { id: form.id } })
      .temporaryStorageDetail();

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "duplicateForm">>(
      DUPLICATE_FORM,
      {
        variables: {
          id: form.id
        }
      }
    );
    const duplicatedForm = await prisma.form.findUnique({
      where: { id: data.duplicateForm.id }
    });
    const duplicatedTemporaryStorageDetail = await prisma.form
      .findUnique({
        where: {
          id: duplicatedForm.id
        }
      })
      .temporaryStorageDetail();

    expect(duplicatedForm.recipientIsTempStorage).toBe(true);
    expect(duplicatedTemporaryStorageDetail).toMatchObject({
      tempStorerQuantityType: null,
      tempStorerQuantityReceived: null,
      tempStorerWasteAcceptationStatus: null,
      tempStorerWasteRefusalReason: null,
      tempStorerReceivedAt: null,
      tempStorerReceivedBy: null,
      tempStorerSignedAt: null,
      destinationCompanyName,
      destinationCompanySiret,
      destinationCompanyAddress,
      destinationCompanyContact,
      destinationCompanyPhone,
      destinationCompanyMail,
      destinationCap,
      destinationProcessingOperation,
      wasteDetailsOnuCode,
      wasteDetailsPackagingInfos,
      wasteDetailsQuantity,
      wasteDetailsQuantityType,
      transporterCompanyName,
      transporterCompanySiret,
      transporterCompanyAddress,
      transporterCompanyContact,
      transporterCompanyPhone,
      transporterCompanyMail,
      transporterIsExemptedOfReceipt,
      transporterReceipt,
      transporterDepartment,
      transporterValidityLimit,
      transporterNumberPlate: null,
      signedByTransporter: null,
      signedBy: null,
      signedAt: null
    });
  });

  it("should create a status log", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: company.siret }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "duplicateForm">>(
      DUPLICATE_FORM,
      {
        variables: {
          id: form.id
        }
      }
    );

    // check relevant statusLog is created
    const statusLogs = await prisma.statusLog.findMany({
      where: {
        form: { id: data.duplicateForm.id },
        user: { id: user.id },
        status: "DRAFT"
      }
    });

    expect(statusLogs.length).toEqual(1);
    expect(statusLogs[0].loggedAt).toBeTruthy();
  });

  it("should duplicate the intermediary company", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.MEMBER);
    const intermediary = await userWithCompanyFactory(UserRole.MEMBER);
    validateIntermediariesInputMock.mockResolvedValueOnce([
      toIntermediaryCompany(intermediary.company)
    ]);
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        intermediaries: {
          create: [toIntermediaryCompany(intermediary.company)]
        }
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "duplicateForm">>(
      DUPLICATE_FORM,
      {
        variables: {
          id: form.id
        }
      }
    );

    expect(data.duplicateForm.intermediaries).toEqual([
      expect.objectContaining({
        name: intermediary.company.name,
        siret: intermediary.company.siret
      })
    ]);
  });
});
