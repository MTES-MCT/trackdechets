import { BsvhuTransporter, Prisma } from "@td/prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationResolvers } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import { expandTransporterFromDb } from "../../converter";
import { getBsvhuTransporterOrNotFound, getTransporters } from "../../database";
import { checkCanUpdateBsvhuTransporter } from "../../permissions";
import { UserInputError } from "../../../common/errors";
import { getBsvhuRepository } from "../../repository";
import { ZodBsvhuTransporter } from "../../validation/schema";
import { graphqlInputToZodBsvhuTransporter } from "../../validation/helpers";
import { parseBsvhuTransporterAsync } from "../../validation";

const updateBsvhuTransporterResolver: MutationResolvers["updateBsvhuTransporter"] =
  async (parent, { id, input }, context) => {
    const user = checkIsAuthenticated(context);
    const existingTransporter = await getBsvhuTransporterOrNotFound({ id });
    if (existingTransporter.transporterTransportSignatureDate) {
      throw new UserInputError(
        "Impossible de modifier ce transporteur car il a déjà signé le bordereau"
      );
    }
    if (existingTransporter.bsvhuId) {
      // Si le transporteur a été associé à un bordereau, il devient nécessaire d'avoir les droits
      // sur ce bordereau pour pouvoir modifier le transporteur
      const bsvhu = await prisma.bsvhuTransporter
        .findUniqueOrThrow({
          where: { id }
        })
        .bsvhu({ include: { transporters: true } });
      await checkCanUpdateBsvhuTransporter(user, bsvhu!, id, input);
    }

    const zodTransporter: ZodBsvhuTransporter = {
      ...existingTransporter,
      ...graphqlInputToZodBsvhuTransporter(input)
    };

    // apply validation, sirenify, recipify
    const {
      id: parsedId,
      number,
      bsvhuId,
      createdAt,
      ...parsed
    } = await parseBsvhuTransporterAsync(zodTransporter);

    const data: Prisma.BsvhuTransporterUpdateInput = parsed;

    let updatedTransporter: BsvhuTransporter;
    if (existingTransporter.bsvhuId) {
      const { update: updateBsvhu } = getBsvhuRepository(user);
      const updatedBsvhu = await updateBsvhu(
        { id: existingTransporter.bsvhuId },
        { transporters: { update: { where: { id }, data } } }
      );
      const updatedTransporters = await getTransporters(updatedBsvhu);
      updatedTransporter = updatedTransporters.find(t => t.id === id)!;
    } else {
      updatedTransporter = await prisma.bsvhuTransporter.update({
        where: { id },
        data
      });
    }

    return expandTransporterFromDb(updatedTransporter);
  };

export default updateBsvhuTransporterResolver;
