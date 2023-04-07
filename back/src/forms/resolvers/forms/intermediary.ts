import { FormResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";

const intermediaryCompaniesResolver: FormResolvers["intermediaries"] =
  async form => {
    const intermediaries = await prisma.form
      .findUnique({
        where: { id: form.id }
      })
      .intermediaries();

    return intermediaries ?? [];
  };

export default intermediaryCompaniesResolver;
