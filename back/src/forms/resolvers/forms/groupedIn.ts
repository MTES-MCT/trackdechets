import { FormResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { expandFormFromDb } from "../../form-converter";

const groupedInResolver: FormResolvers["groupedIn"] = async form => {
  const groupement = await prisma.formGroupement.findMany({
    where: { initialFormId: form.id },
    include: { nextForm: true }
  });

  return groupement.map(({ nextForm, quantity }) => ({
    form: expandFormFromDb(nextForm),
    quantity
  }));
};

export default groupedInResolver;
