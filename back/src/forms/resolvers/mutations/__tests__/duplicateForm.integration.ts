import { UserRole } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { Mutation } from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import {
  companyFactory,
  formFactory,
  formWithTempStorageFactory,
  siretify,
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
        ecoOrganismeSiret: siretify(1)
      }
    ]
  ])("should duplicate a form %s", async (_, opt) => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const {
      id,
      emitterType,
      emitterPickupSite,
      emitterIsPrivateIndividual,
      emitterIsForeignShip,
      emitterCompanyName,
      emitterCompanySiret,
      emitterCompanyAddress,
      emitterCompanyContact,
      emitterCompanyPhone,
      emitterCompanyMail,
      emitterCompanyOmiNumber,
      emitterWorkSiteName,
      emitterWorkSiteAddress,
      emitterWorkSiteCity,
      emitterWorkSitePostalCode,
      emitterWorkSiteInfos,
      recipientCap,
      recipientProcessingOperation,
      recipientCompanyName,
      recipientCompanySiret,
      recipientCompanyAddress,
      recipientCompanyContact,
      recipientCompanyPhone,
      recipientCompanyMail,
      recipientIsTempStorage,
      transporterCompanyName,
      transporterCompanySiret,
      transporterCompanyAddress,
      transporterCompanyContact,
      transporterCompanyPhone,
      transporterCompanyMail,
      transporterCompanyVatNumber,
      transporterReceipt,
      transporterDepartment,
      transporterValidityLimit,
      transporterTransportMode,
      transporterIsExemptedOfReceipt,
      wasteDetailsCode,
      wasteDetailsOnuCode,
      wasteDetailsPackagingInfos,
      wasteDetailsQuantity,
      wasteDetailsQuantityType,
      wasteDetailsPop,
      wasteDetailsIsDangerous,
      wasteDetailsParcelNumbers,
      wasteDetailsAnalysisReferences,
      wasteDetailsLandIdentifiers,
      wasteDetailsName,
      wasteDetailsConsistence,
      wasteDetailsSampleNumber,
      traderCompanyName,
      traderCompanySiret,
      traderCompanyAddress,
      traderCompanyContact,
      traderCompanyPhone,
      traderCompanyMail,
      traderReceipt,
      traderDepartment,
      traderValidityLimit,
      brokerCompanyName,
      brokerCompanySiret,
      brokerCompanyAddress,
      brokerCompanyContact,
      brokerCompanyPhone,
      brokerCompanyMail,
      brokerReceipt,
      brokerDepartment,
      brokerValidityLimit,
      ecoOrganismeName,
      ecoOrganismeSiret,
      ...rest
    } = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        ...opt
      }
    });

    const expectedSkipped = [
      "createdAt",
      "updatedAt",
      "transporterNumberPlate",
      "readableId",
      "status",
      "emittedBy",
      "emittedAt",
      "emittedByEcoOrganisme",
      "takenOverBy",
      "takenOverAt",
      "sentAt",
      "sentBy",
      "isAccepted",
      "receivedAt",
      "quantityReceived",
      "quantityReceivedType",
      "processingOperationDone",
      "isDeleted",
      "receivedBy",
      "processedBy",
      "processedAt",
      "nextDestinationProcessingOperation",
      "processingOperationDescription",
      "noTraceability",
      "signedByTransporter",
      "customId",
      "wasteAcceptationStatus",
      "wasteRefusalReason",
      "nextDestinationCompanyName",
      "nextDestinationCompanySiret",
      "nextDestinationCompanyAddress",
      "nextDestinationCompanyContact",
      "nextDestinationCompanyPhone",
      "nextDestinationCompanyMail",
      "nextDestinationCompanyCountry",
      "nextDestinationCompanyVatNumber",
      "nextDestinationNotificationNumber",
      "transporterCustomInfo",
      "signedAt",
      "currentTransporterOrgId",
      "nextTransporterOrgId",
      "isImportedFromPaper",
      "signedBy",
      "ownerId",
      "forwardedInId",
      "recipientsSirets",
      "transportersSirets",
      "intermediariesSirets",
      "forwardedIn"
    ];

    // make sure this test breaks when a new field is added to the Form model
    // it will ensure we think of adding necessary fields to the duplicate input
    expect(Object.keys(rest).sort()).toEqual(expectedSkipped.sort());

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
      emitterType,
      emitterPickupSite,
      emitterIsPrivateIndividual,
      emitterIsForeignShip,
      emitterCompanyName,
      emitterCompanySiret,
      emitterCompanyAddress,
      emitterCompanyContact,
      emitterCompanyPhone,
      emitterCompanyMail,
      emitterCompanyOmiNumber,
      emitterWorkSiteName,
      emitterWorkSiteAddress,
      emitterWorkSiteCity,
      emitterWorkSitePostalCode,
      emitterWorkSiteInfos,
      recipientCap,
      recipientProcessingOperation,
      recipientCompanyName,
      recipientCompanySiret,
      recipientCompanyAddress,
      recipientCompanyContact,
      recipientCompanyPhone,
      recipientCompanyMail,
      recipientIsTempStorage,
      transporterCompanyName,
      transporterCompanySiret,
      transporterCompanyAddress,
      transporterCompanyContact,
      transporterCompanyPhone,
      transporterCompanyMail,
      transporterCompanyVatNumber,
      transporterReceipt,
      transporterDepartment,
      transporterValidityLimit,
      transporterTransportMode,
      transporterIsExemptedOfReceipt,
      wasteDetailsCode,
      wasteDetailsOnuCode,
      wasteDetailsPackagingInfos,
      wasteDetailsQuantity,
      wasteDetailsQuantityType,
      wasteDetailsPop,
      wasteDetailsIsDangerous,
      wasteDetailsParcelNumbers,
      wasteDetailsAnalysisReferences,
      wasteDetailsLandIdentifiers,
      wasteDetailsName,
      wasteDetailsConsistence,
      wasteDetailsSampleNumber,
      traderCompanyName,
      traderCompanySiret,
      traderCompanyAddress,
      traderCompanyContact,
      traderCompanyPhone,
      traderCompanyMail,
      traderReceipt,
      traderDepartment,
      traderValidityLimit,
      brokerCompanyName,
      brokerCompanySiret,
      brokerCompanyAddress,
      brokerCompanyContact,
      brokerCompanyPhone,
      brokerCompanyMail,
      brokerReceipt,
      brokerDepartment,
      brokerValidityLimit,
      ecoOrganismeName,
      ecoOrganismeSiret
    });
  });

  it("should duplicate the temporary storage detail", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formWithTempStorageFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: company.siret }
    });
    const {
      emitterType,
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
      wasteDetailsCode,
      wasteDetailsPackagingInfos,
      wasteDetailsOnuCode,
      wasteDetailsPop,
      wasteDetailsIsDangerous,
      wasteDetailsName,
      wasteDetailsConsistence,
      ...rest
    } = await prisma.form
      .findUniqueOrThrow({ where: { id: form.id } })
      .forwardedIn();

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "duplicateForm">>(
      DUPLICATE_FORM,
      {
        variables: {
          id: form.id
        }
      }
    );
    const duplicatedForm = await prisma.form.findUniqueOrThrow({
      where: { id: data.duplicateForm.id }
    });
    const duplicatedForwardedIn = await prisma.form
      .findUnique({
        where: {
          id: duplicatedForm.id
        }
      })
      .forwardedIn();

    expect(duplicatedForm.recipientIsTempStorage).toBe(true);
    expect(duplicatedForwardedIn).toMatchObject({
      readableId: `${duplicatedForm.readableId}-suite`,
      emitterType,
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
      wasteDetailsCode,
      wasteDetailsPackagingInfos,
      wasteDetailsOnuCode,
      wasteDetailsPop,
      wasteDetailsIsDangerous,
      wasteDetailsName,
      wasteDetailsConsistence,
      quantityReceived: null,
      wasteAcceptationStatus: null,
      wasteRefusalReason: null,
      receivedAt: null,
      receivedBy: null,
      signedAt: null,
      signedByTransporter: null,
      signedBy: null
    });

    const expectedSkipped = [
      "id",
      "createdAt",
      "updatedAt",
      "transporterNumberPlate",
      "readableId",
      "status",
      "recipientIsTempStorage",
      "emitterCompanyOmiNumber",
      "emitterIsForeignShip",
      "emitterIsPrivateIndividual",
      "emitterPickupSite",
      "emitterWorkSiteAddress",
      "emitterWorkSiteCity",
      "emitterWorkSiteInfos",
      "emitterWorkSiteName",
      "emitterWorkSitePostalCode",
      "traderCompanyAddress",
      "traderCompanyContact",
      "traderCompanyMail",
      "traderCompanyName",
      "traderCompanyPhone",
      "traderCompanySiret",
      "traderDepartment",
      "traderReceipt",
      "traderValidityLimit",
      "transporterCompanyAddress",
      "transporterCompanyContact",
      "transporterCompanyMail",
      "transporterCompanyName",
      "transporterCompanyPhone",
      "transporterCompanySiret",
      "transporterCompanyVatNumber",
      "transporterDepartment",
      "transporterIsExemptedOfReceipt",
      "transporterReceipt",
      "transporterTransportMode",
      "transporterValidityLimit",
      "wasteDetailsAnalysisReferences",
      "wasteDetailsLandIdentifiers",
      "wasteDetailsParcelNumbers",
      "wasteDetailsQuantity",
      "wasteDetailsQuantityType",
      "wasteDetailsSampleNumber",
      "emittedBy",
      "emittedAt",
      "emittedByEcoOrganisme",
      "takenOverBy",
      "takenOverAt",
      "sentAt",
      "sentBy",
      "isAccepted",
      "receivedAt",
      "quantityReceived",
      "quantityReceivedType",
      "processingOperationDone",
      "isDeleted",
      "receivedBy",
      "processedBy",
      "processedAt",
      "nextDestinationProcessingOperation",
      "processingOperationDescription",
      "noTraceability",
      "signedByTransporter",
      "customId",
      "wasteAcceptationStatus",
      "wasteRefusalReason",
      "nextDestinationCompanyName",
      "nextDestinationCompanySiret",
      "nextDestinationCompanyAddress",
      "nextDestinationCompanyContact",
      "nextDestinationCompanyPhone",
      "nextDestinationCompanyMail",
      "nextDestinationCompanyCountry",
      "nextDestinationCompanyVatNumber",
      "nextDestinationNotificationNumber",
      "transporterCustomInfo",
      "signedAt",
      "currentTransporterOrgId",
      "nextTransporterOrgId",
      "isImportedFromPaper",
      "signedBy",
      "ownerId",
      "forwardedInId",
      "recipientsSirets",
      "transportersSirets",
      "intermediariesSirets",
      "brokerCompanyAddress",
      "brokerCompanyContact",
      "brokerCompanyMail",
      "brokerCompanyName",
      "brokerCompanyPhone",
      "brokerCompanySiret",
      "brokerDepartment",
      "brokerReceipt",
      "brokerValidityLimit",
      "ecoOrganismeName",
      "ecoOrganismeSiret"
    ];

    // make sure this test breaks when a new field is added to the Form model
    // it will ensure we think of adding necessary fields to the duplicate forwardedIn input
    expect(Object.keys(rest).sort()).toEqual(expectedSkipped.sort());
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

  it("should not duplicate nextDestination info", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.MEMBER);
    const nextDestination = await companyFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        nextDestinationProcessingOperation: "R 2",
        nextDestinationCompanySiret: nextDestination.siret,
        nextDestinationCompanyName: nextDestination.name,
        nextDestinationCompanyAddress: nextDestination.address,
        nextDestinationCompanyContact: "John Snow",
        nextDestinationCompanyCountry: "FR",
        nextDestinationCompanyMail: "john.snow@trackdechets.fr",
        nextDestinationCompanyPhone: "00 00 00 00 00",
        nextDestinationCompanyVatNumber: "FRXX"
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
    const duplicatedForm = await prisma.form.findUniqueOrThrow({
      where: { id: data.duplicateForm.id }
    });
    expect(duplicatedForm.nextDestinationProcessingOperation).toBeNull();
    expect(duplicatedForm.nextDestinationCompanySiret).toBeNull();
    expect(duplicatedForm.nextDestinationCompanyName).toBeNull();
    expect(duplicatedForm.nextDestinationCompanyAddress).toBeNull();
    expect(duplicatedForm.nextDestinationCompanyContact).toBeNull();
    expect(duplicatedForm.nextDestinationCompanyCountry).toBeNull();
    expect(duplicatedForm.nextDestinationCompanyMail).toBeNull();
    expect(duplicatedForm.nextDestinationCompanyPhone).toBeNull();
    expect(duplicatedForm.nextDestinationCompanyVatNumber).toBeNull();
  });
});
