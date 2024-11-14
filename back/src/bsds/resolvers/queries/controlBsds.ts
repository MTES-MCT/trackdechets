import {
  QueryResolvers,
  QueryControlBsdsArgs
} from "../../../generated/graphql/types";

import { checkIsAuthenticated } from "../../../common/permissions";

import { hasGovernmentReadAllBsdsPermOrThrow } from "../../../permissions";
import { buildResponse } from "./helpers";
import { controlBsdSearchSchema } from "../../validation";

/**
 *
 * @param where
 * plate
 * readableId
 * siret
 * Cette query est destinée à la fiche établissement. Elle permet de faire une recherche par siret/plaque ou par readableId.
 * Pour la recherche par siret/plaque, seuls les bsds en transit (isCollectedFor ou isReturnFor) sont inclus.
 * Pour la recherche par readableId, tous les bsds hors draft sont inclus.
 */
function buildQuery({ where }: QueryControlBsdsArgs) {
  const must: any[] = [];
  const must_not: any[] = [];
  const should: any[] = [];

  if (where?.siret) {
    must.push({
      bool: {
        should: [
          {
            terms: {
              isCollectedFor: [where.siret]
            }
          },
          {
            terms: {
              isReturnFor: [where.siret]
            }
          }
        ]
      }
    });
  } else if (!where?.readableId) {
    must.push({
      bool: {
        should: [
          {
            bool: {
              must: {
                exists: {
                  field: "isReturnFor"
                }
              }
            }
          },
          {
            bool: {
              must: {
                exists: {
                  field: "isCollectedFor"
                }
              }
            }
          }
        ]
      }
    });
  }
  if (where?.plate) {
    must.push({
      match: {
        "transporterTransportPlates.ngram": {
          query:
            where.plate
              .replace(/-/g, "")
              .match(/.{1,5}/g)
              ?.join(" ") ?? "",
          operator: "and"
        }
      }
    });
  }

  if (where?.readableId) {
    must_not.push({
      match: {
        status: "DRAFT"
      }
    });
    must.push({
      match: {
        "readableId.ngram": {
          query: where.readableId.match(/.{1,5}/g)?.join(" "),
          operator: "and"
        }
      }
    });
  }
  const query = {
    bool: {
      must,
      must_not,
      filter: [
        {
          bool: {
            should
          }
        }
      ]
    }
  };

  return query;
}

/**
 * Recherche des bds indexés dans ES pour l'api destinée à la fiche d'inspection
 * Version simplifiée et modifiée de la query bsds.
 *
 * Query limitée aux users associés à un government account disposant des permissions adéquates (BSDS_CAN_READ_ALL)
 *
 * Les bsds retournés figurent obligatoirement dans l'onglet collectés ou retour
 * Recherche possible par siret (transporteur), plaque d'immatriculation ou numéro de bsd.
 *
 */
const controlBsdsResolver: QueryResolvers["controlBsds"] = async (
  _,
  args,
  context
) => {
  // This query is dedicated to government accounts (gerico)

  const user = checkIsAuthenticated(context);

  await hasGovernmentReadAllBsdsPermOrThrow(user);

  const MIN_SIZE = 0;
  const MAX_SIZE = 300;
  const { first = MAX_SIZE } = args;
  const size = Math.max(Math.min(first!, MAX_SIZE), MIN_SIZE);

  controlBsdSearchSchema.parse(args.where);

  const query = buildQuery(args);

  const sort = { id: "ASC" };
  const search_after = args?.after ? [args.after] : undefined;

  return buildResponse({ query, size, sort, search_after });
};

export default controlBsdsResolver;
