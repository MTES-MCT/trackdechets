import { ApiResponse, estypes } from "@elastic/elasticsearch";
import type {
  QueryResolvers,
  QueryBsdsArgs,
  OrderType
} from "@td/codegen-back";
import { applyAuthStrategies, AuthType } from "../../../auth/auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { client, BsdElastic, index } from "../../../common/elastic";

import { bsdSearchSchema } from "../../validation";
import { toElasticQuery } from "../../where";
import { Permission, can, getUserRoles } from "../../../permissions";

import { QueryContainer } from "@elastic/elasticsearch/api/types";
import { GraphQLContext } from "../../../types";
import { buildResponse } from "./helpers";

export interface GetResponse<T> {
  _source: T;
}

/**
 *
 * @param param0
 * @param user
 * @returns
 */
async function buildQuery(
  { clue, where = {} }: QueryBsdsArgs,
  user: Express.User
) {
  const query: {
    bool: estypes.BoolQuery & {
      filter: estypes.QueryContainer[];
    };
  } = {
    bool: {
      ...toElasticQuery(where!).bool,
      filter: []
    }
  };

  const tabsQuery: Array<QueryContainer> = [];

  Object.entries({
    isDraftFor: where?.isDraftFor,
    isForActionFor: where?.isForActionFor,
    isFollowFor: where?.isFollowFor,
    isArchivedFor: where?.isArchivedFor,
    isToCollectFor: where?.isToCollectFor,
    isCollectedFor: where?.isCollectedFor,
    isPendingRevisionFor: where?.isPendingRevisionFor,
    isEmittedRevisionFor: where?.isEmittedRevisionFor,
    isReceivedRevisionFor: where?.isReceivedRevisionFor,
    isReviewedRevisionFor: where?.isReviewedRevisionFor,
    isReturnFor: where?.isReturnFor
  })
    .filter(([_, value]) => value != null)
    .forEach(([key, value]) => {
      if (Array.isArray(query.bool.filter)) {
        tabsQuery.push({
          terms: {
            [key]: value!
          }
        });
      }
    });

  // Permet de filtrer sur un ensemble de catégories en même temps
  // pour l'affichage des catégories parentes dans la v2 du dashboard
  // On veut par exemple pouvoir afficher une catégorie "Transport" qui
  // regroupe les bordereaux "En attente de collecte" et les bordereaux
  // "Collecté".

  // query { bsds(
  //  where: {
  //    isToCollectFor: [<SIRET>],
  //    isCollectedFor: [<SIRET>]}
  // )
  // { id } }

  if (tabsQuery.length > 0) {
    query.bool.filter.push({ bool: { should: tabsQuery } });
  }

  if (clue) {
    (query.bool.must as estypes.QueryContainer[]).push({
      multi_match: {
        query: clue,
        fields: [
          "readableId",
          "emitterCompanyName",
          "destinationCompanyName",
          "wasteDescription"
        ],
        fuzziness: "AUTO"
      }
    });
  }

  // Limit the scope of what the user can see to their companies
  const roles = await getUserRoles(user.id);
  const orgIdsWithListPermission = Object.keys(roles).filter(orgId =>
    can(roles[orgId], Permission.BsdCanList)
  );

  query.bool.filter.push({
    terms: {
      sirets: orgIdsWithListPermission
    }
  });

  return query;
}

/**
 * Returns the keyword field matching the given fieldName.
 *
 * e.g passing "readableId" returns "readableId.keyword",
 *     because "redableId" is a "text" with a sub field "readableId.keyword" which is a keyword.
 *
 * e.g passing "id" returns "id", because it's already a keyword.
 *
 * This is useful for context where we are given a property but need to use its keyword counterpart.
 * For example when sorting, where it's not possible to sort on text fields.
 */
function getKeywordFieldNameFromName(fieldName: keyof BsdElastic): string {
  const property = index.mappings.properties[fieldName];

  if (property.type === "keyword") {
    // this property is of type "keyword" itself, it can be used as such
    return fieldName;
  }

  // look for a sub field with the type "keyword"
  const [subFieldName] =
    Object.entries(property.fields || {}).find(
      ([_, property]) => property.type === "keyword"
    ) ?? [];

  if (subFieldName == null) {
    throw new Error(
      `The field "${fieldName}" is not of type "keyword" and has no sub fields of that type.`
    );
  }

  return `${fieldName}.${subFieldName}`;
}

