import { Form } from "@prisma/client";
import { BsdElastic, indexBsd, transportPlateFilter } from "../common/elastic";
import { FullForm } from "./types";
import { GraphQLContext } from "../types";
import { getRegistryFields } from "./registry";
import { getSiretsByTab, getRecipient } from "./elasticHelpers";

import { buildAddress } from "../companies/sirene/utils";
import { getFirstTransporterSync } from "./database";

export type RawForm = FullForm & { forwarding?: Form };

/**
 * Convert a BSD from the forms table to Elastic Search's BSD model.
 */
export async function toBsdElastic(form: RawForm): Promise<BsdElastic> {
  const siretsByTab = await getSiretsByTab(form);

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

    traderCompanyName: "",
    traderCompanySiret: "",
    traderCompanyAddress: "",

    ecoOrganismeName: form.ecoOrganismeName ?? "",
    ecoOrganismeSiret: form.ecoOrganismeSiret ?? "",

    nextDestinationCompanyName: form.nextDestinationCompanyName ?? "",
    nextDestinationCompanySiret: form.nextDestinationCompanySiret ?? "",
    nextDestinationCompanyVatNumber: form.nextDestinationCompanyVatNumber ?? "",
    nextDestinationCompanyAddress: form.nextDestinationCompanyAddress ?? "",

    destinationOperationCode: form.processingOperationDone ?? "",

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
          isCollectedFor: []
        }
      : siretsByTab),
    sirets: Object.values(siretsByTab).flat(),
    ...getRegistryFields(form),
    intermediaries: form.intermediaries,
    rawBsd: form
  };
}

export async function indexForm(
  form: FullForm,
  ctx?: GraphQLContext
): Promise<BsdElastic> {
  // prevent unwanted cascaded reindexation
  if (form.isDeleted) {
    return toBsdElastic(form);
  }
  if (form.forwardedIn) {
    // index next BSD asynchronously
    indexBsd(
      await toBsdElastic({
        ...form.forwardedIn,
        intermediaries: [],
        forwardedIn: null,
        forwarding: form
      })
    );
  }
  const bsdElastic = await toBsdElastic(form);
  await indexBsd(bsdElastic, ctx);
  return bsdElastic;
}
