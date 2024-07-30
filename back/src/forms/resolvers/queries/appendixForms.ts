import { prisma } from "@td/prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryResolvers } from "../../../generated/graphql/types";
import { expandableFormIncludes, expandFormFromDb } from "../../converter";
import { checkCanList } from "../../permissions";
import { bsddWasteQuantities } from "../../helpers/bsddWasteQuantities";

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
      readableId: { not: { endsWith: "-suite" } }
    },
    include: expandableFormIncludes
  });

  const getQuantity = form => {
    const wasteQuantities = bsddWasteQuantities(form);
    return wasteQuantities?.quantityAccepted ?? form.quantityReceived;
  };

  return queriedForms
    .filter(f => {
      const quantityReceived = f.forwardedIn
        ? getQuantity(f.forwardedIn)
        : getQuantity(f);

      return (
        quantityReceived && quantityReceived.greaterThan(f.quantityGrouped)
      );
    })
    .map(f => expandFormFromDb(f));
};

export default appendixFormsResolver;
