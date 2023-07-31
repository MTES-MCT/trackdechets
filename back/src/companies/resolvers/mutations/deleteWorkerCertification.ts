import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationDeleteWorkerCertificationArgs } from "../../../generated/graphql/types";
import { checkUserPermissions, Permission } from "../../../permissions";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { getWorkerCertificationOrNotFound } from "../../database";

export async function deleteWorkerCertification(
  _,
  { input }: MutationDeleteWorkerCertificationArgs,
  context: GraphQLContext
) {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const { id } = input;
  await getWorkerCertificationOrNotFound({ id });
  await checkUserPermissions(
    user,
    [id],
    Permission.CompanyCanUpdate,
    `Vous n'avez pas le droit d'éditer ou supprimer cette certification`
  );
  return prisma.workerCertification.delete({ where: { id } });
}
