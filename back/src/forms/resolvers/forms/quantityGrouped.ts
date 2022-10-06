import { FormResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";

const quantityGrouped: FormResolvers["quantityGrouped"] = async form => {
  const formGroupements = await prisma.form
    .findUnique({
      where: { id: form.id }
    })
    .groupedIn();

  if (formGroupements) {
    return formGroupements
      .map(grp => grp.quantity)
      .reduce((prev, cur) => prev + cur, 0);
  }
  return null;
};

export default quantityGrouped;
