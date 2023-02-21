import { UserInputError } from "apollo-server-core";
import {
  GET_BSDS_CUSTOM_INFO_MAX_LENGTH,
  GET_BSDS_PLATES_MAX_LENGTH,
  GET_BSDS_READABLE_ID_MAX_LENGTH,
  GET_BSDS_WASTE_MAX_LENGTH
} from "../common/constants/GET_BSDS_CONSTANTS";
import {
  toElasticDateQuery,
  toElasticStringListQuery,
  toElasticStringQuery,
  toElasticTextQuery
} from "../common/where";
import { BsdWhere } from "../generated/graphql/types";
import { QueryDslQueryContainer } from "@elastic/elasticsearch/api/types";

export function toElasticSimpleQuery(where: BsdWhere): QueryDslQueryContainer {
  return {
    bool: {
      must: [
        toElasticStringQuery("type", where.type),
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
        toElasticStringQuery("wasteCode", where.wasteCode),
        toElasticTextQuery("wasteAdr", where.wasteAdr),
        toElasticTextQuery(
          "wasteDescription",
          where.wasteDescription,
          GET_BSDS_WASTE_MAX_LENGTH
        ),
        toElasticStringListQuery("packagingNumbers", where.packagingNumbers),
        toElasticStringListQuery("wasteSealNumbers", where.wasteSealNumbers),
        toElasticStringListQuery(
          "identificationNumbers",
          where.identificationNumbers
        ),
        toElasticStringListQuery(
          "ficheInterventionNumbers",
          where.ficheInterventionNumbers
        ),
        toElasticTextQuery("emitterCompanyName", where.emitterCompanyName),
        toElasticStringQuery("emitterCompanySiret", where.emitterCompanySiret),
        toElasticTextQuery(
          "emitterCompanyAddress",
          where.emitterCompanyAddress
        ),
        toElasticTextQuery(
          "emitterPickupSiteName",
          where.emitterPickupSiteName
        ),
        toElasticTextQuery(
          "emitterPickupSiteAddress",
          where.emitterPickupSiteAddress
        ),
        toElasticTextQuery(
          "emitterCustomInfo",
          where.emitterCustomInfo,
          GET_BSDS_CUSTOM_INFO_MAX_LENGTH
        ),
        toElasticTextQuery("workerCompanyName", where.workerCompanyName),
        toElasticStringQuery("workerCompanySiret", where.workerCompanySiret),
        toElasticTextQuery("workerCompanyAddress", where.workerCompanyAddress),
        toElasticTextQuery(
          "transporterCompanyName",
          where.transporterCompanyName
        ),
        toElasticStringQuery(
          "transporterCompanySiret",
          where.transporterCompanySiret
        ),
        toElasticStringQuery(
          "transporterCompanyVatNumber",
          where.transporterCompanyVatNumber
        ),
        toElasticTextQuery(
          "transporterCompanyAddress",
          where.transporterCompanyAddress
        ),
        toElasticTextQuery(
          "transporterCustomInfo",
          where.transporterCustomInfo,
          GET_BSDS_CUSTOM_INFO_MAX_LENGTH
        ),
        toElasticStringListQuery(
          "transporterTransportPlates",
          where.transporterTransportPlates,
          GET_BSDS_PLATES_MAX_LENGTH
        ),
        toElasticTextQuery(
          "destinationCompanyName",
          where.destinationCompanyName
        ),
        toElasticStringQuery(
          "destinationCompanySiret",
          where.destinationCompanySiret
        ),
        toElasticTextQuery(
          "destinationCompanyAddress",
          where.destinationCompanyAddress
        ),
        toElasticTextQuery(
          "destinationCustomInfo",
          where.destinationCustomInfo,
          GET_BSDS_CUSTOM_INFO_MAX_LENGTH
        ),
        toElasticTextQuery("destinationCap", where.destinationCap),
        toElasticTextQuery("brokerCompanyName", where.brokerCompanyName),
        toElasticStringQuery("brokerCompanySiret", where.brokerCompanySiret),
        toElasticTextQuery("brokerCompanyAddress", where.brokerCompanyAddress),
        toElasticTextQuery("traderCompanyName", where.traderCompanyName),
        toElasticStringQuery("traderCompanySiret", where.traderCompanySiret),
        toElasticTextQuery("traderCompanyAddress", where.traderCompanyAddress),
        toElasticTextQuery("ecoOrganismeName", where.ecoOrganismeName),
        toElasticStringQuery("ecoOrganismeSiret", where.ecoOrganismeSiret),
        toElasticTextQuery(
          "nextDestinationCompanyName",
          where.nextDestinationCompanyName
        ),
        toElasticStringQuery(
          "nextDestinationCompanySiret",
          where.nextDestinationCompanySiret
        ),
        toElasticStringQuery(
          "nextDestinationCompanyVatNumber",
          where.nextDestinationCompanyVatNumber
        ),
        toElasticTextQuery(
          "nextDestinationCompanyAddress",
          where.nextDestinationCompanyAddress
        ),
        toElasticStringQuery(
          "destinationOperationCode",
          where.destinationOperationCode
        ),
        toElasticDateQuery("emitterEmissionDate", where.emitterEmissionDate),
        toElasticDateQuery("workerWorkDate", where.workerWorkDate),
        toElasticDateQuery(
          "transporterTransportTakenOverAt",
          where.transporterTransportTakenOverAt
        ),
        toElasticDateQuery(
          "destinationReceptionDate",
          where.destinationReceptionDate
        ),
        toElasticDateQuery(
          "destinationAcceptationDate",
          where.destinationAcceptationDate
        ),
        toElasticDateQuery(
          "destinationOperationDate",
          where.destinationOperationDate
        ),
        toElasticStringListQuery("sirets", where.sirets)
      ].filter(f => !!f)
    }
  };
}

export function toElasticQuery(where: BsdWhere): QueryDslQueryContainer {
  function inner(where: BsdWhere, depth = 0) {
    if (depth > 2) {
      throw new NestingWhereError(2);
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
          must: [
            ...(simpleQuery.bool.must as QueryDslQueryContainer[]),
            ...arrayToInner(_and)
          ],
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
