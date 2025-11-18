import { GraphQLContext } from "../../../types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { prisma } from "@td/prisma";
import {
  SsdLine,
  IncomingTexsLine,
  IncomingWasteLine,
  OutgoingTexsLine,
  OutgoingWasteLine,
  ManagedLine,
  TransportedLine,
  QueryRegistryLookupArgs
} from "@td/codegen-back";
import { UserInputError } from "../../../common/errors";
import { Permission, checkUserPermissions } from "../../../permissions";
import { RegistryImportType } from "@td/prisma";
import {
  getLookupsFilterInfos,
  getTypeFilter
} from "./utils/registryLookup.util";

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

  const { siretsThatCanAccessLookup, reportAsSiretsFilter } =
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
      ...(reportAsSiretsFilter.length > 0 && {
        reportAsSiret: { in: reportAsSiretsFilter }
      }),
      readableId: publicId,
      declarationType: "REGISTRY",
      ...getTypeFilter(type)
    },
    include: {
      registrySsd: true,
      registryIncomingWaste: true,
      registryIncomingTexs: { include: { texsAnalysisFiles: true } },
      registryOutgoingWaste: true,
      registryOutgoingTexs: { include: { texsAnalysisFiles: true } },
      registryTransported: true,
      registryManaged: { include: { texsAnalysisFiles: true } }
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
    ssd: (lookup.registrySsd as SsdLine) ?? null,
    incomingWaste: (lookup.registryIncomingWaste as IncomingWasteLine) ?? null,
    incomingTexs: (lookup.registryIncomingTexs as IncomingTexsLine) ?? null,
    outgoingWaste: (lookup.registryOutgoingWaste as OutgoingWasteLine) ?? null,
    outgoingTexs: (lookup.registryOutgoingTexs as OutgoingTexsLine) ?? null,
    managedWaste: (lookup.registryManaged as ManagedLine) ?? null,
    transportedWaste: (lookup.registryTransported as TransportedLine) ?? null
  };
}
