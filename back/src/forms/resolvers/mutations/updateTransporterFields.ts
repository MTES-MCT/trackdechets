import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getFormOrFormNotFound } from "../../database";
import { ForbiddenError } from "apollo-server-express";
import { checkCanUpdateTransporterFields } from "../../permissions";
import { prisma } from "../../../generated/prisma-client";
import { expandFormFromDb } from "../../form-converter";

const updateTransporterFieldsResolver: MutationResolvers["updateTransporterFields"] = async (
  parent,
  { id, transporterCustomInfo, transporterNumberPlate },
  context
) => {
  const user = checkIsAuthenticated(context);

  const form = await getFormOrFormNotFound({ id });

  if (form.status !== "SEALED") {
    throw new ForbiddenError(
      "Ce champ n'est pas modifiable sur un bordereau qui n'est pas en statut scellé"
    );
  }

  await checkCanUpdateTransporterFields(user, form);

  const updatedForm = await prisma.updateForm({
    where: { id },
    data: { transporterNumberPlate, transporterCustomInfo }
  });

  return expandFormFromDb(updatedForm);
};

export default updateTransporterFieldsResolver;
