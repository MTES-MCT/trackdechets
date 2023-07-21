import {
  Bsda,
  BsdaStatus,
  IntermediaryBsdaAssociation,
  Prisma
} from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import { MutationDuplicateBsdaArgs } from "../../../generated/graphql/types";
import { expandBsdaFromDb } from "../../converter";
import { getBsdaOrNotFound } from "../../database";
import { getBsdaRepository } from "../../repository";
import { checkCanDuplicate } from "../../permissions";
import prisma from "../../../prisma";

export default async function duplicate(
  _,
  { id }: MutationDuplicateBsdaArgs,
  context
) {
  const user = checkIsAuthenticated(context);

  const prismaBsda = await getBsdaOrNotFound(id, {
    include: { intermediaries: true }
  });

  await checkCanDuplicate(user, prismaBsda);

  const data = await duplicateBsda(prismaBsda);
  const newBsda = await getBsdaRepository(user).create(data);

  return expandBsdaFromDb(newBsda);
}

async function duplicateBsda({
  // values that should not be duplicated
  id,
  createdAt,
  updatedAt,
  isDraft,
  isDeleted,
  status,
  emitterEmissionSignatureAuthor,
  emitterEmissionSignatureDate,
  emitterCustomInfo,
  workerWorkHasEmitterPaperSignature,
  workerWorkSignatureAuthor,
  workerWorkSignatureDate,
  transporterTransportPlates,
  transporterCustomInfo,
  transporterTransportTakenOverAt,
  transporterTransportSignatureAuthor,
  transporterTransportSignatureDate,
  destinationCustomInfo,
  destinationReceptionWeight,
  destinationReceptionDate,
  destinationReceptionAcceptationStatus,
  destinationReceptionRefusalReason,
  destinationOperationCode,
  destinationOperationSignatureAuthor,
  destinationOperationSignatureDate,
  destinationOperationDate,
  wasteSealNumbers,
  packagings,
  weightValue,
  forwardingId,
  groupedInId,
  intermediaries,
  intermediariesOrgIds,
  // values that should be duplicated
  ...bsda
}: Bsda & {
  intermediaries: IntermediaryBsdaAssociation[];
}): Promise<Prisma.BsdaCreateInput> {
  const companiesOrgIds: string[] = [
    bsda.emitterCompanySiret,
    bsda.transporterCompanySiret,
    bsda.transporterCompanyVatNumber,
    bsda.brokerCompanySiret,
    bsda.workerCompanySiret,
    bsda.destinationCompanySiret
  ].filter(Boolean);

  // Batch call all companies involved
  const companies = await prisma.company.findMany({
    where: {
      orgId: {
        in: companiesOrgIds
      }
    },
    include: {
      transporterReceipt: true,
      brokerReceipt: true,
      workerCertification: true
    }
  });

  const emitter = companies.find(
    company => company.orgId === bsda.emitterCompanySiret
  );
  const destination = companies.find(
    company => company.orgId === bsda.destinationCompanySiret
  );
  const broker = companies.find(
    company => company.orgId === bsda.brokerCompanySiret
  );
  const transporter = companies.find(
    company =>
      company.orgId === bsda.transporterCompanySiret ||
      company.orgId === bsda.transporterCompanyVatNumber
  );
  const worker = companies.find(
    company => company.orgId === bsda.workerCompanySiret
  );

  return {
    ...bsda,
    id: getReadableId(ReadableIdPrefix.BSDA),
    status: BsdaStatus.INITIAL,
    isDraft: true,
    ...(intermediaries && {
      intermediaries: {
        createMany: {
          data: intermediaries.map(intermediary => ({
            siret: intermediary.siret,
            address: intermediary.address,
            vatNumber: intermediary.vatNumber,
            name: intermediary.name,
            contact: intermediary.contact,
            phone: intermediary.phone,
            mail: intermediary.mail
          }))
        }
      },
      intermediariesOrgIds
    }),
    // Emitter company info
    emitterCompanyAddress: emitter?.address ?? bsda.emitterCompanyAddress,
    emitterCompanyMail: emitter?.contactEmail ?? bsda.emitterCompanyMail,
    emitterCompanyPhone: emitter?.contactPhone ?? bsda.emitterCompanyPhone,
    emitterCompanyName: emitter?.name ?? bsda.emitterCompanyName,
    emitterCompanyContact: emitter?.contact ?? bsda.emitterCompanyContact,
    // Destination company info
    destinationCompanyAddress:
      destination?.address ?? bsda.destinationCompanyAddress,
    destinationCompanyMail:
      destination?.contactEmail ?? bsda.destinationCompanyMail,
    destinationCompanyPhone:
      destination?.contactPhone ?? bsda.destinationCompanyPhone,
    destinationCompanyName: destination?.name ?? bsda.destinationCompanyName,
    destinationCompanyContact:
      destination?.contact ?? bsda.destinationCompanyContact,
    // Transporter company info
    transporterCompanyAddress:
      transporter?.address ?? bsda.transporterCompanyAddress,
    transporterCompanyMail:
      transporter?.contactEmail ?? bsda.transporterCompanyMail,
    transporterCompanyPhone:
      transporter?.contactPhone ?? bsda.transporterCompanyPhone,
    transporterCompanyName: transporter?.name ?? bsda.transporterCompanyName,
    transporterCompanyContact:
      transporter?.contact ?? bsda.transporterCompanyContact,
    // Transporter recepisse
    transporterRecepisseNumber:
      transporter?.transporterReceipt?.receiptNumber ?? null,
    transporterRecepisseValidityLimit:
      transporter?.transporterReceipt?.validityLimit ?? null,
    transporterRecepisseDepartment:
      transporter?.transporterReceipt?.department ?? null,
    // Broker company info
    brokerCompanyAddress: broker?.address ?? bsda.brokerCompanyAddress,
    brokerCompanyMail: broker?.contactEmail ?? bsda.brokerCompanyMail,
    brokerCompanyPhone: broker?.contactPhone ?? bsda.brokerCompanyPhone,
    brokerCompanyName: broker?.name ?? bsda.brokerCompanyName,
    brokerCompanyContact: broker?.contact ?? bsda.brokerCompanyContact,
    // Broker recepisse
    brokerRecepisseNumber:
      broker?.brokerReceipt?.receiptNumber ?? bsda.brokerRecepisseNumber,
    brokerRecepisseValidityLimit:
      broker?.brokerReceipt?.validityLimit ?? bsda.brokerRecepisseValidityLimit,
    brokerRecepisseDepartment:
      broker?.brokerReceipt?.department ?? bsda.brokerRecepisseDepartment,
    // Worker company info
    workerCompanyAddress: worker?.address ?? bsda.workerCompanyAddress,
    workerCompanyMail: worker?.contactEmail ?? bsda.workerCompanyMail,
    workerCompanyPhone: worker?.contactPhone ?? bsda.workerCompanyPhone,
    workerCompanyName: worker?.name ?? bsda.workerCompanyName,
    workerCompanyContact: worker?.contact ?? bsda.workerCompanyContact,
    // Worker certification
    workerCertificationHasSubSectionFour:
      worker?.workerCertification?.hasSubSectionFour ??
      bsda.workerCertificationHasSubSectionFour,
    workerCertificationHasSubSectionThree:
      worker?.workerCertification?.hasSubSectionThree ??
      bsda.workerCertificationHasSubSectionThree,
    workerCertificationValidityLimit:
      worker?.workerCertification?.validityLimit ??
      bsda.workerCertificationValidityLimit,
    workerCertificationOrganisation:
      worker?.workerCertification?.organisation ??
      bsda.workerCertificationOrganisation,
    workerCertificationCertificationNumber:
      worker?.workerCertification?.certificationNumber ??
      bsda.workerCertificationCertificationNumber
  };
}
