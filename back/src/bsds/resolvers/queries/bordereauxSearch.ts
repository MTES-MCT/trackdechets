import type { QueryResolvers, QueryBordereauxSearchArgs } from "@td/codegen-back";
import { checkIsAuthenticated } from "../../../common/permissions";
import { hasGovernmentReadAllBsdsPermOrThrow } from "../../../permissions";
import { buildResponse } from "./helpers";
import { bordereauxSearchSchema } from "../../validation";

function buildQuery({ where }: QueryBordereauxSearchArgs) {
  const must: any[] = [];
  const filter: any[] = [];

  if (where?.readableId) {
    must.push({
      match: {
        "readableId.ngram": {
          query: where.readableId.match(/.{1,5}/g)?.join(" "),
          operator: "and"
        }
      }
    });
  }

  if (where?.code_dechet) {
  // Nettoie et split : "['10 13 09*', '15 01 11*']" → ["10 13 09*", "15 01 11*"]
  const codes = where.code_dechet
    .replace(/[\]['"]/g, "")
    .split(",")
    .map(c => c.trim())
    .filter(Boolean);

  if (codes.length === 1) {
    must.push({
      term: { wasteCode: codes[0] }
    });
  } else {
    must.push({
      terms: { wasteCode: codes }
    });
  }
}

if (where?.code_aiot) {
    must.push({
      bool: {
        should: [
          { term: { gerepId: where.code_aiot } },
          { term: { emitterCompanyGerepId: where.code_aiot } },
          { term: { destinationCompanyGerepId: where.code_aiot } }
        ],
        minimum_should_match: 1
      }
    });
  }

  if (where?.clue) {
    must.push({
      bool: {
        should: [
          { term: { sirets: where.clue } },
          { term: { emitterCompanySiret: where.clue } },
          { term: { destinationCompanySiret: where.clue } },
          { term: { transporterCompanySiret: where.clue } },
          { term: { transporterCompanyVatNumber: where.clue } },
          { term: { nextDestinationCompanyVatNumber: where.clue } }
        ],
        minimum_should_match: 1
      }
    });
  }

  if (where?.date_reception_debut || where?.date_reception_fin) {
    const range: any = {};
    if (where.date_reception_debut) range.gte = new Date(where.date_reception_debut).getTime();
    if (where.date_reception_fin) range.lte = new Date(where.date_reception_fin).getTime();
    
    filter.push({
      range: {
        destinationReceptionDate: range
      }
    });
  }

  if (where?.date_expedition_debut || where?.date_expedition_fin) {
    const range: any = {};
    if (where.date_expedition_debut) range.gte = new Date(where.date_expedition_debut).getTime();
    if (where.date_expedition_fin) range.lte = new Date(where.date_expedition_fin).getTime();

    filter.push({
      range: {
        transporterTransportTakenOverAt: range
      }
    });
  }

  return {
    bool: {
      must,
      filter
    }
  };
}

const bordereauxSearchResolver: QueryResolvers["bordereauxSearch"] = async (
  _,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  await hasGovernmentReadAllBsdsPermOrThrow(user);

  const MIN_SIZE = 0;
  const MAX_SIZE = 300;
  const { first = MAX_SIZE } = args;
  const size = Math.max(Math.min(first!, MAX_SIZE), MIN_SIZE);

  bordereauxSearchSchema.parse(args.where);

  const query = buildQuery(args);

  const sort = { id: "ASC" };
  const search_after = args?.after ? [args.after] : undefined;

  return buildResponse({ query, size, sort, search_after });
};

export default bordereauxSearchResolver;
