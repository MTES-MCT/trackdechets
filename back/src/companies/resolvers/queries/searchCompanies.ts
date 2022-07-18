import { QueryResolvers } from "../../../generated/graphql/types";
import { searchCompanies } from "../../search";

const searchCompaniesResolver: QueryResolvers["searchCompanies"] = async (
  _,
  { clue, department },
  context
) =>
  searchCompanies(clue, department).then(async results =>
    results.map(async company => ({
      ...company,
      ...(company.siret
        ? {
            installation: await context.dataloaders.installations.load(
              company.siret!
            )
          }
        : {})
    }))
  );

export default searchCompaniesResolver;
