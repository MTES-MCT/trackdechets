import { prisma } from "@td/prisma";
import { Prisma, RegistryExportStatus } from "@td/prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationGenerateRegistryV2ExportArgs } from "@td/codegen-back";
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
import { getDelegatesOfCompany } from "../../../registryDelegation/resolvers/queries/utils/registryDelegations.utils";
import { enqueueRegistryExportJob } from "../../../queue/producers/registryExport";
import { subMinutes } from "date-fns";
import { getCompanyOrCompanyNotFound } from "../../../companies/database";

export function getGenerateRegistryV2Export({ asAdmin }: { asAdmin: boolean }) {
  return async (
    _,
    {
      registryType,
      format,
      siret,
      delegateSiret,
      dateRange,
      where
    }: MutationGenerateRegistryV2ExportArgs,
    context: GraphQLContext
  ): Promise<
    Prisma.RegistryExportGetPayload<{ include: { createdBy: true } }>
  > => {
    const user = checkIsAuthenticated(context);
    const sirets: string[] = [];
    let delegate: string | null = null;
    let isForAllCompanies = false;
    let exportAsAdmin = false;
    if (delegateSiret && !siret) {
      throw new UserInputError(
        "Le champ siret est obligatoire si l'export est demandé en tant que délégataire."
      );
    }
    if (asAdmin && !siret) {
      throw new UserInputError(
        "Le champ siret est obligatoire si l'export est demandé en tant qu'administrateur."
      );
    }

    const runningExportsByUserCount = await prisma.registryExport.count({
      where: {
        createdById: user.id,
        status: { in: [RegistryExportStatus.PENDING, RegistryExportStatus.STARTED] }
      }
    });
    if (runningExportsByUserCount >= 10 && !(user.isAdmin && asAdmin)) {
      throw new TooManyRequestsError(
        "Vous avez déjà 10 exports en cours ou en attente de traitement. Veuillez réessayer plus tard."
      );
    }

    const userCompanies = await getUserCompanies(user.id);
    if (siret) {
      const hasGovernmentPermission = await hasGovernmentRegistryPerm(user, [
        siret
      ]);
      // bypass authorization if the user is authenticated from a service account or is admin
      if (!hasGovernmentPermission) {
        try {
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
        } catch (error) {
          if (!delegateSiret) {
            throw error;
          }
          if (!userCompanies.some(company => company.orgId === delegateSiret)) {
            throw new ForbiddenError(
              `Vous n'êtes pas autorisé à lire les données de ce registre en tant que délégataire`
            );
          }
          const delegatorCompany = await getCompanyOrCompanyNotFound({
            siret
          });
          // list the companies that have delegation for this siret
          const delegatesForCompany = await getDelegatesOfCompany(
            user,
            delegatorCompany.id
          );
          if (delegatesForCompany.length === 0) {
            throw new ForbiddenError(
              `Vous n'êtes pas autorisé à lire les données de ce registre en tant que délégataire`
            );
          }
          if (
            !delegatesForCompany.some(
              delegate => delegate.orgId === delegateSiret
            )
          ) {
            throw new ForbiddenError(
              `L'entreprise spécifiée dans le champ delegate n'a pas de délégation sur l'entreprise spécifiée dans le champ siret.`
            );
          }
          await checkUserPermissions(
            user,
            [delegateSiret],
            Permission.RegistryCanRead,
            `Vous n'êtes pas autorisé à lire les données de ce registre en tant que délégataire`
          );
          delegate = delegateSiret;
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

    const recentSameExport = await prisma.registryExport.findFirst({
      where: {
        createdById: user.id,
        asAdmin: exportAsAdmin,
        createdAt: { gte: subMinutes(new Date(), 5) },
        isForAllCompanies,
        sirets: isForAllCompanies ? undefined : { equals: sirets },
        delegateSiret: delegate ?? undefined,
        registryType,
        wasteTypes: where?.wasteType?._eq
          ? { equals: [where.wasteType._eq] }
          : where?.wasteType?._in?.length
            ? { equals: where.wasteType._in.sort() }
            : { isEmpty: true },
        wasteCodes: where?.wasteCode?._eq
          ? { equals: [where.wasteCode._eq] }
          : where?.wasteCode?._in?.length
            ? { equals: where.wasteCode._in.sort() }
            : { isEmpty: true },
        declarationType: where?.declarationType?._eq
          ? where.declarationType._eq === "ALL"
            ? null
            : where.declarationType._eq
          : null,
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
    const registryExport = await prisma.registryExport.create({
      data: {
        createdById: user.id,
        asAdmin: exportAsAdmin,
        status: RegistryExportStatus.PENDING,
        delegateSiret: delegate,
        sirets,
        isForAllCompanies,
        registryType,
        wasteTypes: where?.wasteType?._eq
          ? [where.wasteType._eq]
          : where?.wasteType?._in?.length
            ? where.wasteType._in.sort()
            : [],
        wasteCodes: where?.wasteCode?._eq
          ? [where.wasteCode._eq]
          : where?.wasteCode?._in?.length
            ? where.wasteCode._in.sort()
            : [],
        declarationType: where?.declarationType?._eq
          ? where.declarationType._eq === "ALL"
            ? null
            : where.declarationType._eq
          : null,
        startDate: (dateRange._gt ?? dateRange._gte ?? dateRange._eq) as Date,
        endDate: dateRange._lt ?? dateRange._lte ?? dateRange._eq,
        format
      },
      include: {
        createdBy: true
      }
    });

    await enqueueRegistryExportJob({
      exportId: registryExport.id,
      dateRange
    });

    return registryExport;
  };
}
