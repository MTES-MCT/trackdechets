import { Prisma, prisma, RegistryExportStatus } from "@td/prisma";
import { UserInputError } from "../../../common/errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationCancelRegistryExhaustiveExportArgs } from "@td/codegen-back";
import { GraphQLContext } from "../../../types";

export async function cancelRegistryExhaustiveExport(
  _,
  { exportId }: MutationCancelRegistryExhaustiveExportArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);
  // no permission check, the user can only cancel his own exports since createdById is included in the query
  try {
    const registryExport = await prisma.registryExhaustiveExport.findUnique({
      where: {
        id: exportId,
        createdById: user.id,
      },
    });
    if (!registryExport) {
      throw new UserInputError(`Export de registre exhaustif "${exportId}" non trouvé`);
    }
    if (registryExport.status !== RegistryExportStatus.PENDING && registryExport.status !== RegistryExportStatus.STARTED) {
      throw new UserInputError(`L'export de registre exhaustif "${exportId}" ne peut être annulé car il est déjà terminé`);
    }
    const updatedRegistryExport = await prisma.registryExhaustiveExport.update({
      where: {
        id: exportId,
        createdById: user.id,
      },
      data: {
        status: RegistryExportStatus.CANCELED
      },
      include: { createdBy: true }
    });
    return updatedRegistryExport;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new UserInputError(`Export de registre exhaustif "${exportId}" non trouvé`);
      }
    }
    throw new Error("Une erreur inattendue est survenue");
  }
}
