import { BsdaStatus, Prisma } from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import { MutationDuplicateBsdaArgs } from "@td/codegen-back";
import { expandBsdaFromDb } from "../../converter";
import { getBsdaOrNotFound } from "../../database";
import { getBsdaRepository } from "../../repository";
import { checkCanDuplicate } from "../../permissions";
import { prisma } from "@td/prisma";
import { parseBsdaAsync } from "../../validation";
import { prismaToZodBsda } from "../../validation/helpers";
import { BsdaForParsingInclude } from "../../validation/types";

export default async function duplicate(
  _,
  { id }: MutationDuplicateBsdaArgs,
  context
) {
  const user = checkIsAuthenticated(context);

  const prismaBsda = await getBsdaOrNotFound(id, {
    include: BsdaForParsingInclude
  });

  await checkCanDuplicate(user, prismaBsda);

  const {
    // values that should not be duplicated
    isDraft,
    isDeleted,
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
    forwarding,
    grouping,
    intermediariesOrgIds,
    // values that should be duplicated
    ...zodBsda
  } = prismaToZodBsda(prismaBsda);

  const parsedBsda = await parseBsdaAsync(zodBsda, {
    user,
    // Permet d'appliquer l'auto-complétion SIRENE
    // TODO : on pourrait gérer aussi l'auto-complétion des récépissés et certifications
    // entreprise de travaux / courtier dans le parsing Zod.
    enableCompletionTransformers: true
  });

  const firstTransporter = parsedBsda.transporters?.[0];

  const {
    id: bsdaId,
    intermediaries,
    transporters,
    transportersOrgIds,
    ...bsda
  } = parsedBsda;

  const companiesOrgIds: string[] = [
    bsda.emitterCompanySiret,
    firstTransporter?.transporterCompanySiret,
    firstTransporter?.transporterCompanyVatNumber,
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

  const worker = companies.find(
    company => company.orgId === bsda.workerCompanySiret
  );

  let data: Prisma.BsdaCreateInput = {
    ...bsda,
    id: getReadableId(ReadableIdPrefix.BSDA),
    status: BsdaStatus.INITIAL,
    isDraft: true,
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
    transportersOrgIds: [],
    intermediariesOrgIds: [],
    grouping: undefined,
    forwarding: undefined
  };

  if (firstTransporter) {
    const transporterCompany = firstTransporter
      ? companies.find(
          company =>
            company.orgId === firstTransporter.transporterCompanySiret ||
            company.orgId === firstTransporter.transporterCompanyVatNumber
        )
      : null;
    const {
      // transport values that should not be duplicated
      id: transporterId,
      bsdaId: transporterBsdaId,
      transporterTransportPlates,
      transporterTransportTakenOverAt,
      transporterTransportSignatureAuthor,
      transporterTransportSignatureDate,
      transporterCustomInfo,
      number,
      // transporter values that should be duplicated
      ...transporterData
    } = firstTransporter;
    data = {
      ...data,
      transportersOrgIds: [
        firstTransporter.transporterCompanySiret,
        firstTransporter.transporterCompanyVatNumber
      ].filter(Boolean),
      transporters: {
        create: {
          ...transporterData,
          number: 1,
          // Transporter company info
          transporterCompanyMail:
            transporterCompany?.contactEmail ??
            firstTransporter.transporterCompanyMail,
          transporterCompanyPhone:
            transporterCompany?.contactPhone ??
            firstTransporter.transporterCompanyPhone,
          transporterCompanyContact:
            transporterCompany?.contact ??
            firstTransporter.transporterCompanyContact,
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

  if (intermediaries) {
    data = {
      ...data,
      intermediaries: {
        createMany: {
          data: intermediaries.map(intermediary => ({
            siret: intermediary.siret!,
            address: intermediary.address,
            vatNumber: intermediary.vatNumber,
            name: intermediary.name!,
            contact: intermediary.contact!,
            phone: intermediary.phone,
            mail: intermediary.mail
          }))
        }
      },
      intermediariesOrgIds
    };
  }

  const newBsda = await getBsdaRepository(user).create(data);

  return expandBsdaFromDb(newBsda);
}
