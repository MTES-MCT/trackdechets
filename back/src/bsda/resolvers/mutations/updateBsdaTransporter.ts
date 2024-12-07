import { BsdaTransporter, Prisma } from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationResolvers } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import { expandTransporterFromDb } from "../../converter";
import { getBsdaTransporterOrNotFound, getTransporters } from "../../database";
import { checkCanUpdateBsdaTransporter } from "../../permissions";
import { UserInputError } from "../../../common/errors";
import { getBsdaRepository } from "../../repository";
import { ZodBsdaTransporter } from "../../validation/schema";
import { graphqlInputToZodBsdaTransporter } from "../../validation/helpers";
import { parseBsdaTransporterAsync } from "../../validation";

const updateBsdaTransporterResolver: MutationResolvers["updateBsdaTransporter"] =
  async (parent, { id, input }, context) => {
    const user = checkIsAuthenticated(context);
    const existingTransporter = await getBsdaTransporterOrNotFound({ id });
    if (existingTransporter.transporterTransportSignatureDate) {
      throw new UserInputError(
        "Impossible de modifier ce transporteur car il a déjà signé le bordereau"
      );
    }
    if (existingTransporter.bsdaId) {
      // Si le transporteur a été associé à un bordereau, il devient nécessaire d'avoir les droits
      // sur ce bordereau pour pouvoir modifier le transporteur
      const bsda = await prisma.bsdaTransporter
        .findUniqueOrThrow({
          where: { id }
        })
        .bsda({ include: { transporters: true } });
      await checkCanUpdateBsdaTransporter(user, bsda!, id, input);
    }

    const zodTransporter: ZodBsdaTransporter = {
      ...existingTransporter,
      ...graphqlInputToZodBsdaTransporter(input)
    };

    // apply validation, sirenify, recipify
    const {
      id: parsedId,
      number,
      bsdaId,
      ...parsed
    } = await parseBsdaTransporterAsync(zodTransporter);

    const data: Prisma.BsdaTransporterUpdateInput = parsed;

    let updatedTransporter: BsdaTransporter;
    if (existingTransporter.bsdaId) {
      // Si le transporteur est déjà associé à un bordereau, on passe par l'update
      // du repository pour être certain que l'événement soit loggué et que le
      // réindex ait lieu
      const { update: updateBsda } = getBsdaRepository(user);
      const updatedBsda = await updateBsda(
        { id: existingTransporter.bsdaId },
        { transporters: { update: { where: { id }, data } } }
      );
      const updatedTransporters = await getTransporters(updatedBsda);
      updatedTransporter = updatedTransporters.find(t => t.id === id)!;
    } else {
      updatedTransporter = await prisma.bsdaTransporter.update({
        where: { id },
        data
      });
    }

    return expandTransporterFromDb(updatedTransporter);
  };

export default updateBsdaTransporterResolver;
