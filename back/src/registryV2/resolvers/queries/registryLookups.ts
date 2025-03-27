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
import { exportOptions } from "@td/registry";

export async function registryLookups(
  _,
  { siret, type }: QueryRegistryLookupArgs,
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
      ...getTypeFilter(type)
    },
    orderBy: { dateId: "desc" },
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
    ssd:
      lookup.registrySsd && exportOptions.SSD?.toSsdWaste
        ? exportOptions.SSD.toSsdWaste(lookup.registrySsd)
        : null,
    incomingWaste:
      lookup.registryIncomingWaste &&
      exportOptions.INCOMING_WASTE?.toIncomingWaste
        ? exportOptions.INCOMING_WASTE.toIncomingWaste(
            lookup.registryIncomingWaste
          )
        : null,
    incomingTexs:
      lookup.registryIncomingTexs &&
      exportOptions.INCOMING_TEXS?.toIncomingWaste
        ? exportOptions.INCOMING_TEXS.toIncomingWaste(
            lookup.registryIncomingTexs
          )
        : null,
    outgoingWaste:
      lookup.registryOutgoingWaste &&
      exportOptions.OUTGOING_WASTE?.toOutgoingWaste
        ? exportOptions.OUTGOING_WASTE.toOutgoingWaste(
            lookup.registryOutgoingWaste
          )
        : null,
    outgoingTexs:
      lookup.registryOutgoingTexs &&
      exportOptions.OUTGOING_TEXS?.toOutgoingWaste
        ? exportOptions.OUTGOING_TEXS.toOutgoingWaste(
            lookup.registryOutgoingTexs
          )
        : null,
    managedWaste:
      lookup.registryManaged && exportOptions.MANAGED?.toManagedWaste
        ? exportOptions.MANAGED.toManagedWaste(lookup.registryManaged)
        : null,
    transportedWaste:
      lookup.registryTransported &&
      exportOptions.TRANSPORTED?.toTransportedWaste
        ? exportOptions.TRANSPORTED.toTransportedWaste(
            lookup.registryTransported
          )
        : null
  }));
}
