import { UserInputError } from "../../../common/errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { prisma } from "@td/prisma";
import {
  getBsdaOrNotFound,
  getBsdaTransporterOrNotFound
} from "../../database";
import { checkCanUpdate } from "../../permissions";
import { getBsdaRepository } from "../../repository";

const deleteBsdaTransporterResolver: MutationResolvers["deleteBsdaTransporter"] =
  async (parent, { id }, context) => {
    const user = checkIsAuthenticated(context);

    const transporter = await getBsdaTransporterOrNotFound({ id });

    // TODO this should be done in a transaction
    if (transporter.bsdaId) {
      if (transporter.transporterTransportSignatureDate) {
        throw new UserInputError(
          `Ce transporteur BSDA ne peut être supprimé car il a déjà signé l'enlèvement du déchet`
        );
      }
      const bsda = await getBsdaOrNotFound(transporter.bsdaId, {
        include: { transporters: true }
      });
      const transporters = bsda.transporters;
      await checkCanUpdate(user, bsda, {
        transporters: transporters.map(t => t.id).filter(tid => tid !== id)
      });

      const { update: updateBsda } = getBsdaRepository(user);

      // Passe par la méthode update du bsda repository pour logguer l'event
      // et déclencher le réindex
      await updateBsda(
        { id: transporter.bsdaId },
        { transporters: { delete: { id } } }
      );
    } else {
      await prisma.bsdaTransporter.delete({ where: { id } });
    }

    return id;
  };

export default deleteBsdaTransporterResolver;
