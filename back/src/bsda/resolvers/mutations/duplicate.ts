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
  id,
  createdAt,
  updatedAt,
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
  forwardingId,
  groupedInId,
  intermediaries,
  intermediariesOrgIds,
  ...rest
}: Bsda & {
  intermediaries: IntermediaryBsdaAssociation[];
}): Promise<Prisma.BsdaCreateInput> {
  const companiesSirets: string[] = [
    rest.emitterCompanySiret,
    rest.transporterCompanySiret,
    rest.brokerCompanySiret,
    rest.workerCompanySiret
  ].filter((siret): siret is string => Boolean(siret));

  // Batch call all companies involved
  const companies = await prisma.company.findMany({
    where: {
      siret: {
        in: companiesSirets
      }
    },
    include: {
      transporterReceipt: true,
      brokerReceipt: true,
      workerCertification: true
    }
  });

  const emitter = companies.find(
    company => company.siret === rest.emitterCompanySiret
  );
  const broker = companies.find(
    company => company.siret === rest.brokerCompanySiret
  );
  const transporter = companies.find(
    company => company.siret === rest.transporterCompanySiret
  );
  const worker = companies.find(
    company => company.siret === rest.workerCompanySiret
  );

  return {
    ...rest,
    id: getReadableId(ReadableIdPrefix.BSDA),
    status: BsdaStatus.INITIAL,
    isDraft: true,
    packagings: rest.packagings ?? Prisma.JsonNull,
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
    emitterCompanyAddress: emitter?.address,
    emitterCompanyMail: emitter?.contactEmail,
    emitterCompanyPhone: emitter?.contactPhone,
    emitterCompanyName: emitter?.name,
    emitterCompanyContact: emitter?.contact,
    // Transporter company info
    transporterCompanyAddress: transporter?.address,
    transporterCompanyMail: transporter?.contactEmail,
    transporterCompanyPhone: transporter?.contactPhone,
    transporterCompanyName: transporter?.name,
    transporterCompanyContact: transporter?.contact,
    // Transporter recepisse
    transporterRecepisseNumber: transporter?.transporterReceipt?.receiptNumber,
    transporterRecepisseValidityLimit:
      transporter?.transporterReceipt?.validityLimit,
    transporterRecepisseDepartment: transporter?.transporterReceipt?.department,
    // Broker company info
    brokerCompanyAddress: broker?.address,
    brokerCompanyMail: broker?.contactEmail,
    brokerCompanyPhone: broker?.contactPhone,
    brokerCompanyName: broker?.name,
    brokerCompanyContact: broker?.contact,
    // Broker recepisse
    brokerRecepisseNumber: broker?.brokerReceipt?.receiptNumber,
    brokerRecepisseValidityLimit: broker?.brokerReceipt?.validityLimit,
    brokerRecepisseDepartment: broker?.brokerReceipt?.department,
    // Worker company info
    workerCompanyAddress: worker?.address,
    workerCompanyMail: worker?.contactEmail,
    workerCompanyPhone: worker?.contactPhone,
    workerCompanyName: worker?.name,
    workerCompanyContact: worker?.contact,
    // Worker certification
    workerCertificationHasSubSectionFour:
      worker?.workerCertification?.hasSubSectionFour,
    workerCertificationHasSubSectionThree:
      worker?.workerCertification?.hasSubSectionThree,
    workerCertificationValidityLimit:
      worker?.workerCertification?.validityLimit,
    workerCertificationOrganisation: worker?.workerCertification?.organisation,
    workerCertificationCertificationNumber:
      worker?.workerCertification?.certificationNumber
  };
}
