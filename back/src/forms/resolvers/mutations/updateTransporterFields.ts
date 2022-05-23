import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getFormOrFormNotFound } from "../../database";
import { ForbiddenError } from "apollo-server-express";
import { checkCanUpdateTransporterFields } from "../../permissions";
import { expandFormFromDb } from "../../form-converter";
import { getFormRepository } from "../../repository";

const updateTransporterFieldsResolver: MutationResolvers["updateTransporterFields"] =
  async (
    parent,
    { id, transporterCustomInfo, transporterNumberPlate },
    context
  ) => {
    const user = checkIsAuthenticated(context);

    const form = await getFormOrFormNotFound({ id });

    if (!["SEALED", "SIGNED_BY_PRODUCER"].includes(form.status)) {
      throw new ForbiddenError(
        "Ce champ n'est pas modifiable sur un bordereau qui n'est pas en statut scellé"
      );
    }

    await checkCanUpdateTransporterFields(user, form);

    const updatedForm = await getFormRepository(user).update(
      { id },
      { transporterNumberPlate, transporterCustomInfo }
    );

    return expandFormFromDb(updatedForm);
  };

export default updateTransporterFieldsResolver;
