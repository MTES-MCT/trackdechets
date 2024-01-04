import { FormResolvers } from "../../../generated/graphql/types";
import { prisma } from "@td/prisma";

const intermediaryCompaniesResolver: FormResolvers["intermediaries"] =
  async form => {
    if (form.intermediaries) {
      return form.intermediaries;
    }

    const intermediaries = await prisma.form
      .findUnique({
        where: { id: form.id }
      })
      .intermediaries();

    return intermediaries ?? [];
  };

export default intermediaryCompaniesResolver;
