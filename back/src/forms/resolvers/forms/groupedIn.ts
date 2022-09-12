import { FormResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { expandFormFromDb } from "../../converter";

const groupedInResolver: FormResolvers["groupedIn"] = async form => {
  const groupement = await prisma.formGroupement.findMany({
    where: { initialFormId: form.id },
    include: { nextForm: true }
  });

  return Promise.all(
    groupement.map(async ({ nextForm, quantity }) => ({
      form: await expandFormFromDb(nextForm),
      quantity
    }))
  );
};

export default groupedInResolver;
