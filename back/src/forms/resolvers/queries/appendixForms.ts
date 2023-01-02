import { checkIsCompanyMember } from "../../../users/permissions";
import prisma from "../../../prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryResolvers } from "../../../generated/graphql/types";
import { expandFormFromDb } from "../../converter";
import { Decimal } from "decimal.js-light";

const appendixFormsResolver: QueryResolvers["appendixForms"] = async (
  _,
  { wasteCode, siret },
  context
) => {
  const user = checkIsAuthenticated(context);
  await checkIsCompanyMember(user, { orgId: siret });

  const queriedForms = await prisma.form.findMany({
    where: {
      AND: [
        ...(wasteCode ? [{ wasteDetailsCode: wasteCode }] : []),
        { status: "AWAITING_GROUP" },
        {
          OR: [
            { recipientCompanySiret: siret, forwardedIn: null },
            {
              recipientIsTempStorage: true,
              forwardedIn: { recipientCompanySiret: siret }
            }
          ]
        },
        { isDeleted: false },
        { forwarding: null }
      ]
    },
    include: {
      forwardedIn: {
        select: { quantityReceived: true }
      },
      groupedIn: true
    }
  });

  return Promise.all(
    queriedForms
      .filter(f => {
        const quantityGrouped = f.groupedIn.reduce(
          (sum, grp) => sum.add(grp.quantity),
          new Decimal(0)
        );

        const quantityReceived = f.forwardedIn
          ? f.forwardedIn.quantityReceived
          : f.quantityReceived;

        return (
          quantityReceived > 0 &&
          new Decimal(quantityReceived).greaterThan(quantityGrouped)
        );
      })
      .map(f => expandFormFromDb(f))
  );
};

export default appendixFormsResolver;
