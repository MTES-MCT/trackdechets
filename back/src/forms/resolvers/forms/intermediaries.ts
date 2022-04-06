import { FormResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";

const intermediariesResolver: FormResolvers["intermediaries"] = async form => {
  const intermediaries = await prisma.form
    .findUnique({ where: { id: form.id } })
    .intermediaries();
  return intermediaries.map(i => ({ ...i, country: "FR" }));
};

export default intermediariesResolver;
