import { UserInputError } from "apollo-server-core";
import {
  BsdWhere,
  DateFilter,
  StringFilter,
  StringNullableListFilter,
  TextFilter
} from "../generated/graphql/types";

function toElasticTextQuery(
  fieldName: string,
  textFilter: TextFilter | undefined
) {
  if (!textFilter) {
    return undefined;
  }
  return {
    match: { [fieldName]: { query: textFilter._match, fuzziness: "AUTO" } }
  };
}

function toElasticStringQuery(
  fieldName: string,
  stringFilter: StringFilter | undefined
) {
  if (!stringFilter) {
    return undefined;
  }

  if (stringFilter._eq) {
    return { term: { [fieldName]: stringFilter._eq } };
  }

  if (stringFilter._contains) {
    return {
      match: {
        [`${fieldName}.ngram`]: {
          // upper limit 3 should be the same as max_gram in ngram_tokenizer
          query: stringFilter._contains.match(/.{1,5}/g).join(" "),
          operator: "and"
        }
      }
    };
  }

  if (stringFilter._in) {
    return { terms: { [fieldName]: stringFilter._in } };
  }
}

function toElasticStringListQuery(
  fieldName: string,
  stringListFilter: StringNullableListFilter | undefined
) {
  if (!stringListFilter) {
    return undefined;
  }

  if (stringListFilter._hasEvery) {
    return {
      bool: {
        must: stringListFilter._hasEvery.map(value => ({
          term: { [fieldName]: value }
        }))
      }
    };
  }

  if (stringListFilter._hasSome || stringListFilter._in) {
    return {
      terms: {
        [fieldName]: stringListFilter._hasSome ?? stringListFilter._in
      }
    };
  }

  if (stringListFilter._has) {
    return { term: { [fieldName]: stringListFilter._has } };
  }

  if (stringListFilter._itemContains) {
    return {
      match: {
        [`${fieldName}.ngram`]: {
          query: stringListFilter._itemContains,
          operator: "and"
        }
      }
    };
  }

  throw new UserInputError("_eq n'est pas implémenté sur la query `bsds`");
}

function toElasticDateQuery(
  fieldName: string,
  dateFilter: DateFilter | undefined
) {
  if (!dateFilter) {
    return undefined;
  }

  if (dateFilter._eq) {
    return { match: { [fieldName]: dateFilter._eq } };
  }

  return {
    range: {
      [fieldName]: {
        ...(dateFilter._gt ? { gt: dateFilter._gt.getTime() } : {}),
        ...(dateFilter._gte ? { gte: dateFilter._gte.getTime() } : {}),
        ...(dateFilter._lt ? { lt: dateFilter._lt.getTime() } : {}),
        ...(dateFilter._lte ? { lte: dateFilter._lte.getTime() } : {})
      }
    }
  };
}

export function toElasticSimpleQuery(where: BsdWhere) {
  return {
    bool: {
      must: [
        toElasticStringQuery("type", where.type),
        toElasticStringQuery("id", where.id),
        toElasticStringQuery("readableId", where.readableId),
        toElasticDateQuery("createdAt", where.createdAt),
        toElasticDateQuery("updatedAt", where.updatedAt),
        toElasticStringQuery("customId", where.customId),
        toElasticStringQuery("status", where.status),
        toElasticStringQuery("wasteCode", where.wasteCode),
        toElasticTextQuery("wasteAdr", where.wasteAdr),
        toElasticTextQuery("wasteDescription", where.wasteDescription),
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
        toElasticTextQuery("emitterCustomInfo", where.emitterCustomInfo),
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
          where.transporterCustomInfo
        ),
        toElasticStringListQuery(
          "transporterTransportPlates",
          where.transporterTransportPlates
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
          where.destinationCustomInfo
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

export function toElasticQuery(where: BsdWhere): Record<string, any> {
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
