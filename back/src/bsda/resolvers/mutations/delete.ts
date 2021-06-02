import prisma from "../../../prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";

import { getFormOrFormNotFound } from "../../database";
import { expandBsdaFromDb } from "../../converter";
import { checkCanDeleteBsdvhu } from "../../permissions";

const deleteBsdaResolver: MutationResolvers["deleteBsda"] = async (
  _,
  { id },
  context
) => {
  const user = checkIsAuthenticated(context);

  const bshvhu = await getFormOrFormNotFound(id);
  await checkCanDeleteBsdvhu(user, bshvhu);

  const deletedBsda = await prisma.bsda.update({
    where: { id },
    data: { isDeleted: true }
  });

  // TODO await elastic.deleteBsd(deletedBsda);

  return expandBsdaFromDb(deletedBsda);
};

export default deleteBsdaResolver;
