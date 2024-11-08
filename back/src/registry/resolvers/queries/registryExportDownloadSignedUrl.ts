import { prisma } from "@td/prisma";
import { getSignedUrlForDownload } from "@td/registry";
import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryRegistryExportDownloadSignedUrlArgs } from "../../../generated/graphql/types";
import { Permission, can } from "../../../permissions";
import { GraphQLContext } from "../../../types";
import { getUserCompanies } from "../../../users/database";
import { ForbiddenError } from "../../../common/errors";

export async function registryExportDownloadSignedUrl(
  _,
  { exportId }: QueryRegistryExportDownloadSignedUrlArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const userCompanies = await getUserCompanies(user.id);
  const authorizedOrgIds: string[] = [];
  const orgIds = userCompanies.map(company => company.orgId);
  const userRoles = await context.dataloaders.userRoles.load(user.id);

  for (const orgId of orgIds) {
    if (!user.isAdmin) {
      if (
        Object.keys(userRoles).includes(orgId) &&
        can(userRoles[orgId], Permission.RegistryCanRead)
      ) {
        authorizedOrgIds.push(orgId);
      }
    } else {
      authorizedOrgIds.push(orgId);
    }
  }

  const registryExport = await prisma.registryExport.findUniqueOrThrow({
    where: {
      id: exportId,
      OR: [
        {
          sirets: { hasSome: authorizedOrgIds }
        },
        { delegateSiret: { in: authorizedOrgIds } }
      ]
    },
    include: { createdBy: true }
  });

  const key = registryExport.s3FileKey;
  if (!key) {
    throw new ForbiddenError(
      "Cet export n'a pas de fichier à télécharger. Il est peut-être encore en cours ou a rencontré une erreur."
    );
  }
  const bucketName = process.env.S3_REGISTRY_EXPORTS_BUCKET!;

  const signedUrl = await getSignedUrlForDownload({
    bucketName,
    key
  });

  return { fileKey: key, signedUrl };
}
