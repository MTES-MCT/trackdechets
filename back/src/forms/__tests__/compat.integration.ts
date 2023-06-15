import { formFactory, userWithCompanyFactory } from "../../__tests__/factories";
import prisma from "../../prisma";
import { simpleFormToBsdd } from "../compat";

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
      include: { transporters: true }
    });

    const bsdd = simpleFormToBsdd(fullForm);
    expect(bsdd).toEqual({
      id: form.readableId,
      customId: form.customId,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
      isDeleted: form.isDeleted,
      isDraft: false,
      status: form.status,
      wasteCode: form.wasteDetailsCode,
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
      emitterPickupSiteInfos: form.emitterWorkSiteInfos,
      emitterEmissionSignatureAuthor: form.sentBy,
      emitterEmissionSignatureDate: form.sentAt,
      packagings: form.wasteDetailsPackagingInfos,
      weightValue: form.wasteDetailsQuantity,
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
      destinationOperationNextDestinationCompanyMail: null
    });
  });

  it("should convert a Form without transporter to a Bsdd", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: company.siret }
    });
    // delete existing transporters
    await prisma.form.update({
      where: { id: form.id },
      data: { transporters: { deleteMany: {} } }
    });
    const fullForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: { transporters: true }
    });
    const bsdd = simpleFormToBsdd(fullForm);
    expect(bsdd).toMatchObject({
      transporterCompanyName: undefined,
      transporterCompanySiret: undefined,
      transporterCompanyVatNumber: null,
      transporterCompanyAddress: undefined,
      transporterCompanyContact: undefined,
      transporterCompanyPhone: undefined,
      transporterCompanyMail: undefined,
      transporterCustomInfo: null,
      transporterRecepisseIsExempted: undefined,
      transporterRecepisseNumber: undefined,
      transporterRecepisseDepartment: undefined,
      transporterRecepisseValidityLimit: undefined,
      transporterTransportMode: undefined,
      transporterTransportTakenOverAt: undefined,
      transporterTransportSignatureAuthor: undefined,
      transporterTransportSignatureDate: undefined,
      transporterNumberPlates: []
    });
  });
});
