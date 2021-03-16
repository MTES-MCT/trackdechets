import { FormResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";

const appendix2FormsResolver: FormResolvers["appendix2Forms"] = async form => {
  const appendix2Forms = await prisma.form
    .findUnique({ where: { id: form.id } })
    .appendix2Forms();
  return appendix2Forms;
};

export default appendix2FormsResolver;
