import { GraphQLContext } from "../../../types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { prisma } from "@td/prisma";
import { QueryRegistryLookupArgs } from "@td/codegen-back";
import { Permission, checkUserPermissions } from "../../../permissions";
import {
  getLookupsFilterInfos,
  getTypeFilter,
  getTypeFromLookup
} from "./utils/registryLookup.util";

export async function registryLookups(
  _,
  { siret, type }: QueryRegistryLookupArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const { siretsThatCanAccessLookup, reportAsIdsFilter } =
    await getLookupsFilterInfos({ siret, userId: user.id });

  await checkUserPermissions(
    user,
    siretsThatCanAccessLookup,
    Permission.RegistryCanRead,
    `Vous n'êtes pas autorisé à lire des données du registre`
  );

  const lookups = await prisma.registryLookup.findMany({
    where: {
      siret,
      ...(reportAsIdsFilter.length > 0 && {
        reportAsId: { in: reportAsIdsFilter }
      }),
      declarationType: "REGISTRY",
      ...getTypeFilter(type)
    },
    orderBy: { createdAt: "desc" },
    take: 10
  });

  return lookups.map(lookup => ({
    ...lookup,
    publicId: lookup.readableId,
    type: type ?? getTypeFromLookup(lookup)
  }));
}
