import {
  Bsff,
  BsffStatus,
  BsffPackaging,
  BsffFicheIntervention,
  BsdType
} from "@prisma/client";
import { BsdElastic, indexBsd, transportPlateFilter } from "../common/elastic";
import { GraphQLContext } from "../types";
import { getRegistryFields } from "./registry";
import { toBsffDestination } from "./compat";
import { getTransporterCompanyOrgId } from "../common/constants/companySearchHelpers";
import { getReadonlyBsffRepository } from "./repository";

export function toBsdElastic(
  bsff: Bsff & {
    packagings: BsffPackaging[];
  } & {
    ficheInterventions: BsffFicheIntervention[];
  }
): BsdElastic {
  const bsffDestination = toBsffDestination(bsff.packagings);

  const bsd = {
    type: BsdType.BSFF,
    createdAt: bsff.createdAt?.getTime(),
    updatedAt: bsff.updatedAt?.getTime(),
    id: bsff.id,
    readableId: bsff.id,
    customId: "",
    status: bsff.status,
    wasteCode: bsff.wasteCode ?? "",
    wasteAdr: bsff.wasteAdr ?? "",
    wasteDescription: bsff.wasteDescription ?? "",
    packagingNumbers: bsff.packagings?.map(p => p.numero) ?? [],
    wasteSealNumbers: [],
    identificationNumbers: [],
    ficheInterventionNumbers:
      bsff.ficheInterventions?.map(fi => fi.numero) ?? [],
    emitterCompanyName: bsff.emitterCompanyName ?? "",
    emitterCompanySiret: bsff.emitterCompanySiret ?? "",
    emitterCompanyAddress: bsff.emitterCompanyAddress ?? "",
    emitterPickupSiteName: "",
    emitterPickupSiteAddress: "",
    emitterCustomInfo: bsff.emitterCustomInfo ?? "",
    workerCompanyName: "",
    workerCompanySiret: "",
    workerCompanyAddress: "",

    transporterCompanyName: bsff.transporterCompanyName ?? "",
    transporterCompanySiret: bsff.transporterCompanySiret ?? "",
    transporterCompanyVatNumber: bsff.transporterCompanyVatNumber ?? "",
    transporterCompanyAddress: bsff.transporterCompanyAddress ?? "",
    transporterCustomInfo: bsff.transporterCustomInfo ?? "",
    transporterTransportPlates:
      bsff.transporterTransportPlates.map(transportPlateFilter) ?? [],

    destinationCompanyName: bsff.destinationCompanyName ?? "",
    destinationCompanySiret: bsff.destinationCompanySiret ?? "",
    destinationCompanyAddress: bsff.destinationCompanyAddress ?? "",
    destinationCustomInfo: bsff.destinationCustomInfo ?? "",
    destinationCap: bsff.destinationCap ?? "",

    brokerCompanyName: "",
    brokerCompanySiret: "",
    brokerCompanyAddress: "",

    traderCompanyName: "",
    traderCompanySiret: "",
    traderCompanyAddress: "",

    ecoOrganismeName: "",
    ecoOrganismeSiret: "",

    nextDestinationCompanyName: "",
    nextDestinationCompanySiret: "",
    nextDestinationCompanyVatNumber: "",
    nextDestinationCompanyAddress: "",

    destinationOperationCode: "",

    emitterEmissionDate: bsff.emitterEmissionSignatureDate?.getTime(),
    workerWorkDate: null,
    transporterTransportTakenOverAt:
      bsff.transporterTransportTakenOverAt?.getTime() ??
      bsff.transporterTransportSignatureDate?.getTime(),
    destinationReceptionDate: bsff.destinationReceptionDate?.getTime(),
    destinationAcceptationDate: bsffDestination?.receptionDate?.getTime(),
    destinationAcceptationWeight: bsffDestination?.receptionWeight,
    destinationOperationDate: bsffDestination?.operationDate?.getTime(),
    isDraftFor: [],
    isForActionFor: [],
    isFollowFor: [],
    isArchivedFor: [],
    isToCollectFor: [],
    isCollectedFor: [],
    sirets: [
      bsff.emitterCompanySiret,
      bsff.transporterCompanySiret,
      bsff.destinationCompanySiret,
      ...bsff.detenteurCompanySirets
    ],
    ...getRegistryFields(bsff),
    rawBsd: {
      ...bsff,
      packagings: bsff.packagings.map(packaging => ({
        numero: packaging.numero
      }))
    }
  };

  if (bsff.isDraft) {
    bsd.isDraftFor.push(
      bsff.emitterCompanySiret,
      getTransporterCompanyOrgId(bsff),
      bsff.destinationCompanySiret
    );
  } else {
    switch (bsff.status) {
      case BsffStatus.INITIAL: {
        bsd.isForActionFor.push(bsff.emitterCompanySiret);
        bsd.isFollowFor.push(
          getTransporterCompanyOrgId(bsff),
          bsff.destinationCompanySiret,
          ...bsff.detenteurCompanySirets
        );
        break;
      }
      case BsffStatus.SIGNED_BY_EMITTER: {
        bsd.isToCollectFor.push(getTransporterCompanyOrgId(bsff));
        bsd.isFollowFor.push(
          bsff.emitterCompanySiret,
          bsff.destinationCompanySiret,
          ...bsff.detenteurCompanySirets
        );
        break;
      }
      case BsffStatus.SENT: {
        bsd.isCollectedFor.push(getTransporterCompanyOrgId(bsff));
        bsd.isFollowFor.push(
          bsff.emitterCompanySiret,
          ...bsff.detenteurCompanySirets
        );
        bsd.isForActionFor.push(bsff.destinationCompanySiret);
        break;
      }
      case BsffStatus.RECEIVED:
      case BsffStatus.PARTIALLY_REFUSED:
      case BsffStatus.ACCEPTED: {
        bsd.isFollowFor.push(
          bsff.emitterCompanySiret,
          getTransporterCompanyOrgId(bsff),
          ...bsff.detenteurCompanySirets
        );
        bsd.isForActionFor.push(bsff.destinationCompanySiret);
        break;
      }
      case BsffStatus.INTERMEDIATELY_PROCESSED: {
        bsd.isFollowFor.push(
          bsff.emitterCompanySiret,
          getTransporterCompanyOrgId(bsff),
          bsff.destinationCompanySiret,
          ...bsff.detenteurCompanySirets
        );
        break;
      }
      case BsffStatus.REFUSED:
      case BsffStatus.PROCESSED: {
        bsd.isArchivedFor.push(
          bsff.emitterCompanySiret,
          getTransporterCompanyOrgId(bsff),
          bsff.destinationCompanySiret,
          ...bsff.detenteurCompanySirets
        );
        break;
      }
      default:
        break;
    }
  }

  return bsd;
}

export async function indexBsff(bsff: Bsff, ctx?: GraphQLContext) {
  const { findUnique } = getReadonlyBsffRepository();
  const fullBsff = await findUnique({
    where: { id: bsff.id }
  });
  return indexBsd(toBsdElastic(fullBsff), ctx);
}
