import { GraphQLContext } from "../../../types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { prisma } from "@td/prisma";
import { Prisma } from "@prisma/client";
import {
  IncomingTexsLine,
  IncomingWasteLine,
  ManagedLine,
  OutgoingTexsLine,
  OutgoingWasteLine,
  QueryRegistryLookupsArgs,
  SsdLine,
  TransportedLine
} from "@td/codegen-back";
import { Permission, checkUserPermissions } from "../../../permissions";
import {
  getLookupsFilterInfos,
  getTypeFilter,
  getTypeFromLookup
} from "./utils/registryLookup.util";
import { getRelativeConnection } from "../../../common/pagination";

export async function registryLookups(
  _,
  { siret, type, publicId, ...gqlPaginationArgs }: QueryRegistryLookupsArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const { siretsThatCanAccessLookup, reportAsSiretsFilter } =
    await getLookupsFilterInfos({ siret, userId: user.id });

  await checkUserPermissions(
    user,
    siretsThatCanAccessLookup,
    Permission.RegistryCanRead,
    `Vous n'êtes pas autorisé à lire des données du registre`
  );

  return getRelativeConnection(
    {
      findMany: prismaPaginationArgs => {
        const { cursor, ...rest } = prismaPaginationArgs;
        return prisma.registryLookup.findMany({
          where: {
            siret,
            ...(reportAsSiretsFilter.length > 0 && {
              reportAsSiret: { in: reportAsSiretsFilter }
            }),
            declarationType: "REGISTRY",
            ...getTypeFilter(type),
            ...(publicId && {
              readableId: {
                contains: publicId,
                mode: "insensitive"
              }
            })
          },
          ...rest,
          ...(cursor && { cursor: { declaredAtId: cursor.declaredAtId } }),
          orderBy: { declaredAtId: "desc" },
          include: {
            registrySsd: true,
            registryIncomingWaste: true,
            registryIncomingTexs: true,
            registryOutgoingWaste: true,
            registryOutgoingTexs: true,
            registryTransported: true,
            registryManaged: true
          }
        });
      },
      formatNode: (
        lookup: Prisma.RegistryLookupGetPayload<{
          include: {
            registrySsd: true;
            registryIncomingWaste: true;
            registryIncomingTexs: true;
            registryOutgoingWaste: true;
            registryOutgoingTexs: true;
            registryTransported: true;
            registryManaged: true;
          };
        }>
      ) => ({
        ...lookup,
        publicId: lookup.readableId,
        type: type ?? getTypeFromLookup(lookup),
        ssd: (lookup.registrySsd as SsdLine) ?? null,
        incomingWaste:
          (lookup.registryIncomingWaste as IncomingWasteLine) ?? null,
        incomingTexs: (lookup.registryIncomingTexs as IncomingTexsLine) ?? null,
        outgoingWaste:
          (lookup.registryOutgoingWaste as OutgoingWasteLine) ?? null,
        outgoingTexs: (lookup.registryOutgoingTexs as OutgoingTexsLine) ?? null,
        managedWaste: (lookup.registryManaged as ManagedLine) ?? null,
        transportedWaste:
          (lookup.registryTransported as TransportedLine) ?? null
      }),
      ...gqlPaginationArgs
    },
    "declaredAtId"
  );
}
