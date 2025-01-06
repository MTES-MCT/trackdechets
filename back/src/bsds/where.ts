import {
  GET_BSDS_CUSTOM_INFO_MAX_LENGTH,
  GET_BSDS_PLATES_MAX_LENGTH,
  GET_BSDS_READABLE_ID_MAX_LENGTH,
  GET_BSDS_WASTE_MAX_LENGTH
} from "@td/constants";
import {
  toElasticDateQuery,
  toElasticStringListQuery,
  toElasticStringQuery,
  toElasticTextQuery
} from "../common/where";
import type { BsdWhere } from "@td/codegen-back";
import { transportPlateFilter } from "../common/elastic";
import { estypes } from "@elastic/elasticsearch";
import { UserInputError } from "../common/errors";

export function toElasticSimpleQuery(where: BsdWhere) {
  return {
    bool: {
      must: [
        toElasticStringQuery("type", where.type),
        toElasticStringQuery("bsdSubType", where.bsdSubType),
        toElasticStringQuery("id", where.id, GET_BSDS_READABLE_ID_MAX_LENGTH),
        toElasticStringQuery(
          "readableId",
          where.readableId,
          GET_BSDS_READABLE_ID_MAX_LENGTH
        ),
        toElasticDateQuery("createdAt", where.createdAt),
        toElasticDateQuery("updatedAt", where.updatedAt),
        toElasticStringQuery("customId", where.customId),
        toElasticStringQuery("status", where.status),
        toElasticStringQuery("wasteCode", where.waste?.code),
        toElasticTextQuery("wasteAdr", where.waste?.adr),
        toElasticTextQuery(
          "wasteDescription",
          where.waste?.description,
          GET_BSDS_WASTE_MAX_LENGTH
        ),
        toElasticStringListQuery("packagingNumbers", where.packagingNumbers),
        toElasticStringListQuery("wasteSealNumbers", where.sealNumbers),
        toElasticStringListQuery(
          "identificationNumbers",
          where.identificationNumbers
        ),
        toElasticStringListQuery(
          "ficheInterventionNumbers",
          where.ficheInterventionNumbers
        ),
        toElasticTextQuery("emitterCompanyName", where.emitter?.company?.name),
        toElasticStringQuery(
          "emitterCompanySiret",
          where.emitter?.company?.siret
        ),
        toElasticTextQuery(
          "emitterCompanyAddress",
          where.emitter?.company?.address
        ),
        toElasticTextQuery(
          "emitterPickupSiteName",
          where.emitter?.pickupSite?.name
        ),
        toElasticTextQuery(
          "emitterPickupSiteAddress",
          where.emitter?.pickupSite?.address
        ),
        toElasticTextQuery(
          "emitterCustomInfo",
          where.emitter?.customInfo,
          GET_BSDS_CUSTOM_INFO_MAX_LENGTH
        ),
        toElasticTextQuery("workerCompanyName", where.worker?.company?.name),
        toElasticStringQuery(
          "workerCompanySiret",
          where.worker?.company?.siret
        ),
        toElasticTextQuery("workerCompanyAddress", where.worker?.company?.name),
        toElasticTextQuery(
          "transporterCompanyName",
          where.transporter?.company?.name
        ),
        toElasticStringQuery(
          "transporterCompanySiret",
          where.transporter?.company?.siret
        ),
        toElasticStringQuery(
          "transporterCompanyVatNumber",
          where.transporter?.company?.vatNumber
        ),
        toElasticTextQuery(
          "transporterCompanyAddress",
          where.transporter?.company?.address
        ),
        toElasticTextQuery(
          "transporterCustomInfo",
          where.transporter?.customInfo,
          GET_BSDS_CUSTOM_INFO_MAX_LENGTH
        ),
        toElasticStringListQuery(
          "transporterTransportPlates",
          where.transporter?.transport?.plates,
          GET_BSDS_PLATES_MAX_LENGTH,
          transportPlateFilter
        ),
        toElasticTextQuery(
          "destinationCompanyName",
          where.destination?.company?.name
        ),
        toElasticStringQuery(
          "destinationCompanySiret",
          where.destination?.company?.siret
        ),
        toElasticTextQuery(
          "destinationCompanyAddress",
          where.destination?.company?.address
        ),
        toElasticTextQuery(
          "destinationCustomInfo",
          where.destination?.customInfo,
          GET_BSDS_CUSTOM_INFO_MAX_LENGTH
        ),
        toElasticTextQuery("destinationCap", where.destination?.cap),
        toElasticTextQuery("brokerCompanyName", where.broker?.company?.name),
        toElasticStringQuery(
          "brokerCompanySiret",
          where.broker?.company?.siret
        ),
        toElasticTextQuery(
          "brokerCompanyAddress",
          where.broker?.company?.address
        ),
        toElasticTextQuery("traderCompanyName", where.trader?.company?.name),
        toElasticStringQuery(
          "traderCompanySiret",
          where.trader?.company?.siret
        ),
        toElasticTextQuery(
          "traderCompanyAddress",
          where.trader?.company?.address
        ),
        toElasticTextQuery("ecoOrganismeName", where.ecoOrganisme?.name),
        toElasticStringQuery("ecoOrganismeSiret", where.ecoOrganisme?.siret),
        toElasticTextQuery(
          "nextDestinationCompanyName",
          where.destination?.operation?.nextDestination?.company?.name
        ),
        toElasticStringQuery(
          "nextDestinationCompanySiret",
          where.destination?.operation?.nextDestination?.company?.siret
        ),
        toElasticStringQuery(
          "nextDestinationCompanyVatNumber",
          where.destination?.operation?.nextDestination?.company?.vatNumber
        ),
        toElasticTextQuery(
          "nextDestinationCompanyAddress",
          where.destination?.operation?.nextDestination?.company?.address
        ),
        toElasticStringQuery(
          "destinationOperationCode",
          where.destination?.operation?.code
        ),
        toElasticDateQuery(
          "emitterEmissionDate",
          where.emitter?.emission?.date
        ),
        toElasticDateQuery("workerWorkDate", where.worker?.work?.date),
        toElasticDateQuery(
          "transporterTransportTakenOverAt",
          where.transporter?.transport?.takenOverAt
        ),
        toElasticDateQuery(
          "destinationReceptionDate",
          where.destination?.reception?.date
        ),
        toElasticDateQuery(
          "destinationAcceptationDate",
          where.destination?.acceptation?.date
        ),
        toElasticDateQuery(
          "destinationOperationDate",
          where.destination?.operation?.date
        ),
        toElasticStringListQuery("sirets", where.sirets),
        toElasticTextQuery("companyNames", where.companyNames),
        toElasticStringListQuery("companyOrgIds", where.companyOrgIds)
      ].filter(Boolean)
    }
  };
}

