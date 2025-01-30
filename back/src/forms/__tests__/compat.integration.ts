import {
  bsddTransporterFactory,
  companyFactory,
  formFactory,
  formWithTempStorageFactory,
  userWithCompanyFactory
} from "../../__tests__/factories";
import { prisma } from "@td/prisma";
import { RegistryFormInclude } from "../../registry/elastic";
import { formToBsdd } from "../compat";
import { Decimal } from "@prisma/client/runtime/library";

describe("simpleFormToBsdd", () => {
  it("should convert a Form to a Bsdd", async () => {
    // Bsdd is a Form that has the same shape as other types of bsds (BSDA, BSDASRI, etc)
    // It is used as a compatibility data structure when we need homogeneus data (ex: to compute a cross bsds registry)

    const { user, company } = await userWithCompanyFactory("MEMBER");
    const transporter1 = await companyFactory();
    const transporter2 = await companyFactory();
    const transporter3 = await companyFactory();
    const transporter4 = await companyFactory();
    const transporter5 = await companyFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        transporters: {
          create: { number: 1, transporterCompanySiret: transporter1.siret }
        }
      }
    });

    await bsddTransporterFactory({
      formId: form.id,
      opts: { transporterCompanySiret: transporter2.siret }
    });
    await bsddTransporterFactory({
      formId: form.id,
      opts: { transporterCompanySiret: transporter3.siret }
    });
    await bsddTransporterFactory({
      formId: form.id,
      opts: { transporterCompanySiret: transporter4.siret }
    });
    await bsddTransporterFactory({
      formId: form.id,
      opts: { transporterCompanySiret: transporter5.siret }
    });

    const fullForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: RegistryFormInclude
    });

    const bsdd = formToBsdd(fullForm);
    expect(bsdd).toEqual({
      id: form.readableId,
      customId: form.customId,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
      isDeleted: form.isDeleted,
      isDraft: false,
      status: form.status,
      wasteCode: form.wasteDetailsCode,
      wasteIsDangerous: true,
      wasteDetailsLandIdentifiers: form.wasteDetailsLandIdentifiers,
      wasteDescription: form.wasteDetailsName,
      pop: false,
      traderCompanyName: form.traderCompanyName,
      traderCompanySiret: form.traderCompanySiret,
      traderCompanyAddress: form.traderCompanyAddress,
      traderCompanyContact: form.traderCompanyContact,
      traderCompanyPhone: form.traderCompanyPhone,
      traderCompanyMail: form.traderCompanyMail,
      traderRecepisseNumber: form.traderReceipt,
      traderRecepisseDepartment: form.traderDepartment,
      traderRecepisseValidityLimit: form.traderValidityLimit,
      brokerCompanyName: form.brokerCompanyName,
      brokerCompanySiret: form.brokerCompanySiret,
      brokerCompanyAddress: form.brokerCompanyAddress,
      brokerCompanyContact: form.brokerCompanyContact,
      brokerCompanyPhone: form.brokerCompanyPhone,
      brokerCompanyMail: form.brokerCompanyMail,
      brokerRecepisseNumber: form.brokerReceipt,
      brokerRecepisseDepartment: form.brokerReceipt,
      brokerRecepisseValidityLimit: form.brokerReceipt,
      ecoOrganismeName: form.ecoOrganismeName,
      ecoOrganismeSiret: form.ecoOrganismeSiret,
      emitterCompanyName: form.emitterCompanyName,
      emitterCompanySiret: form.emitterCompanySiret,
      emitterCompanyAddress: form.emitterCompanyAddress,
      emitterCompanyContact: form.emitterCompanyContact,
      emitterCompanyPhone: form.emitterCompanyPhone,
      emitterCompanyMail: form.emitterCompanyMail,
      emitterCustomInfo: null,
      emitterPickupSiteName: form.emitterWorkSiteName,
      emitterPickupSiteAddress: form.emitterWorkSiteAddress,
      emitterPickupSiteCity: form.emitterWorkSiteCity,
      emitterPickupSitePostalCode: form.emitterWorkSitePostalCode,
      emitterType: "PRODUCER",
      emitterPickupSiteInfos: form.emitterWorkSiteInfos,
      emitterEmissionSignatureAuthor: form.sentBy,
      emitterEmissionSignatureDate: form.sentAt,
      packagings: form.wasteDetailsPackagingInfos,
      weightValue: form.wasteDetailsQuantity?.toNumber(),
      wasteAdr: form.wasteDetailsOnuCode,
      nonRoadRegulationMention: form.wasteDetailsNonRoadRegulationMention,
      weightIsEstimate: true,
      transporterCompanyName: fullForm.transporters[0].transporterCompanyName,
      transporterCompanySiret: fullForm.transporters[0].transporterCompanySiret,
      transporterCompanyVatNumber:
        fullForm.transporters[0].transporterCompanyVatNumber,
      transporterCompanyAddress:
        fullForm.transporters[0].transporterCompanyAddress,
      transporterCompanyContact:
        fullForm.transporters[0].transporterCompanyContact,
      transporterCompanyPhone: fullForm.transporters[0].transporterCompanyPhone,
      transporterCompanyMail: fullForm.transporters[0].transporterCompanyMail,
      transporterCustomInfo: null,
      transporterRecepisseIsExempted:
        fullForm.transporters[0].transporterIsExemptedOfReceipt,
      transporterRecepisseNumber: fullForm.transporters[0].transporterReceipt,
      transporterRecepisseDepartment:
        fullForm.transporters[0].transporterDepartment,
      transporterRecepisseValidityLimit:
        fullForm.transporters[0].transporterValidityLimit,
      transporterTransportMode:
        fullForm.transporters[0].transporterTransportMode,
      transporterTransportTakenOverAt: form.sentAt,
      transporterTransportSignatureAuthor: null,
      transporterTransportSignatureDate: form.sentAt,
      transporterNumberPlates: [
        fullForm.transporters[0].transporterNumberPlate
      ],

      transporter2CompanyName: fullForm.transporters[1].transporterCompanyName,
      transporter2CompanySiret:
        fullForm.transporters[1].transporterCompanySiret,
      transporter2CompanyVatNumber:
        fullForm.transporters[1].transporterCompanyVatNumber,
      transporter2CompanyAddress:
        fullForm.transporters[1].transporterCompanyAddress,
      transporter2CompanyContact:
        fullForm.transporters[1].transporterCompanyContact,
      transporter2CompanyPhone:
        fullForm.transporters[1].transporterCompanyPhone,
      transporter2CompanyMail: fullForm.transporters[1].transporterCompanyMail,
      transporter2CustomInfo: null,
      transporter2RecepisseIsExempted:
        fullForm.transporters[1].transporterIsExemptedOfReceipt,
      transporter2RecepisseNumber: fullForm.transporters[1].transporterReceipt,
      transporter2RecepisseDepartment:
        fullForm.transporters[1].transporterDepartment,
      transporter2RecepisseValidityLimit:
        fullForm.transporters[1].transporterValidityLimit,
      transporter2TransportMode:
        fullForm.transporters[1].transporterTransportMode,
      transporter2TransportTakenOverAt: fullForm.transporters[1].takenOverAt,
      transporter2TransportSignatureAuthor:
        fullForm.transporters[1].takenOverBy,
      transporter2TransportSignatureDate: fullForm.transporters[1].takenOverAt,
      transporter2NumberPlates: [
        fullForm.transporters[1].transporterNumberPlate
      ],

      transporter3CompanyName: fullForm.transporters[2].transporterCompanyName,
      transporter3CompanySiret:
        fullForm.transporters[2].transporterCompanySiret,
      transporter3CompanyVatNumber:
        fullForm.transporters[2].transporterCompanyVatNumber,
      transporter3CompanyAddress:
        fullForm.transporters[2].transporterCompanyAddress,
      transporter3CompanyContact:
        fullForm.transporters[2].transporterCompanyContact,
      transporter3CompanyPhone:
        fullForm.transporters[2].transporterCompanyPhone,
      transporter3CompanyMail: fullForm.transporters[2].transporterCompanyMail,
      transporter3CustomInfo: null,
      transporter3RecepisseIsExempted:
        fullForm.transporters[2].transporterIsExemptedOfReceipt,
      transporter3RecepisseNumber: fullForm.transporters[2].transporterReceipt,
      transporter3RecepisseDepartment:
        fullForm.transporters[2].transporterDepartment,
      transporter3RecepisseValidityLimit:
        fullForm.transporters[2].transporterValidityLimit,
      transporter3TransportMode:
        fullForm.transporters[2].transporterTransportMode,
      transporter3TransportTakenOverAt: fullForm.transporters[2].takenOverAt,
      transporter3TransportSignatureAuthor:
        fullForm.transporters[2].takenOverBy,
      transporter3TransportSignatureDate: fullForm.transporters[2].takenOverAt,
      transporter3NumberPlates: [
        fullForm.transporters[2].transporterNumberPlate
      ],

      transporter4CompanyName: fullForm.transporters[3].transporterCompanyName,
      transporter4CompanySiret:
        fullForm.transporters[3].transporterCompanySiret,
      transporter4CompanyVatNumber:
        fullForm.transporters[3].transporterCompanyVatNumber,
      transporter4CompanyAddress:
        fullForm.transporters[3].transporterCompanyAddress,
      transporter4CompanyContact:
        fullForm.transporters[3].transporterCompanyContact,
      transporter4CompanyPhone:
        fullForm.transporters[3].transporterCompanyPhone,
      transporter4CompanyMail: fullForm.transporters[3].transporterCompanyMail,
      transporter4CustomInfo: null,
      transporter4RecepisseIsExempted:
        fullForm.transporters[3].transporterIsExemptedOfReceipt,
      transporter4RecepisseNumber: fullForm.transporters[3].transporterReceipt,
      transporter4RecepisseDepartment:
        fullForm.transporters[3].transporterDepartment,
      transporter4RecepisseValidityLimit:
        fullForm.transporters[3].transporterValidityLimit,
      transporter4TransportMode:
        fullForm.transporters[3].transporterTransportMode,
      transporter4TransportTakenOverAt: fullForm.transporters[3].takenOverAt,
      transporter4TransportSignatureAuthor:
        fullForm.transporters[3].takenOverBy,
      transporter4TransportSignatureDate: fullForm.transporters[3].takenOverAt,
      transporter4NumberPlates: [
        fullForm.transporters[3].transporterNumberPlate
      ],

      transporter5CompanyName: fullForm.transporters[4].transporterCompanyName,
      transporter5CompanySiret:
        fullForm.transporters[4].transporterCompanySiret,
      transporter5CompanyVatNumber:
        fullForm.transporters[4].transporterCompanyVatNumber,
      transporter5CompanyAddress:
        fullForm.transporters[4].transporterCompanyAddress,
      transporter5CompanyContact:
        fullForm.transporters[4].transporterCompanyContact,
      transporter5CompanyPhone:
        fullForm.transporters[4].transporterCompanyPhone,
      transporter5CompanyMail: fullForm.transporters[4].transporterCompanyMail,
      transporter5CustomInfo: null,
      transporter5RecepisseIsExempted:
        fullForm.transporters[4].transporterIsExemptedOfReceipt,
      transporter5RecepisseNumber: fullForm.transporters[4].transporterReceipt,
      transporter5RecepisseDepartment:
        fullForm.transporters[4].transporterDepartment,
      transporter5RecepisseValidityLimit:
        fullForm.transporters[4].transporterValidityLimit,
      transporter5TransportMode:
        fullForm.transporters[4].transporterTransportMode,
      transporter5TransportTakenOverAt: fullForm.transporters[4].takenOverAt,
      transporter5TransportSignatureAuthor:
        fullForm.transporters[4].takenOverBy,
      transporter5TransportSignatureDate: fullForm.transporters[4].takenOverAt,
      transporter5NumberPlates: [
        fullForm.transporters[4].transporterNumberPlate
      ],

      destinationCompanyName: form.recipientCompanyName,
      destinationCompanySiret: form.recipientCompanySiret,
      destinationCompanyAddress: form.recipientCompanyAddress,
      destinationCompanyContact: form.recipientCompanyContact,
      destinationCompanyPhone: form.recipientCompanyPhone,
      destinationCompanyMail: form.recipientCompanyMail,
      destinationCustomInfo: null,
      destinationReceptionDate: null,
      destinationReceptionWeight: null,
      destinationReceptionAcceptedWeight: null,
      destinationReceptionRefusedWeight: null,
      destinationReceptionAcceptationStatus: null,
      destinationReceptionRefusalReason: null,
      destinationReceptionSignatureAuthor: null,
      destinationReceptionSignatureDate: null,
      destinationPlannedOperationCode: form.recipientProcessingOperation,
      destinationOperationCode: null,
      destinationOperationMode: null,
      destinationOperationSignatureAuthor: null,
      destinationOperationDate: null,
      destinationOperationSignatureDate: null,
      destinationCap: form.recipientCap,
      destinationOperationNoTraceability: null,
      destinationOperationNextDestinationCompanyName: null,
      destinationOperationNextDestinationCompanySiret: null,
      destinationOperationNextDestinationCompanyVatNumber: null,
      destinationOperationNextDestinationCompanyAddress: null,
      destinationOperationNextDestinationCompanyContact: null,
      destinationOperationNextDestinationCompanyPhone: null,
      destinationOperationNextDestinationCompanyMail: null,
      forwardedInId: null,
      forwarding: null,
      grouping: [],
      finalOperations: [],
      nextDestinationNotificationNumber: null,
      nextDestinationProcessingOperation: null,
      intermediaries: [],
      forwardedIn: null,
      parcelCities: null,
      parcelCoordinates: null,
      parcelNumbers: null,
      parcelPostalCodes: null,
      destinationHasCiterneBeenWashedOut: form.hasCiterneBeenWashedOut,
      destinationCiterneNotWashedOutReason: form.citerneNotWashedOutReason
    });
  });

  it("should convert a Form without transporter to a Bsdd", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        sentAt: null,
        takenOverAt: null,
        sentBy: null,
        takenOverBy: null
      }
    });
    // delete existing transporters
    await prisma.form.update({
      where: { id: form.id },
      data: { transporters: { deleteMany: {} } }
    });
    const fullForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: RegistryFormInclude
    });
    const bsdd = formToBsdd(fullForm);
    expect(bsdd).toMatchObject({
      transporterCompanyName: undefined,
      transporterCompanySiret: undefined,
      transporterCompanyVatNumber: undefined,
      transporterCompanyAddress: undefined,
      transporterCompanyContact: undefined,
      transporterCompanyPhone: undefined,
      transporterCompanyMail: undefined,
      transporterCustomInfo: undefined,
      transporterRecepisseIsExempted: undefined,
      transporterRecepisseNumber: undefined,
      transporterRecepisseDepartment: undefined,
      transporterRecepisseValidityLimit: undefined,
      transporterTransportMode: undefined,
      transporterTransportTakenOverAt: null,
      transporterTransportSignatureAuthor: null,
      transporterTransportSignatureDate: null,
      transporterNumberPlates: []
    });
  });

  it("should convert a Form with several transporters to a Bsdd", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const transporter1 = await companyFactory();
    const transporter2 = await companyFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        transporters: {
          create: { transporterCompanySiret: transporter1.siret, number: 1 }
        }
      }
    });

    await prisma.form.update({
      where: { id: form.id },
      data: {
        transporters: {
          create: { transporterCompanySiret: transporter2.siret, number: 2 }
        }
      }
    });

    const fullForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: RegistryFormInclude
    });

    const bsdd = formToBsdd(fullForm);

    // check transporters are returned in the right order
    expect(bsdd.transporterCompanySiret).toEqual(transporter1.siret);
    expect(bsdd.transporter2CompanySiret).toEqual(transporter2.siret);
  });

  it("should convert a Form with waste parcel infos to a Bsdd", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        wasteDetailsParcelNumbers: [
          {
            city: "Orléans",
            postalCode: "45100",
            prefix: "000",
            section: "EW",
            number: "8"
          },
          {
            city: "Olivet",
            postalCode: "45160",
            x: 47.853807,
            y: 1.895882
          }
        ]
      }
    });

    const fullForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: RegistryFormInclude
    });

    const bsdd = formToBsdd(fullForm);

    // check transporters are returned in the right order
    expect(bsdd.parcelCities).toEqual(
      expect.arrayContaining(["Orléans", "Olivet"])
    );
    expect(bsdd.parcelPostalCodes).toEqual(
      expect.arrayContaining(["45100", "45160"])
    );
    expect(bsdd.parcelNumbers).toEqual(
      expect.arrayContaining(["000-EW-8", null])
    );
    expect(bsdd.parcelCoordinates).toEqual(
      expect.arrayContaining([null, "N 47.853807 E 1.895882"])
    );
  });

  it("should convert a forwarding Form to a Bsdd", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formWithTempStorageFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: company.siret }
    });
    const fullForwardedInForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.forwardedInId! },
      include: {
        ...RegistryFormInclude
      }
    });

    const fullForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: { transporters: true }
    });

    const bsdd = formToBsdd(fullForwardedInForm);
    expect(bsdd).toEqual({
      id: fullForwardedInForm.readableId,
      customId: fullForwardedInForm.customId,
      createdAt: fullForwardedInForm.createdAt,
      updatedAt: fullForwardedInForm.updatedAt,
      isDeleted: fullForwardedInForm.isDeleted,
      isDraft: fullForwardedInForm.status === "DRAFT",
      nextDestinationNotificationNumber: null,
      nextDestinationProcessingOperation: null,
      status: fullForwardedInForm.status,
      wasteCode: fullForwardedInForm.wasteDetailsCode,
      wasteIsDangerous: true,
      wasteDetailsLandIdentifiers: form.wasteDetailsLandIdentifiers,
      wasteDescription: fullForwardedInForm.wasteDetailsName,
      pop: false,
      traderCompanyName: fullForwardedInForm.traderCompanyName,
      traderCompanySiret: fullForwardedInForm.traderCompanySiret,
      traderCompanyAddress: fullForwardedInForm.traderCompanyAddress,
      traderCompanyContact: fullForwardedInForm.traderCompanyContact,
      traderCompanyPhone: fullForwardedInForm.traderCompanyPhone,
      traderCompanyMail: fullForwardedInForm.traderCompanyMail,
      traderRecepisseNumber: fullForwardedInForm.traderReceipt,
      traderRecepisseDepartment: fullForwardedInForm.traderDepartment,
      traderRecepisseValidityLimit: fullForwardedInForm.traderValidityLimit,
      brokerCompanyName: fullForwardedInForm.brokerCompanyName,
      brokerCompanySiret: fullForwardedInForm.brokerCompanySiret,
      brokerCompanyAddress: fullForwardedInForm.brokerCompanyAddress,
      brokerCompanyContact: fullForwardedInForm.brokerCompanyContact,
      brokerCompanyPhone: fullForwardedInForm.brokerCompanyPhone,
      brokerCompanyMail: fullForwardedInForm.brokerCompanyMail,
      brokerRecepisseNumber: fullForwardedInForm.brokerReceipt,
      brokerRecepisseDepartment: fullForwardedInForm.brokerReceipt,
      brokerRecepisseValidityLimit: fullForwardedInForm.brokerReceipt,
      ecoOrganismeName: fullForwardedInForm.ecoOrganismeName,
      ecoOrganismeSiret: fullForwardedInForm.ecoOrganismeSiret,
      emitterCompanyName: fullForwardedInForm.emitterCompanyName,
      emitterCompanySiret: fullForwardedInForm.emitterCompanySiret,
      emitterCompanyAddress: fullForwardedInForm.emitterCompanyAddress,
      emitterCompanyContact: fullForwardedInForm.emitterCompanyContact,
      emitterCompanyPhone: fullForwardedInForm.emitterCompanyPhone,
      emitterCompanyMail: fullForwardedInForm.emitterCompanyMail,
      emitterCustomInfo: null,
      emitterPickupSiteName: fullForwardedInForm.emitterWorkSiteName,
      emitterPickupSiteAddress: fullForwardedInForm.emitterWorkSiteAddress,
      emitterPickupSiteCity: fullForwardedInForm.emitterWorkSiteCity,
      emitterPickupSitePostalCode:
        fullForwardedInForm.emitterWorkSitePostalCode,
      emitterType: null,
      emitterPickupSiteInfos: fullForwardedInForm.emitterWorkSiteInfos,
      emitterEmissionSignatureAuthor: fullForwardedInForm.sentBy,
      emitterEmissionSignatureDate: fullForwardedInForm.sentAt,
      packagings: fullForwardedInForm.wasteDetailsPackagingInfos,
      weightValue: fullForwardedInForm.wasteDetailsQuantity?.toNumber(),
      wasteAdr: fullForwardedInForm.wasteDetailsOnuCode,
      nonRoadRegulationMention:
        fullForwardedInForm.wasteDetailsNonRoadRegulationMention,
      weightIsEstimate: true,
      transporterCompanyName:
        fullForwardedInForm.transporters[0].transporterCompanyName,
      transporterCompanySiret:
        fullForwardedInForm.transporters[0].transporterCompanySiret,
      transporterCompanyVatNumber:
        fullForwardedInForm.transporters[0].transporterCompanyVatNumber,
      transporterCompanyAddress:
        fullForwardedInForm.transporters[0].transporterCompanyAddress,
      transporterCompanyContact:
        fullForwardedInForm.transporters[0].transporterCompanyContact,
      transporterCompanyPhone:
        fullForwardedInForm.transporters[0].transporterCompanyPhone,
      transporterCompanyMail:
        fullForwardedInForm.transporters[0].transporterCompanyMail,
      transporterCustomInfo: null,
      transporterRecepisseIsExempted:
        fullForwardedInForm.transporters[0].transporterIsExemptedOfReceipt,
      transporterRecepisseNumber:
        fullForwardedInForm.transporters[0].transporterReceipt,
      transporterRecepisseDepartment:
        fullForwardedInForm.transporters[0].transporterDepartment,
      transporterRecepisseValidityLimit:
        fullForwardedInForm.transporters[0].transporterValidityLimit,
      transporterTransportMode:
        fullForwardedInForm.transporters[0].transporterTransportMode,
      transporterTransportTakenOverAt: fullForwardedInForm.sentAt,
      transporterTransportSignatureAuthor: fullForwardedInForm.sentBy,
      transporterTransportSignatureDate: fullForwardedInForm.sentAt,
      transporterNumberPlates: [
        fullForwardedInForm.transporters[0].transporterNumberPlate
      ],
      transporter2CompanyName: undefined,
      transporter2CompanySiret: undefined,
      transporter2CompanyVatNumber: undefined,
      transporter2CompanyAddress: undefined,
      transporter2CompanyContact: undefined,
      transporter2CompanyPhone: undefined,
      transporter2CompanyMail: undefined,
      transporter2CustomInfo: undefined,
      transporter2RecepisseIsExempted: undefined,
      transporter2RecepisseNumber: undefined,
      transporter2RecepisseDepartment: undefined,
      transporter2RecepisseValidityLimit: undefined,
      transporter2TransportMode: undefined,
      transporter2TransportTakenOverAt: undefined,
      transporter2TransportSignatureAuthor: undefined,
      transporter2TransportSignatureDate: undefined,
      transporter2NumberPlates: [],
      transporter3CompanyName: undefined,
      transporter3CompanySiret: undefined,
      transporter3CompanyVatNumber: undefined,
      transporter3CompanyAddress: undefined,
      transporter3CompanyContact: undefined,
      transporter3CompanyPhone: undefined,
      transporter3CompanyMail: undefined,
      transporter3CustomInfo: undefined,
      transporter3RecepisseIsExempted: undefined,
      transporter3RecepisseNumber: undefined,
      transporter3RecepisseDepartment: undefined,
      transporter3RecepisseValidityLimit: undefined,
      transporter3TransportMode: undefined,
      transporter3TransportTakenOverAt: undefined,
      transporter3TransportSignatureAuthor: undefined,
      transporter3TransportSignatureDate: undefined,
      transporter3NumberPlates: [],
      transporter4CompanyName: undefined,
      transporter4CompanySiret: undefined,
      transporter4CompanyVatNumber: undefined,
      transporter4CompanyAddress: undefined,
      transporter4CompanyContact: undefined,
      transporter4CompanyPhone: undefined,
      transporter4CompanyMail: undefined,
      transporter4CustomInfo: undefined,
      transporter4RecepisseIsExempted: undefined,
      transporter4RecepisseNumber: undefined,
      transporter4RecepisseDepartment: undefined,
      transporter4RecepisseValidityLimit: undefined,
      transporter4TransportMode: undefined,
      transporter4TransportTakenOverAt: undefined,
      transporter4TransportSignatureAuthor: undefined,
      transporter4TransportSignatureDate: undefined,
      transporter4NumberPlates: [],
      transporter5CompanyName: undefined,
      transporter5CompanySiret: undefined,
      transporter5CompanyVatNumber: undefined,
      transporter5CompanyAddress: undefined,
      transporter5CompanyContact: undefined,
      transporter5CompanyPhone: undefined,
      transporter5CompanyMail: undefined,
      transporter5CustomInfo: undefined,
      transporter5RecepisseIsExempted: undefined,
      transporter5RecepisseNumber: undefined,
      transporter5RecepisseDepartment: undefined,
      transporter5RecepisseValidityLimit: undefined,
      transporter5TransportMode: undefined,
      transporter5TransportTakenOverAt: undefined,
      transporter5TransportSignatureAuthor: undefined,
      transporter5TransportSignatureDate: undefined,
      transporter5NumberPlates: [],
      destinationCompanyName: fullForwardedInForm.recipientCompanyName,
      destinationCompanySiret: fullForwardedInForm.recipientCompanySiret,
      destinationCompanyAddress: fullForwardedInForm.recipientCompanyAddress,
      destinationCompanyContact: fullForwardedInForm.recipientCompanyContact,
      destinationCompanyPhone: fullForwardedInForm.recipientCompanyPhone,
      destinationCompanyMail: fullForwardedInForm.recipientCompanyMail,
      destinationCustomInfo: null,
      destinationReceptionDate: fullForwardedInForm.receivedAt,
      destinationReceptionWeight:
        fullForwardedInForm.quantityReceived?.toNumber(),
      destinationReceptionAcceptedWeight: null,
      destinationReceptionRefusedWeight: null,
      destinationReceptionAcceptationStatus:
        fullForwardedInForm.wasteAcceptationStatus,
      destinationReceptionRefusalReason: null,
      destinationReceptionSignatureAuthor: fullForwardedInForm.receivedBy,
      destinationReceptionSignatureDate: fullForwardedInForm.receivedAt,
      destinationPlannedOperationCode:
        fullForwardedInForm.recipientProcessingOperation,
      destinationOperationCode: null,
      destinationOperationMode: null,
      destinationOperationSignatureAuthor: null,
      destinationOperationDate: null,
      destinationOperationSignatureDate: null,
      destinationCap: fullForwardedInForm.recipientCap,
      destinationOperationNoTraceability: null,
      destinationOperationNextDestinationCompanyName: null,
      destinationOperationNextDestinationCompanySiret: null,
      destinationOperationNextDestinationCompanyVatNumber: null,
      destinationOperationNextDestinationCompanyAddress: null,
      destinationOperationNextDestinationCompanyContact: null,
      destinationOperationNextDestinationCompanyPhone: null,
      destinationOperationNextDestinationCompanyMail: null,
      destinationHasCiterneBeenWashedOut: form.hasCiterneBeenWashedOut,
      destinationCiterneNotWashedOutReason: form.citerneNotWashedOutReason,
      grouping: [],
      intermediaries: [],
      finalOperations: [],
      forwardedIn: null,
      parcelCities: null,
      parcelCoordinates: null,
      parcelNumbers: null,
      parcelPostalCodes: null,
      forwardedInId: null,
      forwarding: {
        id: form.readableId,
        customId: form.customId,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
        isDeleted: form.isDeleted,
        isDraft: form.status === "DRAFT",
        status: form.status,
        wasteCode: form.wasteDetailsCode,
        wasteIsDangerous: true,
        wasteDescription: form.wasteDetailsName,
        pop: false,
        traderCompanyName: form.traderCompanyName,
        traderCompanySiret: form.traderCompanySiret,
        traderCompanyAddress: form.traderCompanyAddress,
        traderCompanyContact: form.traderCompanyContact,
        traderCompanyPhone: form.traderCompanyPhone,
        traderCompanyMail: form.traderCompanyMail,
        traderRecepisseNumber: form.traderReceipt,
        traderRecepisseDepartment: form.traderDepartment,
        traderRecepisseValidityLimit: form.traderValidityLimit,
        brokerCompanyName: form.brokerCompanyName,
        brokerCompanySiret: form.brokerCompanySiret,
        brokerCompanyAddress: form.brokerCompanyAddress,
        brokerCompanyContact: form.brokerCompanyContact,
        brokerCompanyPhone: form.brokerCompanyPhone,
        brokerCompanyMail: form.brokerCompanyMail,
        brokerRecepisseNumber: form.brokerReceipt,
        brokerRecepisseDepartment: form.brokerReceipt,
        brokerRecepisseValidityLimit: form.brokerReceipt,
        ecoOrganismeName: form.ecoOrganismeName,
        ecoOrganismeSiret: form.ecoOrganismeSiret,
        emitterCompanyName: form.emitterCompanyName,
        emitterCompanySiret: form.emitterCompanySiret,
        emitterCompanyAddress: form.emitterCompanyAddress,
        emitterCompanyContact: form.emitterCompanyContact,
        emitterCompanyPhone: form.emitterCompanyPhone,
        emitterCompanyMail: form.emitterCompanyMail,
        emitterCustomInfo: null,
        emitterPickupSiteName: form.emitterWorkSiteName,
        emitterPickupSiteAddress: form.emitterWorkSiteAddress,
        emitterPickupSiteCity: form.emitterWorkSiteCity,
        emitterPickupSitePostalCode: form.emitterWorkSitePostalCode,
        emitterType: "PRODUCER",
        emitterPickupSiteInfos: form.emitterWorkSiteInfos,
        emitterEmissionSignatureAuthor: form.sentBy,
        emitterEmissionSignatureDate: form.sentAt,
        packagings: form.wasteDetailsPackagingInfos,
        weightValue: form.wasteDetailsQuantity?.toNumber(),
        wasteAdr: form.wasteDetailsOnuCode,
        nonRoadRegulationMention: form.wasteDetailsNonRoadRegulationMention,
        weightIsEstimate: true,
        transporterCompanyName: fullForm.transporters[0].transporterCompanyName,
        transporterCompanySiret:
          fullForm.transporters[0].transporterCompanySiret,
        transporterCompanyVatNumber:
          fullForm.transporters[0].transporterCompanyVatNumber,
        transporterCompanyAddress:
          fullForm.transporters[0].transporterCompanyAddress,
        transporterCompanyContact:
          fullForm.transporters[0].transporterCompanyContact,
        transporterCompanyPhone:
          fullForm.transporters[0].transporterCompanyPhone,
        transporterCompanyMail: fullForm.transporters[0].transporterCompanyMail,
        transporterCustomInfo: null,
        transporterRecepisseIsExempted:
          fullForm.transporters[0].transporterIsExemptedOfReceipt,
        transporterRecepisseNumber: fullForm.transporters[0].transporterReceipt,
        transporterRecepisseDepartment:
          fullForm.transporters[0].transporterDepartment,
        transporterRecepisseValidityLimit:
          fullForm.transporters[0].transporterValidityLimit,
        transporterTransportMode:
          fullForm.transporters[0].transporterTransportMode,
        transporterTransportTakenOverAt: form.sentAt,
        transporterTransportSignatureAuthor: null,
        transporterTransportSignatureDate: form.sentAt,
        transporterNumberPlates: [
          fullForm.transporters[0].transporterNumberPlate
        ],
        transporter2CompanyName: undefined,
        transporter2CompanySiret: undefined,
        transporter2CompanyVatNumber: undefined,
        transporter2CompanyAddress: undefined,
        transporter2CompanyContact: undefined,
        transporter2CompanyPhone: undefined,
        transporter2CompanyMail: undefined,
        transporter2CustomInfo: undefined,
        transporter2RecepisseIsExempted: undefined,
        transporter2RecepisseNumber: undefined,
        transporter2RecepisseDepartment: undefined,
        transporter2RecepisseValidityLimit: undefined,
        transporter2TransportMode: undefined,
        transporter2TransportTakenOverAt: undefined,
        transporter2TransportSignatureAuthor: undefined,
        transporter2TransportSignatureDate: undefined,
        transporter2NumberPlates: [],
        transporter3CompanyName: undefined,
        transporter3CompanySiret: undefined,
        transporter3CompanyVatNumber: undefined,
        transporter3CompanyAddress: undefined,
        transporter3CompanyContact: undefined,
        transporter3CompanyPhone: undefined,
        transporter3CompanyMail: undefined,
        transporter3CustomInfo: undefined,
        transporter3RecepisseIsExempted: undefined,
        transporter3RecepisseNumber: undefined,
        transporter3RecepisseDepartment: undefined,
        transporter3RecepisseValidityLimit: undefined,
        transporter3TransportMode: undefined,
        transporter3TransportTakenOverAt: undefined,
        transporter3TransportSignatureAuthor: undefined,
        transporter3TransportSignatureDate: undefined,
        transporter3NumberPlates: [],
        transporter4CompanyName: undefined,
        transporter4CompanySiret: undefined,
        transporter4CompanyVatNumber: undefined,
        transporter4CompanyAddress: undefined,
        transporter4CompanyContact: undefined,
        transporter4CompanyPhone: undefined,
        transporter4CompanyMail: undefined,
        transporter4CustomInfo: undefined,
        transporter4RecepisseIsExempted: undefined,
        transporter4RecepisseNumber: undefined,
        transporter4RecepisseDepartment: undefined,
        transporter4RecepisseValidityLimit: undefined,
        transporter4TransportMode: undefined,
        transporter4TransportTakenOverAt: undefined,
        transporter4TransportSignatureAuthor: undefined,
        transporter4TransportSignatureDate: undefined,
        transporter4NumberPlates: [],

        transporter5CompanyName: undefined,
        transporter5CompanySiret: undefined,
        transporter5CompanyVatNumber: undefined,
        transporter5CompanyAddress: undefined,
        transporter5CompanyContact: undefined,
        transporter5CompanyPhone: undefined,
        transporter5CompanyMail: undefined,
        transporter5CustomInfo: undefined,
        transporter5RecepisseIsExempted: undefined,
        transporter5RecepisseNumber: undefined,
        transporter5RecepisseDepartment: undefined,
        transporter5RecepisseValidityLimit: undefined,
        transporter5TransportMode: undefined,
        transporter5TransportTakenOverAt: undefined,
        transporter5TransportSignatureAuthor: undefined,
        transporter5TransportSignatureDate: undefined,
        transporter5NumberPlates: [],
        destinationCompanyName: form.recipientCompanyName,
        destinationCompanySiret: form.recipientCompanySiret,
        destinationCompanyAddress: form.recipientCompanyAddress,
        destinationCompanyContact: form.recipientCompanyContact,
        destinationCompanyPhone: form.recipientCompanyPhone,
        destinationCompanyMail: form.recipientCompanyMail,
        destinationCustomInfo: null,
        destinationReceptionDate: form.receivedAt,
        destinationReceptionWeight: form.quantityReceived,
        destinationReceptionAcceptedWeight: null,
        destinationReceptionRefusedWeight: null,
        destinationReceptionAcceptationStatus: form.wasteAcceptationStatus,
        destinationReceptionRefusalReason: null,
        destinationReceptionSignatureAuthor: form.receivedBy,
        destinationReceptionSignatureDate: form.receivedAt,
        destinationPlannedOperationCode: form.recipientProcessingOperation,
        destinationOperationCode: null,
        destinationOperationMode: null,
        destinationOperationSignatureAuthor: null,
        destinationOperationDate: null,
        destinationOperationSignatureDate: null,
        destinationCap: form.recipientCap,
        destinationOperationNoTraceability: null,
        destinationOperationNextDestinationCompanyName: null,
        destinationOperationNextDestinationCompanySiret: null,
        destinationOperationNextDestinationCompanyVatNumber: null,
        destinationOperationNextDestinationCompanyAddress: null,
        destinationOperationNextDestinationCompanyContact: null,
        destinationOperationNextDestinationCompanyPhone: null,
        destinationOperationNextDestinationCompanyMail: null,
        parcelCities: null,
        parcelCoordinates: null,
        parcelNumbers: null,
        parcelPostalCodes: null,
        forwardedInId: fullForwardedInForm.id,
        nextDestinationNotificationNumber: null,
        nextDestinationProcessingOperation: null,
        grouping: [],
        destinationHasCiterneBeenWashedOut: form.hasCiterneBeenWashedOut,
        destinationCiterneNotWashedOutReason: form.citerneNotWashedOutReason
      }
    });
  });

  it("should compute quantityAccepted & quantityRefused (destinationReceptionAcceptedWeight & destinationReceptionRefusedWeight)", async () => {
    // Given
    const { user } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        wasteAcceptationStatus: "PARTIALLY_REFUSED",
        quantityReceived: new Decimal(10),
        quantityRefused: new Decimal(3)
      }
    });

    // When
    const fullForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: RegistryFormInclude
    });

    const bsdd = formToBsdd(fullForm);

    // Then
    expect(bsdd.destinationReceptionWeight).toEqual(10);
    expect(bsdd.destinationReceptionAcceptedWeight).toEqual(7);
    expect(bsdd.destinationReceptionRefusedWeight).toEqual(3);
  });

  it("should return destinationReceptionAcceptedWeight = 0", async () => {
    // Given
    const { user } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        wasteAcceptationStatus: "REFUSED",
        quantityReceived: new Decimal(10),
        quantityRefused: new Decimal(10)
      }
    });

    // When
    const fullForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: RegistryFormInclude
    });

    const bsdd = formToBsdd(fullForm);

    // Then
    expect(bsdd.destinationReceptionWeight).toEqual(10);
    expect(bsdd.destinationReceptionAcceptedWeight).toEqual(0);
    expect(bsdd.destinationReceptionRefusedWeight).toEqual(10);
  });

  it("[legacy] should return quantityReceived (destinationReceptionWeight)", async () => {
    // Given
    const { user } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        wasteAcceptationStatus: "PARTIALLY_REFUSED",
        quantityReceived: new Decimal(10)
      }
    });

    // When
    const fullForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: RegistryFormInclude
    });

    const bsdd = formToBsdd(fullForm);

    // Then
    expect(bsdd.destinationReceptionWeight).toEqual(10);
    expect(bsdd.destinationReceptionAcceptedWeight).toEqual(null);
    expect(bsdd.destinationReceptionRefusedWeight).toEqual(null);
  });
});
