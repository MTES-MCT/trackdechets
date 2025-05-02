import { GraphQLContext } from "../../../types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { prisma } from "@td/prisma";
import {
  IncomingTexsLine,
  IncomingWasteLine,
  ManagedLine,
  OutgoingTexsLine,
  OutgoingWasteLine,
  QueryRegistryLookupArgs,
  SsdLine,
  TransportedLine
} from "@td/codegen-back";
import { Permission, checkUserPermissions } from "../../../permissions";
import {
  getLookupsFilterInfos,
  getTypeFilter,
  getTypeFromLookup
} from "./utils/registryLookup.util";

export async function registryLookups(
  _,
  { siret, type, publicId }: QueryRegistryLookupArgs,
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

  const lookups = await prisma.registryLookup.findMany({
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
    orderBy: { declaredAt: "desc" },
    take: 10,
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
  return lookups.map(lookup => ({
    ...lookup,
    publicId: lookup.readableId,
    type: type ?? getTypeFromLookup(lookup),
    ssd: (lookup.registrySsd as SsdLine) ?? null,
    incomingWaste: (lookup.registryIncomingWaste as IncomingWasteLine) ?? null,
    incomingTexs: (lookup.registryIncomingTexs as IncomingTexsLine) ?? null,
    outgoingWaste: (lookup.registryOutgoingWaste as OutgoingWasteLine) ?? null,
    outgoingTexs: (lookup.registryOutgoingTexs as OutgoingTexsLine) ?? null,
    managedWaste: (lookup.registryManaged as ManagedLine) ?? null,
    transportedWaste: (lookup.registryTransported as TransportedLine) ?? null
  }));
}
