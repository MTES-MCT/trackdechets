import { isSessionUser } from "../../../auth";
import { isGetBsdsQuery } from "../../../bsds/resolvers/queries/bsds";
import { FormResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";

const revisionRequestsResolver: FormResolvers["revisionRequests"] = async (
  form,
  _,
  ctx
) => {
  if (isGetBsdsQuery(ctx) && isSessionUser(ctx)) {
    return (form as any)?.bsddRevisionRequests ?? [];
  }

  return prisma.form
    .findUnique({
      where: { id: form.id }
    })
    .bsddRevisionRequests();
};

export default revisionRequestsResolver;
