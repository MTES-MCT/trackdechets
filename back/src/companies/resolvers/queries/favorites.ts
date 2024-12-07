import { FavoriteType, QueryResolvers } from "@td/codegen-back";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { Permission, checkUserPermissions } from "../../../permissions";
import {
  FavoriteIndexBody,
  client,
  getIndexFavoritesId,
  indexConfig
} from "../../../queue/jobs/indexFavorites";
import { isFRVat, isForeignVat, isSiret } from "@td/constants";
import { getCompanyOrCompanyNotFound } from "../../database";
import { errors, estypes } from "@elastic/elasticsearch";

const { ResponseError } = errors;

const favoritesResolver: QueryResolvers["favorites"] = async (
  parent,
  { orgId, type, allowForeignCompanies },
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  await getCompanyOrCompanyNotFound({ orgId });

  // retrieving company favorites is considered as a list operation on bsd because
  // getRecentPartners read all bsds for a given siret
  await checkUserPermissions(
    user,
    [orgId].filter(Boolean),
    Permission.BsdCanList,
    `Vous n'êtes pas membre de l'entreprise portant l'identifiant "${orgId}".`
  );

  if (isForeignVat(orgId) && allowForeignCompanies === false) {
    return [];
  }

  const id = getIndexFavoritesId({
    orgId: `${orgId}`,
    type: `${type}` as FavoriteType
  });
  try {
    const { body } = await client.get<estypes.GetResponse<FavoriteIndexBody>>({
      index: indexConfig.alias,
      id
    });
    if (!body._source) {
      throw new Error(
        `Missing _source in ElasticSearch body for GET /favorites/${id}`
      );
    }
    const { favorites } = body._source!;
    // allowForeignCompanies is optional and true by default
    return favorites
      ? favorites.filter(fav => {
          return (
            (allowForeignCompanies === true && isForeignVat(fav.orgId)) ||
            isSiret(fav.orgId) ||
            isFRVat(fav.orgId)
          );
        })
      : [];
  } catch (error) {
    if (error instanceof ResponseError && error.meta.statusCode === 404) {
      return [];
    }
    throw error;
  }
};

export default favoritesResolver;
