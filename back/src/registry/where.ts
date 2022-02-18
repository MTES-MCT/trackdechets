import { QueryDslQueryContainer } from "@elastic/elasticsearch/api/types";
import { UserInputError } from "apollo-server-express";
import { BsdElastic } from "../common/elastic";
import {
  BsdTypeFilter,
  DateFilter,
  NumericFilter,
  StringFilter,
  WasteRegistryWhere
} from "../generated/graphql/types";

/**
 * Convert WasteRegistryFilter into elastic query filter
 */
export function toElasticFilter(
  where: WasteRegistryWhere
): QueryDslQueryContainer[] {
  let filter: QueryDslQueryContainer[] = [];
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
        "transporterTakenOverAt",
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
        "destinationReceptionWeight",
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
  if (dateFilter._eq) {
    return { term: { [fieldName]: dateFilter._eq.getTime() } };
  }
  if (dateFilter._gt || dateFilter._gte || dateFilter._lt || dateFilter._lte) {
    if (dateFilter._gt && dateFilter._gte) {
      throw new UserInputError(
        "Vous ne pouvez pas filtrer par _gt et _gte en même temps"
      );
    }
    if (dateFilter._lt && dateFilter._lte) {
      throw new UserInputError(
        "Vous ne pouvez pas filtrer par _lt et _lte en même temps"
      );
    }
    // `where` argument may have been serialized in Redis, so we need to call new Date()
    return {
      range: {
        [fieldName]: {
          ...(dateFilter._gt ? { gt: new Date(dateFilter._gt).getTime() } : {}),
          ...(dateFilter._gte
            ? { gte: new Date(dateFilter._gte).getTime() }
            : {}),
          ...(dateFilter._lt ? { lt: new Date(dateFilter._lt).getTime() } : {}),
          ...(dateFilter._lte
            ? { lte: new Date(dateFilter._lte).getTime() }
            : {})
        }
      }
    };
  }
  return {};
}

function stringFilterToElasticFilter(
  fieldName: keyof BsdElastic,
  stringFilter: StringFilter
): QueryDslQueryContainer {
  if (stringFilter._eq) {
    return { term: { [fieldName]: stringFilter._eq } };
  }
  if (stringFilter._in) {
    return { terms: { [fieldName]: stringFilter._in } };
  }
  if (stringFilter._contains) {
    return {
      wildcard: { [fieldName]: { value: `*${stringFilter._contains}*` } }
    };
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
