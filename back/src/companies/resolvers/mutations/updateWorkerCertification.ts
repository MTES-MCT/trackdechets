import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationUpdateWorkerCertificationArgs } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { getWorkerCertificationOrNotFound } from "../../database";
import { checkCanReadUpdateDeleteWorkerCertification } from "../../permissions";
import { workerCertificationSchema } from "./createWorkerCertification";

export async function updateWorkerCertification(
  _,
  { input }: MutationUpdateWorkerCertificationArgs,
  context: GraphQLContext
) {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const { id, ...data } = input;

  const certification = await getWorkerCertificationOrNotFound({ id });
  await checkCanReadUpdateDeleteWorkerCertification(user, certification);
  await workerCertificationSchema.validate(input);

  return prisma.workerCertification.update({
    data,
    where: { id: certification.id }
  });
}
