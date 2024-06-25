import {
  companyFactory,
  formFactory,
  formWithTempStorageFactory,
  userWithCompanyFactory
} from "../../__tests__/factories";
import { prisma } from "@td/prisma";
import { RegistryFormInclude } from "../../registry/elastic";
import { formToBsdd } from "../compat";

describe("simpleFormToBsdd", () => {
  it("should convert a Form to a Bsdd", async () => {
    // Bsdd is a Form that has the same shape as other types of bsds (BSDA, BSDASRI, etc)
    // It is used as a compatibility data structure when we need homogeneus data (ex: to compute a cross bsds registry)

    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: company.siret }
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
      transporter2CompanyName: undefined,
      transporter2CompanySiret: undefined,
      transporter2CompanyVatNumber: null,
      transporter2CompanyAddress: undefined,
      transporter2CompanyContact: undefined,
      transporter2CompanyPhone: undefined,
      transporter2CompanyMail: undefined,
      transporter2CustomInfo: null,
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
      transporter3CompanyVatNumber: null,
      transporter3CompanyAddress: undefined,
      transporter3CompanyContact: undefined,
      transporter3CompanyPhone: undefined,
      transporter3CompanyMail: undefined,
      transporter3CustomInfo: null,
      transporter3RecepisseIsExempted: undefined,
      transporter3RecepisseNumber: undefined,
      transporter3RecepisseDepartment: undefined,
      transporter3RecepisseValidityLimit: undefined,
      transporter3TransportMode: undefined,
      transporter3TransportTakenOverAt: undefined,
      transporter3TransportSignatureAuthor: undefined,
      transporter3TransportSignatureDate: undefined,
      transporter3NumberPlates: [],
      destinationCompanyName: form.recipientCompanyName,
      destinationCompanySiret: form.recipientCompanySiret,
      destinationCompanyAddress: form.recipientCompanyAddress,
      destinationCompanyContact: form.recipientCompanyContact,
      destinationCompanyPhone: form.recipientCompanyPhone,
      destinationCompanyMail: form.recipientCompanyMail,
      destinationCustomInfo: null,
      destinationReceptionDate: null,
      destinationReceptionWeight: null,
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
      forwardedIn: null
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
      transporter2CompanyVatNumber: null,
      transporter2CompanyAddress: undefined,
      transporter2CompanyContact: undefined,
      transporter2CompanyPhone: undefined,
      transporter2CompanyMail: undefined,
      transporter2CustomInfo: null,
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
      transporter3CompanyVatNumber: null,
      transporter3CompanyAddress: undefined,
      transporter3CompanyContact: undefined,
      transporter3CompanyPhone: undefined,
      transporter3CompanyMail: undefined,
      transporter3CustomInfo: null,
      transporter3RecepisseIsExempted: undefined,
      transporter3RecepisseNumber: undefined,
      transporter3RecepisseDepartment: undefined,
      transporter3RecepisseValidityLimit: undefined,
      transporter3TransportMode: undefined,
      transporter3TransportTakenOverAt: undefined,
      transporter3TransportSignatureAuthor: undefined,
      transporter3TransportSignatureDate: undefined,
      transporter3NumberPlates: [],
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
      grouping: [],
      finalOperations: [],
      forwardedIn: null,
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
        transporter2CompanyVatNumber: null,
        transporter2CompanyAddress: undefined,
        transporter2CompanyContact: undefined,
        transporter2CompanyPhone: undefined,
        transporter2CompanyMail: undefined,
        transporter2CustomInfo: null,
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
        transporter3CompanyVatNumber: null,
        transporter3CompanyAddress: undefined,
        transporter3CompanyContact: undefined,
        transporter3CompanyPhone: undefined,
        transporter3CompanyMail: undefined,
        transporter3CustomInfo: null,
        transporter3RecepisseIsExempted: undefined,
        transporter3RecepisseNumber: undefined,
        transporter3RecepisseDepartment: undefined,
        transporter3RecepisseValidityLimit: undefined,
        transporter3TransportMode: undefined,
        transporter3TransportTakenOverAt: undefined,
        transporter3TransportSignatureAuthor: undefined,
        transporter3TransportSignatureDate: undefined,
        transporter3NumberPlates: [],
        destinationCompanyName: form.recipientCompanyName,
        destinationCompanySiret: form.recipientCompanySiret,
        destinationCompanyAddress: form.recipientCompanyAddress,
        destinationCompanyContact: form.recipientCompanyContact,
        destinationCompanyPhone: form.recipientCompanyPhone,
        destinationCompanyMail: form.recipientCompanyMail,
        destinationCustomInfo: null,
        destinationReceptionDate: form.receivedAt,
        destinationReceptionWeight: form.quantityReceived,
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
        forwardedInId: fullForwardedInForm.id,
        nextDestinationNotificationNumber: null,
        nextDestinationProcessingOperation: null,
        grouping: []
      }
    });
  });
});
