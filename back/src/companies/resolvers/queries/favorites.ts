import { FavoriteType, QueryResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { Permission, checkUserPermissions } from "../../../permissions";
import {
  FavoriteIndexBody,
  client,
  getIndexFavoritesId,
  indexConfig
} from "../../../queue/jobs/indexFavorites";

const favoritesResolver: QueryResolvers["favorites"] = async (
  parent,
  { orgId, type },
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  await prisma.company.findUniqueOrThrow({
    where: {
      orgId
    }
  });
  // retrieving company favorites is considered as a list operation on bsd beacause
  // getRecentPartners read all bsds for a given siret
  await checkUserPermissions(
    user,
    [orgId].filter(Boolean),
    Permission.BsdCanList,
    `Vous n'êtes pas membre de l'entreprise portant l'identifiant "${orgId}".`
  );

  const { body } = await client.get<FavoriteIndexBody>({
    index: indexConfig.alias,
    id: getIndexFavoritesId({
      orgId: `${orgId}`,
      type: `${type}` as FavoriteType
    })
  });
  const { favorites } = body;
  return favorites;
};

export default favoritesResolver;
