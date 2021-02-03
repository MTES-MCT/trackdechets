import { checkIsCompanyMember } from "../../../users/permissions";
import prisma from "../../../prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryResolvers } from "../../../generated/graphql/types";
import { expandFormFromDb } from "../../form-converter";

const appendixFormsResolver: QueryResolvers["appendixForms"] = async (
  _,
  { wasteCode, siret },
  context
) => {
  const user = checkIsAuthenticated(context);
  await checkIsCompanyMember(user, { siret });

  const queriedForms = await prisma.form.findMany({
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
