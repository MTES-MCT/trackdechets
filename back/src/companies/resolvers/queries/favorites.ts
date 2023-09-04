import { FavoriteType, QueryResolvers } from "../../../generated/graphql/types";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { Permission, checkUserPermissions } from "../../../permissions";
import {
  FavoriteIndexBody,
  client,
  getIndexFavoritesId,
  indexConfig
} from "../../../queue/jobs/indexFavorites";
import {
  isFRVat,
  isForeignVat,
  isSiret
} from "../../../common/constants/companySearchHelpers";
import { getCompanyOrCompanyNotFound } from "../../database";
import { estypes } from "@elastic/elasticsearch";

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

  const { body } = await client.get<estypes.GetResponse<FavoriteIndexBody>>({
    index: indexConfig.alias,
    id: getIndexFavoritesId({
      orgId: `${orgId}`,
      type: `${type}` as FavoriteType
    })
  });
  const { favorites } = body._source!;
  // allowForeignCompanies is optionnal and true by default
  return favorites
    ? favorites.filter(
        fav =>
          allowForeignCompanies === undefined ||
          (allowForeignCompanies === true && isForeignVat(fav.orgId)) ||
          (allowForeignCompanies === false &&
            (isSiret(orgId) || isFRVat(orgId)))
      )
    : [];
};

export default favoritesResolver;
