import { FormResolvers } from "@trackdechets/codegen/src/back.gen";
import prisma from "../../../prisma";
import { expandAppendix2FormFromDb } from "../../form-converter";

const appendix2FormsResolver: FormResolvers["appendix2Forms"] = async form => {
  const appendix2Forms = await prisma.form
    .findUnique({ where: { id: form.id } })
    .appendix2Forms();
  return appendix2Forms.map(expandAppendix2FormFromDb);
};

export default appendix2FormsResolver;
