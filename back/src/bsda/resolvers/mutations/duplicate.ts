import { Bsda, BsdaStatus, Prisma } from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import { MutationDuplicateBsdaArgs } from "../../../generated/graphql/types";
import { expandBsdaFromDb } from "../../converter";
import { getBsdaOrNotFound, getFirstTransporterSync } from "../../database";
import { getBsdaRepository } from "../../repository";
import { checkCanDuplicate } from "../../permissions";
import { prisma } from "@td/prisma";
import { sirenify } from "../../validation/sirenify";
import { BsdaWithIntermediaries, BsdaWithTransporters } from "../../types";

export default async function duplicate(
  _,
  { id }: MutationDuplicateBsdaArgs,
  context
) {
  const user = checkIsAuthenticated(context);

  const prismaBsda = await getBsdaOrNotFound(id, {
    include: { intermediaries: true, transporters: true }
  });
  const transporter = getFirstTransporterSync(prismaBsda)!;

  await checkCanDuplicate(user, prismaBsda);

  // FIXME - En attente d'une meilleure solution lors de l'implémentation du
  // multi-modal.
  // Sirenify s'applique sur les données transporteur "à plat"
  // dans le contexte de la validation Zod. Pour pouvoir l'utiliser ici on
  // doit remettre les données à plat puis reconstruire une version de `transporters`
  // avec les données transporteurs "sirenified".
  const {
    transporterCompanySiret,
    transporterCompanyName,
    transporterCompanyAddress,
    ...sirenifiedBsda
  } = await sirenify(
    {
      ...prismaBsda,
      transporterCompanySiret: transporter.transporterCompanySiret,
      transporterCompanyName: transporter.transporterCompanyName,
      transporterCompanyAddress: transporter.transporterCompanyAddress
    },
    []
  );

  const sirenifiedTransporter = {
    ...transporter,
    transporterCompanyName,
    transporterCompanyAddress
  };

  const data = await duplicateBsda({
    ...sirenifiedBsda,
    transporters: [sirenifiedTransporter]
  });

  const newBsda = await getBsdaRepository(user).create(data);

  return expandBsdaFromDb(newBsda);
}

type BsdaForDuplicate = Bsda & BsdaWithTransporters & BsdaWithIntermediaries;

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
  destinationCustomInfo,
  destinationReceptionWeight,
  destinationReceptionDate,
  destinationReceptionAcceptationStatus,
  destinationReceptionRefusalReason,
  destinationOperationCode,
  destinationOperationMode,
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
  transporters,
  // values that should be duplicated
  ...bsda
}: BsdaForDuplicate): Promise<Prisma.BsdaCreateInput> {
  const {
    id: transporterId,
    createdAt: transporterCreatedAt,
    updatedAt: transporterUpdatedAt,
    bsdaId,
    transporterTransportPlates,
    number,
    transporterTransportTakenOverAt,
    transporterTransportSignatureAuthor,
    transporterTransportSignatureDate,
    transporterCustomInfo,
    // transporter values that should be duplicated
    ...transporter
  } = getFirstTransporterSync({ transporters })!;

  const companiesOrgIds: string[] = [
    bsda.emitterCompanySiret,
    transporter.transporterCompanySiret,
    transporter.transporterCompanyVatNumber,
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
  const transporterCompany = companies.find(
    company =>
      company.orgId === transporter.transporterCompanySiret ||
      company.orgId === transporter.transporterCompanyVatNumber
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
    emitterCompanyMail: emitter?.contactEmail ?? bsda.emitterCompanyMail,
    emitterCompanyPhone: emitter?.contactPhone ?? bsda.emitterCompanyPhone,
    emitterCompanyContact: emitter?.contact ?? bsda.emitterCompanyContact,
    // Destination company info
    destinationCompanyMail:
      destination?.contactEmail ?? bsda.destinationCompanyMail,
    destinationCompanyPhone:
      destination?.contactPhone ?? bsda.destinationCompanyPhone,
    destinationCompanyContact:
      destination?.contact ?? bsda.destinationCompanyContact,

    // Broker company info
    brokerCompanyMail: broker?.contactEmail ?? bsda.brokerCompanyMail,
    brokerCompanyPhone: broker?.contactPhone ?? bsda.brokerCompanyPhone,
    brokerCompanyContact: broker?.contact ?? bsda.brokerCompanyContact,
    // Broker recepisse
    brokerRecepisseNumber:
      broker?.brokerReceipt?.receiptNumber ?? bsda.brokerRecepisseNumber,
    brokerRecepisseValidityLimit:
      broker?.brokerReceipt?.validityLimit ?? bsda.brokerRecepisseValidityLimit,
    brokerRecepisseDepartment:
      broker?.brokerReceipt?.department ?? bsda.brokerRecepisseDepartment,
    // Worker company info
    workerCompanyMail: worker?.contactEmail ?? bsda.workerCompanyMail,
    workerCompanyPhone: worker?.contactPhone ?? bsda.workerCompanyPhone,
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
      bsda.workerCertificationCertificationNumber,
    transporters: {
      create: {
        number: 1,
        ...transporter,
        // Transporter company info
        transporterCompanyMail:
          transporterCompany?.contactEmail ??
          transporter.transporterCompanyMail,
        transporterCompanyPhone:
          transporterCompany?.contactPhone ??
          transporter.transporterCompanyPhone,
        transporterCompanyContact:
          transporterCompany?.contact ?? transporter.transporterCompanyContact,
        // Transporter recepisse
        transporterRecepisseNumber:
          transporterCompany?.transporterReceipt?.receiptNumber ?? null,
        transporterRecepisseValidityLimit:
          transporterCompany?.transporterReceipt?.validityLimit ?? null,
        transporterRecepisseDepartment:
          transporterCompany?.transporterReceipt?.department ?? null
      }
    }
  };
}
