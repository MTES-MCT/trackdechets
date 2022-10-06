import { FormResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { expandAppendix2FormFromDb } from "../../converter";

const groupingResolver: FormResolvers["grouping"] = async (
  form,
  _,
  context
) => {
  const formGroupements = await prisma.formGroupement.findMany({
    where: { nextFormId: form.id },
    include: { initialForm: true }
  });
  return Promise.all(
    formGroupements.map(async ({ quantity, initialForm }) => ({
      quantity,
      form: await expandAppendix2FormFromDb(initialForm, context.dataloaders.forwardedIns)
    }))
  );
};

export default groupingResolver;
