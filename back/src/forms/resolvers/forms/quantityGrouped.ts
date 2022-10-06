import { FormResolvers } from "../../../generated/graphql/types";

const quantityGrouped: FormResolvers["quantityGrouped"] = async (
  form,
  _,
  context
) => {
  const formGroupements = await context.dataloaders.formGoupements.load(
    form.id
  );

  if (formGroupements) {
    return formGroupements
      .map(grp => grp.quantity)
      .reduce((prev, cur) => prev + cur, 0);
  }
  return null;
};

export default quantityGrouped;
