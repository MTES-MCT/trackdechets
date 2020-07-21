import { expandFormFromDb } from "../form-converter";
import { ForbiddenError } from "apollo-server-express";
import { MutationUpdateTransporterFieldsArgs } from "../../generated/graphql/types";
import { prisma } from "../../generated/prisma-client";

export async function updateTransporterFields({
  id,
  transporterNumberPlate,
  transporterCustomInfo
}: MutationUpdateTransporterFieldsArgs) {
  const form = await prisma.form({ id });
  if (form.status !== "SEALED") {
    throw new ForbiddenError(
      "Ce champ n'est pas modifiable sur un bordereau qui n'est pas en statut scellé"
    );
  }
  const updatedForm = await prisma.updateForm({
    where: { id },
    data: { transporterNumberPlate, transporterCustomInfo }
  });

  return expandFormFromDb(updatedForm);
}
