import { Form, OperationMode } from "@prisma/client";
import { BsdElastic, indexBsd, transportPlateFilter } from "../common/elastic";
import {
  FormWithForwardedInWithTransportersInclude,
  FormWithIntermediaries,
  FormWithIntermediariesInclude,
  FormWithRevisionRequests,
  FormWithTransporters,
  FormWithTransportersInclude,
  FormWithRevisionRequestsInclude,
  FormWithForwarding,
  FormWithForwardingInclude,
  FormWithForwardedInWithTransporters
} from "./types";
import { GraphQLContext } from "../types";
import { getRegistryFields } from "./registry";
import {
  getSiretsByTab,
  getRecipient,
  getFormRevisionOrgIds
} from "./elasticHelpers";

import { buildAddress } from "../companies/sirene/utils";
import { getFirstTransporterSync } from "./database";
import prisma from "../prisma";

export type FormForElastic = Form &
  FormWithTransporters &
  FormWithForwardedInWithTransporters &
  FormWithIntermediaries &
  FormWithForwarding &
  FormWithRevisionRequests;

export const FormForElasticInclude = {
  ...FormWithForwardedInWithTransportersInclude,
  ...FormWithForwardingInclude,
  ...FormWithTransportersInclude,
  ...FormWithIntermediariesInclude,
  ...FormWithRevisionRequestsInclude
};

export async function getFormForElastic(
  form: Pick<Form, "readableId">
): Promise<FormForElastic> {
  return prisma.form.findUniqueOrThrow({
    where: { readableId: form.readableId },
    include: FormForElasticInclude
  });
}

/**
 * Convert a BSD from the forms table to Elastic Search's BSD model.
 */
export function toBsdElastic(form: FormForElastic): BsdElastic {
  const siretsByTab = getSiretsByTab(form);

  const recipient = getRecipient(form);

  const transporter1 = getFirstTransporterSync(form);

  return {
    type: "BSDD",
    createdAt: form.createdAt?.getTime(),
    updatedAt: form.updatedAt?.getTime(),
    id: form.id,
    readableId: form.readableId,
    customId: form.customId ?? "",
    status: form.status,
    wasteCode: form.wasteDetailsCode ?? "",
    wasteAdr: form.wasteDetailsOnuCode ?? "",
    wasteDescription: form.wasteDetailsName ?? "",
    packagingNumbers: [],
    wasteSealNumbers: [],
    identificationNumbers: [],
    ficheInterventionNumbers: [],
    emitterCompanyName: form.emitterCompanyName ?? "",
    emitterCompanySiret: form.emitterCompanySiret ?? "",
    emitterCompanyAddress: form.emitterCompanyAddress ?? "",
    emitterPickupSiteName: form.emitterWorkSiteName ?? "",
    emitterPickupSiteAddress: buildAddress([
      form.emitterWorkSiteAddress,
      form.emitterWorkSitePostalCode,
      form.emitterWorkSiteCity
    ]),
    emitterCustomInfo: "",
    workerCompanyName: "",
    workerCompanySiret: "",
    workerCompanyAddress: "",

    transporterCompanyName: transporter1?.transporterCompanyName ?? "",
    transporterCompanySiret: transporter1?.transporterCompanySiret ?? "",
    transporterCompanyVatNumber:
      transporter1?.transporterCompanyVatNumber ?? "",
    transporterCompanyAddress: transporter1?.transporterCompanyAddress ?? "",
    transporterCustomInfo: transporter1?.transporterCustomInfo ?? "",
    transporterTransportPlates: transporter1?.transporterNumberPlate
      ? [transportPlateFilter(transporter1?.transporterNumberPlate)]
      : [],

    destinationCompanyName: recipient.name ?? "",
    destinationCompanySiret: recipient.siret ?? "",
    destinationCompanyAddress: recipient.address ?? "",
    destinationCustomInfo: "",
    destinationCap: recipient.cap ?? "",

    brokerCompanyName: form.brokerCompanyName ?? "",
    brokerCompanySiret: form.brokerCompanySiret ?? "",
    brokerCompanyAddress: form.brokerCompanyAddress ?? "",

    traderCompanyName: form.traderCompanyName ?? "",
    traderCompanySiret: form.traderCompanySiret ?? "",
    traderCompanyAddress: form.traderCompanyAddress ?? "",

    ecoOrganismeName: form.ecoOrganismeName ?? "",
    ecoOrganismeSiret: form.ecoOrganismeSiret ?? "",

    nextDestinationCompanyName: form.nextDestinationCompanyName ?? "",
    nextDestinationCompanySiret: form.nextDestinationCompanySiret ?? "",
    nextDestinationCompanyVatNumber: form.nextDestinationCompanyVatNumber ?? "",
    nextDestinationCompanyAddress: form.nextDestinationCompanyAddress ?? "",

    destinationOperationCode: form.processingOperationDone ?? "",
    destinationOperationMode:
      (form.processingOperationDone as OperationMode) ?? undefined,

    emitterEmissionDate: form.emittedAt?.getTime(),
    workerWorkDate: undefined,
    transporterTransportTakenOverAt:
      form.takenOverAt?.getTime() ?? form.sentAt?.getTime(),
    destinationReceptionDate: form.receivedAt?.getTime(),
    destinationAcceptationDate: form.signedAt?.getTime(),
    destinationAcceptationWeight: form.quantityReceived,
    destinationOperationDate: form.processedAt?.getTime(),
    ...(form.forwarding
      ? {
          // do not display BSD suite in dashboard
          isDraftFor: [],
          isForActionFor: [],
          isFollowFor: [],
          isArchivedFor: [],
          isToCollectFor: [],
          isCollectedFor: [],
          isInRevisionFor: []
        }
      : siretsByTab),
    ...getFormRevisionOrgIds(form),
    sirets: Object.values(siretsByTab).flat(),
    ...getRegistryFields(form),
    intermediaries: form.intermediaries,
    rawBsd: form
  };
}

export async function indexForm(
  form: FormForElastic,
  ctx?: GraphQLContext
): Promise<BsdElastic> {
  // prevent unwanted cascaded reindexation
  if (form.isDeleted) {
    return toBsdElastic(form);
  }
  if (form.forwardedIn) {
    // index next BSD asynchronously
    indexBsd(
      toBsdElastic({
        ...form.forwardedIn,
        intermediaries: [],
        forwardedIn: null,
        forwarding: form,
        bsddRevisionRequests: []
      })
    );
  }
  const bsdElastic = toBsdElastic(form);
  await indexBsd(bsdElastic, ctx);
  return bsdElastic;
}
