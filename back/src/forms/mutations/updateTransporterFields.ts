import { GraphQLContext } from "../../types";
import { unflattenObjectFromDb } from "../form-converter";

import { ForbiddenError } from "apollo-server-express";

export async function updateTransporterFields(
  _,
  { id, transporterNumberPlate, transporterCustomInfo },
  context: GraphQLContext
) {
  const form = await context.prisma.form({ id });
  if (form.status !== "SEALED") {
    throw new ForbiddenError("Ce champ n'est pas modifiable sur un bordereau qui n'est pas en statut scellé");
  }
  const updatedForm = await context.prisma.updateForm({
    where: { id },
    data: { transporterNumberPlate, transporterCustomInfo }
  });

  return unflattenObjectFromDb(updatedForm);
}