const MAX_DEPTH = 3;
export function toElasticQuery(where: BsdWhere): estypes.QueryContainer {
  function inner(where: BsdWhere, depth = 0) {
    if (depth > MAX_DEPTH) {
      throw new NestingWhereError(MAX_DEPTH);
    }

    const { _and, _or, ...rest } = where;

    if (_and && _or) {
      throw new UserInputError(
        "Vous ne pouvez pas construire un filtre avec `_and` et `_or` au même niveau"
      );
    }

    if (_or && Object.keys(rest).length > 0) {
      throw new UserInputError(
        "Vous ne pouvez pas construire un filtre avec des champs au même niveau que `_or`"
      );
    }

    const arrayToInner = x => x.map(w => inner(w, depth + 1));

    const simpleQuery = toElasticSimpleQuery(rest);

    if (_and) {
      return {
        bool: {
          must: [...simpleQuery.bool.must, ...arrayToInner(_and)],
          should: []
        }
      };
    }

    if (_or) {
      return { bool: { must: [], should: arrayToInner(_or) } };
    }

    return simpleQuery;
  }
  return inner(where);
}

export class NestingWhereError extends UserInputError {
  constructor(depthLimit = 2) {
    super(
      `Vous ne pouvez pas imbriquer des opérations` +
        ` _and et _or sur plus de ${depthLimit} niveaux`
    );
  }
}
