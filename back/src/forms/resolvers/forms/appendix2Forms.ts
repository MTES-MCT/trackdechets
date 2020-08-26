import { FormResolvers } from "../../../generated/graphql/types";
import { prisma } from "../../../generated/prisma-client";

const appendix2FormsResolver: FormResolvers["appendix2Forms"] = form => {
  return prisma.form({ id: form.id }).appendix2Forms();
};

export default appendix2FormsResolver;
