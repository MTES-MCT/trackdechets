import { UserInputError } from "../../../common/errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationResolvers } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import {
  getBsvhuOrNotFound,
  getBsvhuTransporterOrNotFound
} from "../../database";
import { checkCanUpdate } from "../../permissions";
import { getBsvhuRepository } from "../../repository";

const deleteBsvhuTransporterResolver: MutationResolvers["deleteBsvhuTransporter"] =
  async (parent, { id }, context) => {
    const user = checkIsAuthenticated(context);

    const transporter = await getBsvhuTransporterOrNotFound({ id });

    if (transporter.bsvhuId) {
      if (transporter.transporterTransportSignatureDate) {
        throw new UserInputError(
          `Ce transporteur BSVHU ne peut être supprimé car il a déjà signé l'enlèvement du déchet`
        );
      }
      const bsvhu = await getBsvhuOrNotFound(transporter.bsvhuId, {
        include: { transporters: true }
      });
      const transporters = bsvhu.transporters;
      await checkCanUpdate(user, bsvhu, {
        transporters: transporters.map(t => t.id).filter(tid => tid !== id)
      });

      const { update: updateBsvhu } = getBsvhuRepository(user);

      await updateBsvhu(
        { id: transporter.bsvhuId },
        { transporters: { delete: { id } } }
      );
    } else {
      await prisma.bsvhuTransporter.delete({ where: { id } });
    }

    return id;
  };

export default deleteBsvhuTransporterResolver;
