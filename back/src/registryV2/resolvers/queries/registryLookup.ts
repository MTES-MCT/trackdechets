import { GraphQLContext } from "../../../types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { prisma } from "@td/prisma";
import { QueryRegistryLookupArgs } from "@td/codegen-back";
import { UserInputError } from "../../../common/errors";
import { Permission, checkUserPermissions } from "../../../permissions";
import { RegistryImportType } from "@prisma/client";
import {
  getLookupsFilterInfos,
  getTypeFilter
} from "./utils/registryLookup.util";
import { exportOptions } from "@td/registry";

const TYPES_NAMES = {
  [RegistryImportType.INCOMING_TEXS]:
    "Terres excavées et sédiments, dangereux et non dangereux entrants",
  [RegistryImportType.INCOMING_WASTE]:
    "Déchets dangereux et non dangereux entrants",
  [RegistryImportType.OUTGOING_TEXS]:
    "Terres excavées et sédiments, dangereux et non dangereux sortants",
  [RegistryImportType.OUTGOING_WASTE]:
    "Déchets dangereux et non dangereux sortants",
  [RegistryImportType.SSD]: "Sortie de statut de déchet",
  [RegistryImportType.MANAGED]: "Gérés",
  [RegistryImportType.TRANSPORTED]: "Transportés"
};
export async function registryLookup(
  _,
  { siret, publicId, type }: QueryRegistryLookupArgs,
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

  const lookup = await prisma.registryLookup.findFirst({
    where: {
      siret,
      ...(reportAsIdsFilter.length > 0 && {
        reportAsId: { in: reportAsIdsFilter }
      }),
      readableId: publicId,
      declarationType: "REGISTRY",
      ...getTypeFilter(type)
    },
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

  if (!lookup) {
    throw new UserInputError(
      `Aucune déclaration trouvée pour l'identifiant ${publicId} dans le registre ${TYPES_NAMES[type]}`
    );
  }

  return {
    ...lookup,
    publicId: lookup.readableId,
    type,
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
  };
}
