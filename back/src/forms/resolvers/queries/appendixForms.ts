import { QueryResolvers } from "../../../generated/graphql/types";
import { prisma } from "../../../generated/prisma-client";
import { checkIsAuthenticated } from "../../../common/permissions";
import { expandFormFromDb } from "../../form-converter";
import { NotCompanyMember } from "../../../common/errors";
import { getUserCompanies } from "../../../users/database";

const appendixFormsResolver: QueryResolvers["appendixForms"] = async (
  _,
  { wasteCode, siret },
  context
) => {
  const user = checkIsAuthenticated(context);

  const userCompanies = await getUserCompanies(user.id);

  userCompanies.some(uc => uc.siret === siret);
  if (!userCompanies.some(uc => uc.siret === siret)) {
    throw new NotCompanyMember(siret);
  }

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
