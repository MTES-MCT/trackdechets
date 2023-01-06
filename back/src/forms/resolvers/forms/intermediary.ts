import { FormResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";

const intermediaryCompaniesResolver: FormResolvers["intermediaries"] =
  async form => {
    const intermediaries = await prisma.form
      .findUnique({
        where: { id: form.id }
      })
      .intermediaries();

    if (intermediaries) {
      return intermediaries.map(intermediary => ({
        orgId: intermediary.siret,
        ...intermediary
      }));
    }
    return null;
  };

export default intermediaryCompaniesResolver;
