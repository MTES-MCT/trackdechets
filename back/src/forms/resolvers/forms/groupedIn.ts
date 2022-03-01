import { FormResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { expandFormFromDb } from "../../form-converter";

const groupedInResolver: FormResolvers["groupedIn"] = async form => {
  const groupedIn = await prisma.form
    .findUnique({
      where: { id: form.id }
    })
    .appendix2RootForm();
  return expandFormFromDb(groupedIn);
};

export default groupedInResolver;
