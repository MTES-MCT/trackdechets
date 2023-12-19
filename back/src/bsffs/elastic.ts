import { Bsff, BsffStatus, BsdType } from "@prisma/client";
import { BsdElastic, indexBsd, transportPlateFilter } from "../common/elastic";
import { GraphQLContext } from "../types";
import { getRegistryFields } from "./registry";
import { toBsffDestination } from "./compat";
import { getTransporterCompanyOrgId } from "shared/constants";
import {
  BsffWithFicheInterventions,
  BsffWithPackagings,
  BsffWithPackagingsInclude,
  BsffWithFicheInterventionInclude
} from "./types";
import { prisma } from "@td/prisma";

export type BsffForElastic = Bsff &
  BsffWithPackagings &
  BsffWithFicheInterventions;

export const BsffForElasticInclude = {
  ...BsffWithPackagingsInclude,
  ...BsffWithFicheInterventionInclude
};

export async function getBsffForElastic(
  bsda: Pick<Bsff, "id">
): Promise<BsffForElastic> {
  return prisma.bsff.findUniqueOrThrow({
    where: { id: bsda.id },
    include: BsffForElasticInclude
  });
}

export function toBsdElastic(bsff: BsffForElastic): BsdElastic {
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
    destinationOperationMode: undefined,

    emitterEmissionDate: bsff.emitterEmissionSignatureDate?.getTime(),
    workerWorkDate: undefined,
    transporterTransportTakenOverAt:
      bsff.transporterTransportTakenOverAt?.getTime() ??
      bsff.transporterTransportSignatureDate?.getTime(),
    destinationReceptionDate: bsff.destinationReceptionDate?.getTime(),
    destinationAcceptationDate: bsffDestination?.receptionDate?.getTime(),
    destinationAcceptationWeight: bsffDestination?.receptionWeight,
    destinationOperationDate: bsffDestination?.operationDate?.getTime(),
    isDraftFor: [] as string[],
    isForActionFor: [] as string[],
    isFollowFor: [] as string[],
    isArchivedFor: [] as string[],
    isToCollectFor: [] as string[],
    isCollectedFor: [] as string[],
    isInRevisionFor: [] as string[],
    isRevisedFor: [] as string[],
    sirets: [
      bsff.emitterCompanySiret,
      bsff.transporterCompanySiret,
      bsff.destinationCompanySiret,
      ...bsff.detenteurCompanySirets
    ].filter(Boolean),
    ...getRegistryFields(bsff),
    rawBsd: bsff,

    // ALL actors from the BSFF, for quick search
    companyNames: [
      bsff.emitterCompanyName,
      bsff.transporterCompanyName,
      bsff.destinationCompanyName,
      ...bsff.ficheInterventions.map(fiche => fiche.detenteurCompanyName)
    ]
      .filter(Boolean)
      .join(" "),
    companyOrgIds: [
      bsff.emitterCompanySiret,
      bsff.transporterCompanySiret,
      bsff.transporterCompanyVatNumber,
      bsff.destinationCompanySiret,
      ...bsff.ficheInterventions.map(fiche => fiche.detenteurCompanySiret)
    ].filter(Boolean)
  };

  const transporterCompanyOrgId = getTransporterCompanyOrgId(bsff);
  if (bsff.isDraft) {
    bsd.isDraftFor.push(
      ...[
        bsff.emitterCompanySiret,
        getTransporterCompanyOrgId(bsff),
        bsff.destinationCompanySiret
      ].filter(Boolean)
    );
  } else {
    switch (bsff.status) {
      case BsffStatus.INITIAL: {
        if (bsff.emitterCompanySiret) {
          bsd.isForActionFor.push(bsff.emitterCompanySiret);
        }
        bsd.isFollowFor.push(
          ...[
            getTransporterCompanyOrgId(bsff),
            bsff.destinationCompanySiret,
            ...bsff.detenteurCompanySirets
          ].filter(Boolean)
        );
        break;
      }
      case BsffStatus.SIGNED_BY_EMITTER: {
        if (transporterCompanyOrgId) {
          bsd.isToCollectFor.push(transporterCompanyOrgId);
        }
        bsd.isFollowFor.push(
          ...[
            bsff.emitterCompanySiret,
            bsff.destinationCompanySiret,
            ...bsff.detenteurCompanySirets
          ].filter(Boolean)
        );
        break;
      }
      case BsffStatus.SENT: {
        if (transporterCompanyOrgId) {
          bsd.isCollectedFor.push(transporterCompanyOrgId);
        }
        bsd.isFollowFor.push(
          ...[bsff.emitterCompanySiret, ...bsff.detenteurCompanySirets].filter(
            Boolean
          )
        );
        if (bsff.destinationCompanySiret) {
          bsd.isForActionFor.push(bsff.destinationCompanySiret);
        }
        break;
      }
      case BsffStatus.RECEIVED:
      case BsffStatus.PARTIALLY_REFUSED:
      case BsffStatus.ACCEPTED: {
        bsd.isFollowFor.push(
          ...[
            bsff.emitterCompanySiret,
            getTransporterCompanyOrgId(bsff),
            ...bsff.detenteurCompanySirets
          ].filter(Boolean)
        );
        if (bsff.destinationCompanySiret) {
          bsd.isForActionFor.push(bsff.destinationCompanySiret);
        }
        break;
      }
      case BsffStatus.INTERMEDIATELY_PROCESSED: {
        bsd.isFollowFor.push(
          ...[
            bsff.emitterCompanySiret,
            getTransporterCompanyOrgId(bsff),
            bsff.destinationCompanySiret,
            ...bsff.detenteurCompanySirets
          ].filter(Boolean)
        );
        break;
      }
      case BsffStatus.REFUSED:
      case BsffStatus.PROCESSED: {
        bsd.isArchivedFor.push(
          ...[
            bsff.emitterCompanySiret,
            getTransporterCompanyOrgId(bsff),
            bsff.destinationCompanySiret,
            ...bsff.detenteurCompanySirets
          ].filter(Boolean)
        );
        break;
      }
      default:
        break;
    }
  }

  return bsd;
}

export async function indexBsff(bsff: BsffForElastic, ctx?: GraphQLContext) {
  return indexBsd(toBsdElastic(bsff), ctx);
}
