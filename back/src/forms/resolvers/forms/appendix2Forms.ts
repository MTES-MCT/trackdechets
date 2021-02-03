import { FormResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { stringifyDates } from "../../database";

const appendix2FormsResolver: FormResolvers["appendix2Forms"] = async form => {
  const appendix2Forms = await prisma.form
    .findUnique({ where: { id: form.id } })
    .appendix2Forms();
  return appendix2Forms.map(form => stringifyDates(form));
};

export default appendix2FormsResolver;
