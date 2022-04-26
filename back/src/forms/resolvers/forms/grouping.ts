import { FormResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { expandAppendix2FormFromDb } from "../../form-converter";

const groupingResolver: FormResolvers["grouping"] = async form => {
  const formGroupements = await prisma.formGroupement.findMany({
    where: { nextFormId: form.id },
    include: { initialForm: true }
  });
  return formGroupements.map(({ quantity, initialForm }) => ({
    quantity,
    form: expandAppendix2FormFromDb(initialForm)
  }));
};

export default groupingResolver;
