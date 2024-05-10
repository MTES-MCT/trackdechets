import { UserInputError } from "../../../common/errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { prisma } from "@td/prisma";
import {
  getFormOrFormNotFound,
  getFormTransporterOrNotFound,
  getTransporters
} from "../../database";
import { checkCanUpdate } from "../../permissions";
import { getFormRepository } from "../../repository";

const deleteFormTransporterResolver: MutationResolvers["deleteFormTransporter"] =
  async (parent, { id }, context) => {
    const user = checkIsAuthenticated(context);

    const transporter = await getFormTransporterOrNotFound({ id });

    // TODO this should be done in a transaction
    if (transporter.formId) {
      if (transporter.takenOverAt) {
        throw new UserInputError(
          `Ce transporteur BSDD ne peut être supprimé car il a déjà signé l'enlèvement du déchet`
        );
      }
      const form = await getFormOrFormNotFound({ id: transporter.formId });
      const transporters = await getTransporters({ id: form.id });
      await checkCanUpdate(user, form, {
        id: form.id,
        transporters: transporters.map(t => t.id).filter(tid => tid !== id)
      });

      const { update: updateForm } = getFormRepository(user);

      // Passe par la méthode update du form repository pour logguer l'event, déclencher le
      // réindex et recalculer le champ dénormalisé `transporterSirets`
      await updateForm(
        { id: transporter.formId },
        { transporters: { delete: { id } } }
      );
    } else {
      await prisma.bsddTransporter.delete({ where: { id } });
    }

    return id;
  };

export default deleteFormTransporterResolver;
