import { QueryResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { searchCompanies } from "../../search";

const searchCompaniesResolver: QueryResolvers["searchCompanies"] = async (
  _,
  { clue, department },
  context
) => {
  return searchCompanies(clue, department).then(async results => {
    let existingCompanies = [];
    if (results.length) {
      existingCompanies = await prisma.company.findMany({
        where: {
          siret: { in: results.map(r => r.siret) }
        }
      });
    }

    return results.map(async company => ({
      ...company,
      isRegistered: existingCompanies.includes(company.siret),
      installation: await context.dataloaders.installations.load(company.siret)
    }));
  });
};

export default searchCompaniesResolver;
