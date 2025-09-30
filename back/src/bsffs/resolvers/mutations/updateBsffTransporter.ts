import { BsffTransporter, Prisma } from "@td/prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationResolvers } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import { getBsffTransporterOrNotFound, getTransporters } from "../../database";
import { checkCanUpdateBsffTransporter } from "../../permissions";
import { UserInputError } from "../../../common/errors";
import { getBsffRepository } from "../../repository";
import { ZodBsffTransporter } from "../../validation/bsff/schema";
import { parseBsffTransporterAsync } from "../../validation/bsff";
import { expandBsffTransporterFromDb } from "../../converter";
import { graphqlInputToZodBsffTransporter } from "../../validation/bsff/helpers";

const updateBsffTransporterResolver: MutationResolvers["updateBsffTransporter"] =
  async (parent, { id, input }, context) => {
    const user = checkIsAuthenticated(context);
    const existingTransporter = await getBsffTransporterOrNotFound({ id });
    if (existingTransporter.transporterTransportSignatureDate) {
      throw new UserInputError(
        "Impossible de modifier ce transporteur car il a déjà signé le bordereau"
      );
    }
    if (existingTransporter.bsffId) {
      // Si le transporteur a été associé à un bordereau, il devient nécessaire d'avoir les droits
      // sur ce bordereau pour pouvoir modifier le transporteur
      const bsff = await prisma.bsffTransporter
        .findUniqueOrThrow({
          where: { id }
        })
        .bsff({ include: { transporters: true } });
      await checkCanUpdateBsffTransporter(user, bsff!, id, input);
    }

    const zodTransporter: ZodBsffTransporter = {
      ...existingTransporter,
      ...graphqlInputToZodBsffTransporter(input)
    };

    // apply validation, sirenify, recipify
    const {
      id: parsedId,
      number,
      bsffId,
      ...parsed
    } = await parseBsffTransporterAsync(zodTransporter);

    const data: Prisma.BsffTransporterUpdateInput = parsed;

    let updatedTransporter: BsffTransporter;
    if (existingTransporter.bsffId) {
      // Si le transporteur est déjà associé à un bordereau, on passe par l'update
      // du repository pour être certain que l'événement soit loggué et que le
      // réindex ait lieu
      const { updateBsff } = getBsffRepository(user);
      const updatedBsff = await updateBsff({
        where: { id: existingTransporter.bsffId },
        data: { transporters: { update: { where: { id }, data } } }
      });
      const updatedTransporters = await getTransporters(updatedBsff);
      updatedTransporter = updatedTransporters.find(t => t.id === id)!;
    } else {
      updatedTransporter = await prisma.bsffTransporter.update({
        where: { id },
        data
      });
    }

    return expandBsffTransporterFromDb(updatedTransporter);
  };

export default updateBsffTransporterResolver;
