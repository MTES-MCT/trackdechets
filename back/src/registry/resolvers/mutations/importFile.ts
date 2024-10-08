import { prisma } from "@td/prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import { GraphQLContext } from "../../../types";
import { enqueueRegistryImportToProcessJob } from "../../../queue/producers/registryImport";
import { MutationImportFileArgs } from "../../../generated/graphql/types";

export async function importFile(
  _,
  { s3FileKey, importType }: MutationImportFileArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const registryImport = await prisma.registryImport.create({
    data: {
      type: importType,
      s3FileKey,
      createdById: user.id
    }
  });

  await enqueueRegistryImportToProcessJob({
    importId: registryImport.id,
    s3FileKey,
    importType
  });

  return registryImport;
}
