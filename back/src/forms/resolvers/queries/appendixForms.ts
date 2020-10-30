import { QueryResolvers } from "../../../generated/graphql/types";
import { prisma } from "../../../generated/prisma-client";
import { checkIsAuthenticated } from "../../../common/permissions";
import { expandFormFromDb } from "../../form-converter";
import { checkIsCompanyMember } from "../../../users/permissions";

const appendixFormsResolver: QueryResolvers["appendixForms"] = async (
  _,
  { wasteCode, siret },
  context
) => {
  const user = checkIsAuthenticated(context);
  await checkIsCompanyMember(user, { siret });

  const queriedForms = await prisma.forms({
    where: {
      ...(wasteCode && { wasteDetailsCode: wasteCode }),
      status: "AWAITING_GROUP",
      recipientCompanySiret: siret,
      isDeleted: false
    }
  });

  return queriedForms.map(f => expandFormFromDb(f));
};

export default appendixFormsResolver;
