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
  await checkIsCompanyMember(user, { siret });

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
    }
  });

  return Promise.all(
    queriedForms
      .filter(
        f =>
          f.quantityReceived > 0 &&
          new Decimal(f.quantityReceived).greaterThan(f.quantityGrouped)
      )
      .map(f => expandFormFromDb(f))
  );
};

export default appendixFormsResolver;
