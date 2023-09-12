import prisma from "../../../prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryResolvers } from "../../../generated/graphql/types";
import { expandableFormIncludes, expandFormFromDb } from "../../converter";
import { Decimal } from "decimal.js-light";
import { checkCanList } from "../../permissions";

const appendixFormsResolver: QueryResolvers["appendixForms"] = async (
  _,
  { wasteCode, siret },
  context
) => {
  const user = checkIsAuthenticated(context);

  await checkCanList(user, siret);

  const queriedForms = await prisma.form.findMany({
    where: {
      ...(wasteCode && { wasteDetailsCode: wasteCode }),
      status: "AWAITING_GROUP",
      OR: [
        { recipientCompanySiret: siret, forwardedIn: null },
        {
          recipientIsTempStorage: true,
          forwardedIn: { recipientCompanySiret: siret }
        }
      ],
      isDeleted: false,
      readableId: { not: { endsWith: "-suite" } } // TODO check if we can remove completly this condition
    },
    include: expandableFormIncludes
  });

  return queriedForms
    .filter(f => {
      const quantityReceived = f.forwardedIn
        ? f.forwardedIn.quantityReceived
        : f.quantityReceived;

      return (
        quantityReceived &&
        quantityReceived > 0 &&
        new Decimal(quantityReceived).greaterThan(f.quantityGrouped)
      );
    })
    .map(f => expandFormFromDb(f));
};

export default appendixFormsResolver;
