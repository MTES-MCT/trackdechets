import { prisma } from "@td/prisma";
import { Prisma, RegistryExportStatus } from "@td/prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationGenerateRegistryExhaustiveExportArgs } from "@td/codegen-back";
import {
  Permission,
  can,
  checkUserPermissions,
  hasGovernmentRegistryPerm
} from "../../../permissions";
import { GraphQLContext } from "../../../types";
import { getUserCompanies } from "../../../users/database";
import {
  ForbiddenError,
  TooManyRequestsError,
  UserInputError
} from "../../../common/errors";
import { enqueueRegistryExhaustiveExportJob } from "../../../queue/producers/registryExhaustiveExport";
import { subMinutes } from "date-fns";

export function getGenerateRegistryExhaustiveExport({
  asAdmin
}: {
  asAdmin: boolean;
}) {
  return async (
    _,
    { format, siret, dateRange }: MutationGenerateRegistryExhaustiveExportArgs,
    context: GraphQLContext
  ): Promise<
    Prisma.RegistryExhaustiveExportGetPayload<{ include: { createdBy: true } }>
  > => {
    const user = checkIsAuthenticated(context);
    const sirets: string[] = [];
    let isForAllCompanies = false;
    let exportAsAdmin = false;
    if (asAdmin && !siret) {
      throw new UserInputError(
        "Le champ siret est obligatoire si l'export est demandé en tant qu'administrateur."
      );
    }

    const recentExportsByUserCount =
      await prisma.registryExhaustiveExport.count({
        where: {
          createdById: user.id,
          createdAt: { gte: subMinutes(new Date(), 5) }
        }
      });
    if (recentExportsByUserCount >= 10) {
      throw new TooManyRequestsError(
        "Vous avez déjà réalisé 10 exports dans les 5 dernières minutes. Veuillez réessayer plus tard."
      );
    }

    const userCompanies = await getUserCompanies(user.id);
    if (siret) {
      const hasGovernmentPermission = await hasGovernmentRegistryPerm(user, [
        siret
      ]);
      // bypass authorization if the user is authenticated from a service account or is admin
      if (!hasGovernmentPermission) {
        if (asAdmin && user.isAdmin) {
          exportAsAdmin = true;
        } else {
          await checkUserPermissions(
            user,
            [siret],
            Permission.RegistryCanRead,
            `Vous n'êtes pas autorisé à lire les données de ce registre`
          );
        }
      }
      sirets.push(siret);
    } else {
      isForAllCompanies = true;
      const orgIds = userCompanies.map(company => company.orgId);
      const userRoles = await context.dataloaders.userRoles.load(user.id);

      for (const orgId of orgIds) {
        if (!user.isAdmin) {
          if (
            Object.keys(userRoles).includes(orgId) &&
            can(userRoles[orgId], Permission.RegistryCanRead)
          ) {
            sirets.push(orgId);
          }
        } else {
          sirets.push(orgId);
        }
      }
    }
    const recentSameExport = await prisma.registryExhaustiveExport.findFirst({
      where: {
        createdById: user.id,
        asAdmin: exportAsAdmin,
        createdAt: { gte: subMinutes(new Date(), 5) },
        isForAllCompanies,
        sirets: isForAllCompanies ? undefined : { equals: sirets },
        startDate:
          dateRange._gt ?? dateRange._gte ?? dateRange._eq ?? undefined,
        endDate: dateRange._lt ?? dateRange._lte ?? dateRange._eq ?? undefined,
        format
      },
      select: {
        id: true
      }
    });

    if (recentSameExport) {
      throw new TooManyRequestsError(
        "Vous avez déjà réalisé cet export il y a moins de 5 minutes"
      );
    }

    if (!dateRange._gt && !dateRange._gte && !dateRange._eq) {
      throw new UserInputError(
        "Une date de début pour la période d'export est obligatoire"
      );
    }
    if (
      [dateRange._gt, dateRange._gte, dateRange._eq].filter(Boolean).length > 1
    ) {
      throw new UserInputError(
        "Un seul critère pour la date de début (_gt/_gte/_eq) est autorisé"
      );
    }
    if (
      [dateRange._lt, dateRange._lte, dateRange._eq].filter(Boolean).length > 1
    ) {
      throw new UserInputError(
        "Un seul critère pour la date de fin (_lt/_lte/_eq) est autorisé"
      );
    }
    if (sirets.length === 0) {
      throw new ForbiddenError(
        `Vous n'êtes pas autorisé à lire les données de ce registre`
      );
    }
    const registryExport = await prisma.registryExhaustiveExport.create({
      data: {
        createdById: user.id,
        asAdmin: exportAsAdmin,
        status: RegistryExportStatus.PENDING,
        sirets,
        isForAllCompanies,
        startDate: (dateRange._gt ?? dateRange._gte ?? dateRange._eq) as Date,
        endDate: dateRange._lt ?? dateRange._lte ?? dateRange._eq,
        format
      },
      include: {
        createdBy: true
      }
    });

    await enqueueRegistryExhaustiveExportJob({
      exportId: registryExport.id,
      dateRange
    });

    return registryExport;
  };
}
