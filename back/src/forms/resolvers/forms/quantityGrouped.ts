import { Decimal } from "decimal.js-light";
import { GraphQLContext } from "../../../types";

export default async function quantityGrouped(
  form: { id: string },
  _,
  context: GraphQLContext
) {
  const formGroupements = await context.dataloaders.initialFormGoupements.load(
    form.id
  );

  if (formGroupements) {
    return formGroupements
      .map(grp => grp.quantity)
      .reduce((prev, cur) => prev.add(cur), new Decimal(0))
      .toNumber();
  }

  return null;
}
