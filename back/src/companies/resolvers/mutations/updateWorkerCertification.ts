import { applyAuthStrategies, AuthType } from "../../../auth";
import { removeEmptyKeys } from "../../../common/converter";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationUpdateWorkerCertificationArgs } from "../../../generated/graphql/types";
import { checkUserPermissions, Permission } from "../../../permissions";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { getWorkerCertificationOrNotFound } from "../../database";
import { workerCertificationSchema } from "./createWorkerCertification";

export async function updateWorkerCertification(
  _,
  { input }: MutationUpdateWorkerCertificationArgs,
  context: GraphQLContext
) {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const { id, ...data } = input;

  await getWorkerCertificationOrNotFound({ id });
  await checkUserPermissions(
    user,
    [id],
    Permission.CompanyCanUpdate,
    `Vous n'avez pas le droit d'éditer ou supprimer cette certification`
  );
  await workerCertificationSchema.validate(input);

  return prisma.company.update({
    data: removeEmptyKeys({
      workerCertificationNumber: data.certificationNumber,
      workerHasSubSectionFour: data.hasSubSectionFour,
      workerHasSubSectionThree: data.hasSubSectionThree,
      workerOrganisation: data.organisation,
      workerValidityLimit: data.validityLimit
    }),
    where: { id }
  });
}
