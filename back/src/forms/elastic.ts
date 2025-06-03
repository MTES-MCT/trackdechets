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
  FormWithForwardedInWithTransporters,
  FormWithAppendix1GroupingInfo,
  FormWithAppendix1GroupingInfoInclude
} from "./types";
import { GraphQLContext } from "../types";
import { getRegistryFields } from "./registry";
import {
  getSiretsByTab,
  getRecipient,
  getFormRevisionOrgIds,
  getFormReturnOrgIds
} from "./elasticHelpers";

import { buildAddress } from "../companies/sirene/utils";
import { getFirstTransporterSync } from "./database";
import { prisma } from "@td/prisma";
import { getBsddSubType } from "../common/subTypes";
import { PackagingInfo } from "@td/codegen-back";

export type FormForElastic = Form &
  FormWithTransporters &
  FormWithForwardedInWithTransporters &
  FormWithIntermediaries &
  FormWithForwarding &
  FormWithRevisionRequests &
  FormWithAppendix1GroupingInfo;

export const FormForElasticInclude = {
  ...FormWithForwardedInWithTransportersInclude,
  ...FormWithForwardingInclude,
  ...FormWithTransportersInclude,
  ...FormWithIntermediariesInclude,
  ...FormWithRevisionRequestsInclude,
  ...FormWithAppendix1GroupingInfoInclude // provided to tell apart orphans appendix1 from others
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
 *
 * Utility to know if BSDD indexing should be skipped
 *  sould not be indexed:
 * deleted forms
 * forwarding forms
 * appendix form in draft state or not linked to another top level form through formGroupement
 */
export function isBsddNotIndexable(form: FormForElastic): boolean {
  if (form.isDeleted || !!form.forwarding) {
    return true;
  }

  if (form.emitterType === "APPENDIX1_PRODUCER") {
    if (form.status === "DRAFT") {
      return true;
    }

    return !form.groupedIn?.length; // no relation
  }
  return false;
}

/**
 * Convert a BSD from the forms table to Elastic Search's BSD model.
 * NB: some BSDDs should not appear on user dashboard, see `isBsddNotIndexable`
 */
export function toBsdElastic(form: FormForElastic): BsdElastic {
  const siretsByTab = getSiretsByTab(form);

  const recipient = getRecipient(form);

  const transporter1 = getFirstTransporterSync(form);

  return {
    type: "BSDD",
    bsdSubType: getBsddSubType(form),
    createdAt: form.createdAt?.getTime(),
    updatedAt: form.updatedAt?.getTime(),
    id: form.id,
    readableId: form.readableId,
    customId: form.customId ?? "",
    status: form.status,
    wasteCode: form.wasteDetailsCode ?? "",
    wasteAdr: form.wasteDetailsOnuCode ?? "",
    wasteDescription: form.wasteDetailsName ?? "",
    packagingNumbers: (
      form.wasteDetailsPackagingInfos as PackagingInfo[]
    )?.flatMap(p => p.identificationNumbers),
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
    destinationAcceptationWeight: form.quantityReceived
      ? form.quantityReceived.toNumber()
      : null,
    destinationOperationDate: form.processedAt?.getTime(),
    ...getFormReturnOrgIds(form),

    ...(isBsddNotIndexable(form)
      ? {
          // do not display in dashboard : BSDDs suite, deleted BSDs, orphans appendix1
          isDraftFor: [],
          isForActionFor: [],
          isFollowFor: [],
          isArchivedFor: [],
          isToCollectFor: [],
          isCollectedFor: [],
          isPendingRevisionFor: [],
          isEmittedRevisionFor: [],
          isReceivedRevisionFor: [],
          isReviewedRevisionFor: []
        }
      : siretsByTab),

    ...getFormRevisionOrgIds(form),
    revisionRequests: form.bsddRevisionRequests,
    sirets: Object.values(siretsByTab).flat(),
    ...getRegistryFields(form),
    intermediaries: form.intermediaries,
    rawBsd: form,

    // ALL actors from the BSDD, for quick search
    companyNames: [
      form.emitterCompanyName,
      form.nextDestinationCompanyName,
      form.traderCompanyName,
      form.brokerCompanyName,
      form.ecoOrganismeName,
      form.recipientCompanyName,
      ...form.intermediaries.map(intermediary => intermediary.name),
      ...form.transporters.map(
        transporter => transporter.transporterCompanyName
      ),
      form.forwardedIn?.recipientCompanyName,
      form.forwardedIn?.transporters?.map(
        transporter => transporter.transporterCompanyName
      )
    ]
      .filter(Boolean)
      .join(" "),
    companyOrgIds: [
      form.emitterCompanySiret,
      form.nextDestinationCompanySiret,
      form.traderCompanySiret,
      form.brokerCompanySiret,
      form.ecoOrganismeSiret,
      form.recipientCompanySiret,
      ...form.intermediaries.map(intermediary => intermediary.siret),
      ...form.transporters.flatMap(transporter => [
        transporter.transporterCompanySiret,
        transporter.transporterCompanyVatNumber
      ]),
      form.forwardedIn?.recipientCompanySiret,
      ...(form.forwardedIn?.transporters ?? []).flatMap(transporter => [
        transporter.transporterCompanySiret,
        transporter.transporterCompanyVatNumber
      ])
    ].filter(Boolean)
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
        bsddRevisionRequests: [],
        groupedIn: []
      })
    );
  }
  const bsdElastic = toBsdElastic(form);
  await indexBsd(bsdElastic, ctx);
  return bsdElastic;
}
