import { UserInputError } from "../../../common/errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationResolvers } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import { checkCanUpdate } from "../../permissions";
import {
  getBsffOrNotFound,
  getBsffTransporterOrNotFound
} from "../../database";
import { getBsffRepository } from "../../repository";

const deleteBsffTransporterResolver: MutationResolvers["deleteBsffTransporter"] =
  async (parent, { id }, context) => {
    const user = checkIsAuthenticated(context);

    const transporter = await getBsffTransporterOrNotFound({ id });

    if (transporter.bsffId) {
      if (transporter.transporterTransportSignatureDate) {
        throw new UserInputError(
          `Ce transporteur BSFF ne peut être supprimé car il a déjà signé l'enlèvement du déchet`
        );
      }
      const bsff = await getBsffOrNotFound({ id: transporter.bsffId });
      const transporters = bsff.transporters;
      await checkCanUpdate(user, bsff, {
        transporters: transporters.map(t => t.id).filter(tid => tid !== id)
      });

      const { updateBsff } = getBsffRepository(user);

      // Passe par la méthode update du bsff repository pour logguer l'event
      // et déclencher le réindex
      await updateBsff({
        where: { id: transporter.bsffId },
        data: { transporters: { delete: { id } } }
      });
    } else {
      await prisma.bsffTransporter.delete({ where: { id } });
    }

    return id;
  };

export default deleteBsffTransporterResolver;
