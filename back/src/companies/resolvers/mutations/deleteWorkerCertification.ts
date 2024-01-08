import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationDeleteWorkerCertificationArgs } from "../../../generated/graphql/types";
import { prisma } from "@td/prisma";
import { GraphQLContext } from "../../../types";
import { getWorkerCertificationOrNotFound } from "../../database";
import { checkCanReadUpdateDeleteWorkerCertification } from "../../permissions";

export async function deleteWorkerCertification(
  _,
  { input }: MutationDeleteWorkerCertificationArgs,
  context: GraphQLContext
) {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const { id } = input;
  const receipt = await getWorkerCertificationOrNotFound({ id });
  await checkCanReadUpdateDeleteWorkerCertification(user, receipt);
  return prisma.workerCertification.delete({ where: { id } });
}
