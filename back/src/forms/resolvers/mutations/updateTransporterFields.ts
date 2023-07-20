import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { isBsddTransporterFieldEditable } from "../../../common/constants/formHelpers";
import { getFormOrFormNotFound } from "../../database";
import { checkCanUpdateTransporterFields } from "../../permissions";
import { expandFormFromDb } from "../../converter";
import { getFormRepository } from "../../repository";
import { ForbiddenError } from "../../../common/errors";

const updateTransporterFieldsResolver: MutationResolvers["updateTransporterFields"] =
  async (
    parent,
    { id, transporterCustomInfo, transporterNumberPlate },
    context
  ) => {
    const user = checkIsAuthenticated(context);

    const form = await getFormOrFormNotFound({ id });

    if (!isBsddTransporterFieldEditable(form.status)) {
      throw new ForbiddenError(
        "Ce champ n'est pas modifiable sur un bordereau qui n'est pas en statut scellé ou signé par le producteur"
      );
    }

    await checkCanUpdateTransporterFields(user, form);

    const updatedForm = await getFormRepository(user).update(
      { id },
      {
        transporters: {
          updateMany: {
            where: { number: 1 },
            data: { transporterNumberPlate, transporterCustomInfo }
          }
        }
      }
    );

    return expandFormFromDb(updatedForm);
  };

export default updateTransporterFieldsResolver;
