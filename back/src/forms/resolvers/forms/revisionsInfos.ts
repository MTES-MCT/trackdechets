import { FormResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";

const revisionsInfosResolver: FormResolvers["revisionsInfos"] = async form => {
  // When we load a BSDA from ES, the revision infos are already hydrated
  if (form.revisionsInfos) {
    return form.revisionsInfos;
  }

  const revisions = await prisma.form
    .findUnique({ where: { id: form.id } })
    .bsddRevisionRequests({ include: { approvals: true } });

  const hasBeenRevised = revisions?.some(
    revision => revision.status !== "PENDING"
  );
  const activeRevision = revisions?.find(
    revision => revision.status === "PENDING"
  );

  return {
    hasBeenRevised: Boolean(hasBeenRevised),
    activeRevision: activeRevision
      ? {
          author: activeRevision.authoringCompanyId,
          approvedBy: activeRevision.approvals.map(a => a.approverSiret)
        }
      : undefined
  };
};

export default revisionsInfosResolver;
