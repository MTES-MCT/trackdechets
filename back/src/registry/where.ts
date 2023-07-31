import { estypes } from "@elastic/elasticsearch";
import { BsdElastic } from "../common/elastic";
import { toElasticDateQuery, toElasticStringQuery } from "../common/where";
import {
  BsdTypeFilter,
  DateFilter,
  IdFilter,
  NumericFilter,
  StringFilter,
  WasteRegistryWhere
} from "../generated/graphql/types";
import { UserInputError } from "../common/errors";

type QueryDslQueryContainer = estypes.QueryDslQueryContainer;

/**
 * Convert WasteRegistryFilter into elastic query filter
 */
export function toElasticFilter(
  where: WasteRegistryWhere
): QueryDslQueryContainer[] {
  let filter: QueryDslQueryContainer[] = [];
  if (where.id) {
    filter = [
      ...filter,
      {
        bool: {
          should: [
            idFilterToElasticFilter("id", where.id),
            idFilterToElasticFilter("readableId" as any, where.id)
          ]
        }
      }
    ];
  }
  if (where.createdAt) {
    filter = [
      ...filter,
      dateFilterToElasticFilter("createdAt", where.createdAt)
    ];
  }
  if (where.transporterTakenOverAt) {
    filter = [
      ...filter,
      dateFilterToElasticFilter(
        "transporterTransportTakenOverAt",
        where.transporterTakenOverAt
      )
    ];
  }
  if (where.destinationReceptionDate) {
    filter = [
      ...filter,
      dateFilterToElasticFilter(
        "destinationReceptionDate",
        where.destinationReceptionDate
      )
    ];
  }
  if (where.destinationOperationDate) {
    filter = [
      ...filter,
      dateFilterToElasticFilter(
        "destinationOperationDate",
        where.destinationOperationDate
      )
    ];
  }

  if (where.emitterCompanySiret) {
    filter = [
      ...filter,
      stringFilterToElasticFilter(
        "emitterCompanySiret",
        where.emitterCompanySiret
      )
    ];
  }

  if (where.destinationCompanySiret) {
    filter = [
      ...filter,
      stringFilterToElasticFilter(
        "destinationCompanySiret",
        where.destinationCompanySiret
      )
    ];
  }

  if (where.transporterCompanySiret) {
    filter = [
      ...filter,
      stringFilterToElasticFilter(
        "transporterCompanySiret",
        where.transporterCompanySiret
      )
    ];
  }

  if (where.destinationCompanySiret) {
    filter = [
      ...filter,
      stringFilterToElasticFilter(
        "destinationCompanySiret",
        where.destinationCompanySiret
      )
    ];
  }

  if (where.wasteCode) {
    filter = [
      ...filter,
      stringFilterToElasticFilter("wasteCode", where.wasteCode)
    ];
  }

  if (where.destinationOperationCode) {
    filter = [
      ...filter,
      stringFilterToElasticFilter(
        "destinationOperationCode",
        where.destinationOperationCode
      )
    ];
  }

  if (where.destinationReceptionWeight) {
    filter = [
      ...filter,
      numericFilterToElasticFilter(
        "destinationAcceptationWeight",
        where.destinationReceptionWeight
      )
    ];
  }

  if (where.bsdType) {
    filter = [...filter, bsdTypeFilterToElasticFilter(where.bsdType)];
  }

  // filter out {} in case someone passed an empty filter like this { where: { wasteCode: {} } }
  filter = filter.filter(f => Object.entries(f).length > 0);

  return filter;
}

function dateFilterToElasticFilter(
  fieldName: keyof BsdElastic,
  dateFilter: DateFilter
): QueryDslQueryContainer {
  return toElasticDateQuery(fieldName, dateFilter) ?? {};
}

function stringFilterToElasticFilter(
  fieldName: keyof BsdElastic,
  stringFilter: StringFilter
): QueryDslQueryContainer {
  return toElasticStringQuery(fieldName, stringFilter) ?? {};
}

function idFilterToElasticFilter(
  fieldName: keyof BsdElastic,
  idFilter: IdFilter
) {
  if (idFilter._eq) {
    return { term: { [fieldName]: idFilter._eq } };
  }
  if (idFilter._in) {
    return { terms: { [fieldName]: idFilter._in } };
  }
  return {};
}

function numericFilterToElasticFilter(
  fieldName: keyof BsdElastic,
  numericFilter: NumericFilter
) {
  if (numericFilter._eq) {
    return { term: { [fieldName]: numericFilter._eq } };
  }
  if (
    numericFilter._gt ||
    numericFilter._gte ||
    numericFilter._lt ||
    numericFilter._lte
  ) {
    if (numericFilter._gt && numericFilter._gte) {
      throw new UserInputError(
        "Vous ne pouvez pas filtrer par _gt et _gte en même temps"
      );
    }
    if (numericFilter._lt && numericFilter._lte) {
      throw new UserInputError(
        "Vous ne pouvez pas filtrer par _lt et _lte en même temps"
      );
    }
    return {
      range: {
        [fieldName]: {
          ...(numericFilter._gt ? { gt: numericFilter._gt } : {}),
          ...(numericFilter._gte ? { gte: numericFilter._gte } : {}),
          ...(numericFilter._lt ? { lt: numericFilter._lt } : {}),
          ...(numericFilter._lte ? { lte: numericFilter._lte } : {})
        }
      }
    };
  }
  return {};
}

function bsdTypeFilterToElasticFilter(bsdTypeFilter: BsdTypeFilter) {
  if (bsdTypeFilter._eq) {
    return { term: { type: bsdTypeFilter._eq } };
  }
  if (bsdTypeFilter._in) {
    return { terms: { type: bsdTypeFilter._in } };
  }
  return {};
}
