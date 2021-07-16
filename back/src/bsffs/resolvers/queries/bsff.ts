import { QueryResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { unflattenBsff } from "../../converter";
import { getUserCompanies } from "../../../users/database";
import { getBsffOrNotFound } from "../../database";

const bsff: QueryResolvers["bsff"] = async (_, { id }, context) => {
  const user = checkIsAuthenticated(context);
  const companies = await getUserCompanies(user.id);
  const sirets = companies.map(company => company.siret);
  const bsff = await getBsffOrNotFound({
    id,
    OR: [
      { emitterCompanySiret: { in: sirets } },
      { transporterCompanySiret: { in: sirets } },
      { destinationCompanySiret: { in: sirets } }
    ]
  });

  return unflattenBsff(bsff);
};

export default bsff;