/**
 * Returns the root field name matching keywordFieldName.
 * It's the opposite of getKeywordFieldNameFromName.
 *
 * e.g passing "readableId.keyword" returns "readableId",
 *     because "readableId.keyword" is a sub field, the actual field is "readableId".
 *
 * e.g passing "id" returns "id", because "id" is the root field.
 *
 * This is useful for context where a key has been turned into its keyword counterpart
 * but we need to access the value of a document based on it.
 * For example when constructing the "search_after" array from the "sort" array.
 */
function getFieldNameFromKeyword(keywordFieldName: string): keyof BsdElastic {
  const [fieldName] = keywordFieldName.split(".");

  if (index.mappings.properties[fieldName] == null) {
    throw new Error(
      `The field "${keywordFieldName}" doesn't match a property declared in the mappings.`
    );
  }
  return fieldName as keyof BsdElastic;
}

function buildSort({ orderBy = {} }: QueryBsdsArgs) {
  const sort: Array<Record<string, OrderType>> = [
    { updatedAt: "DESC" },
    // id is used as last sort to deal with ties
    // (for documents whose sorting result is equal)
    { id: "ASC" }
  ];

  (
    Object.entries(orderBy!) as Array<[keyof typeof orderBy, OrderType]>
  ).forEach(([key, order]) => {
    sort.unshift({ [getKeywordFieldNameFromName(key)]: order });
  });

  return sort;
}

// search_after is an array that contains values from the document to search after
// it must list the values that are used in the sort array
// e.g if sort is [{ emitter: "asc" }, { id: "asc" }]
//     then search_after must be [after.emitter, after.id]
async function buildSearchAfter(
  args: QueryBsdsArgs,
  sort: ReturnType<typeof buildSort>
): Promise<string[] | undefined> {
  if (args.after == null) {
    return undefined;
  }

  const {
    body: { _source: bsd }
  }: ApiResponse<GetResponse<BsdElastic>> = await client.get({
    id: args.after,
    index: index.alias
  });
  // we need to lowercase bsd ids to make pagination work, as ids are lowercased by stringfield's normalizer and
  // appear as such in result sort
  const lowerCaseStr = el => {
    if (typeof el === "string") {
      return el.toLowerCase();
    }
    return el;
  };

  return sort.reduce(
    (acc, item) =>
      acc.concat(
        Object.entries(item).map(([key]) =>
          lowerCaseStr(bsd[getFieldNameFromKeyword(key)])
        )
      ),
    [] as string[]
  );
}

const bsdsResolver: QueryResolvers["bsds"] = async (_, args, context) => {
  // This query is restricted to Session users (UI) and government accounts (gerico)
  applyAuthStrategies(context, [AuthType.Session]);

  const user = checkIsAuthenticated(context);

  const MIN_SIZE = 0;
  const MAX_SIZE = 100;
  const { first = MAX_SIZE } = args;
  const size = Math.max(Math.min(first!, MAX_SIZE), MIN_SIZE);

  await bsdSearchSchema.validate(args.where, { abortEarly: false });

  const query = await buildQuery(args, user);
  const sort = buildSort(args);
  const search_after = await buildSearchAfter(args, sort);
  return buildResponse({ query, size, sort, search_after });
};

/**
 * Fonction utilitaire permettant de déterminer au sein d'un resolver
 * si la query parente est bien `bsds`. Voir par exemple le resolver `Bsda`
 * dans lequel certains champs (`groupedIn`, `forwardedIn`) ne sont pas
 * recalculé si la query est `bsds`.
 */
export function isGetBsdsQuery(context: GraphQLContext): boolean {
  const gqlInfos = context?.req?.gqlInfos;
  if (gqlInfos && gqlInfos.length === 1 && gqlInfos[0].name === "bsds") {
    return true;
  }
  return false;
}

export default bsdsResolver;
