import { Prisma, BsvhuStatus, Bsvhu } from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import { MutationDuplicateBsvhuArgs } from "../../../generated/graphql/types";
import { expandVhuFormFromDb } from "../../converter";
import { getBsvhuOrNotFound } from "../../database";
import { getBsvhuRepository } from "../../repository";
import { checkCanDuplicate } from "../../permissions";
import { prisma } from "@td/prisma";
import { sirenifyBsvhuCreateInput } from "../../sirenify";

export default async function duplicate(
  _,
  { id }: MutationDuplicateBsvhuArgs,
  context
) {
  const user = checkIsAuthenticated(context);

  const prismaBsvhu = await getBsvhuOrNotFound(id);

  await checkCanDuplicate(user, prismaBsvhu);
  const bsvhuRepository = getBsvhuRepository(user);

  const duplicateData = await getDuplicateData(prismaBsvhu);

  const sirenified = await sirenifyBsvhuCreateInput(duplicateData, []);

  const newBsvhu = await bsvhuRepository.create(sirenified);

  return expandVhuFormFromDb(newBsvhu);
}

async function getDuplicateData(
  bsvhu: Bsvhu
): Promise<Prisma.BsvhuCreateInput> {
  const {
    id,
    createdAt,
    updatedAt,
    emitterEmissionSignatureAuthor,
    emitterEmissionSignatureDate,
    transporterTransportSignatureAuthor,
    transporterTransportSignatureDate,
    destinationReceptionQuantity,
    destinationReceptionWeight,
    destinationReceptionAcceptationStatus,
    destinationReceptionRefusalReason,
    destinationReceptionIdentificationNumbers,
    destinationReceptionIdentificationType,
    destinationReceptionDate,
    destinationOperationDate,
    destinationOperationCode,
    destinationOperationSignatureAuthor,
    destinationOperationSignatureDate,
    ...rest
  } = bsvhu;

  const { emitter, transporter, destination } = await getBsvhuCompanies(bsvhu);

  return {
    ...rest,
    id: getReadableId(ReadableIdPrefix.VHU),
    status: BsvhuStatus.INITIAL,
    isDraft: true,
    emitterCompanyName: emitter?.name ?? bsvhu.emitterCompanyName,
    emitterCompanyAddress: emitter?.address ?? bsvhu.emitterCompanyAddress,
    emitterCompanyContact: emitter?.contact ?? bsvhu.emitterCompanyContact,
    emitterCompanyPhone: emitter?.contactPhone ?? bsvhu.emitterCompanyPhone,
    emitterCompanyMail: emitter?.contactEmail ?? bsvhu.emitterCompanyMail,
    destinationCompanyName: destination?.name ?? bsvhu.destinationCompanyName,
    destinationCompanyAddress:
      destination?.address ?? bsvhu.destinationCompanyAddress,
    destinationCompanyContact:
      destination?.contact ?? bsvhu.destinationCompanyContact,
    destinationCompanyPhone:
      destination?.contactPhone ?? bsvhu.destinationCompanyPhone,
    destinationCompanyMail:
      destination?.contactEmail ?? bsvhu.destinationCompanyMail,
    transporterCompanyName: transporter?.name ?? bsvhu.transporterCompanyName,
    transporterCompanyAddress:
      transporter?.address ?? bsvhu.transporterCompanyAddress,
    transporterCompanyContact:
      transporter?.contact ?? bsvhu.transporterCompanyContact,
    transporterCompanyPhone:
      transporter?.contactPhone ?? bsvhu.transporterCompanyPhone,
    transporterCompanyMail:
      transporter?.contactEmail ?? bsvhu.transporterCompanyMail,
    transporterCompanyVatNumber: bsvhu.transporterCompanyVatNumber,
    transporterRecepisseNumber:
      transporter?.transporterReceipt?.receiptNumber ?? null,
    transporterRecepisseDepartment:
      transporter?.transporterReceipt?.department ?? null,
    transporterRecepisseValidityLimit:
      transporter?.transporterReceipt?.validityLimit ?? null
  };
}

async function getBsvhuCompanies(bsvhu: Bsvhu) {
  const companiesOrgIds = [
    bsvhu.emitterCompanySiret,
    bsvhu.transporterCompanySiret,
    bsvhu.transporterCompanyVatNumber,
    bsvhu.destinationCompanySiret
  ].filter(Boolean);

  // Batch fetch all companies involved in the BSVHU
  const companies = await prisma.company.findMany({
    where: { orgId: { in: companiesOrgIds } },
    include: {
      transporterReceipt: true
    }
  });

  const emitter = companies.find(
    company => company.orgId === bsvhu.emitterCompanySiret
  );

  const destination = companies.find(
    company => company.orgId === bsvhu.destinationCompanySiret
  );

  const transporter = companies.find(
    company =>
      company.orgId === bsvhu.transporterCompanySiret ||
      company.orgId === bsvhu.transporterCompanyVatNumber
  );

  return { emitter, destination, transporter };
}
