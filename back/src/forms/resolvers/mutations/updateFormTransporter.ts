import { Prisma } from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { prisma } from "@td/prisma";
import {
  expandTransporterFromDb,
  flattenTransporterInput
} from "../../converter";
import { transporterSchemaFn } from "../../validation";
import { getFormTransporterOrNotFound } from "../../database";
import { checkCanUpdateFormTransporter } from "../../permissions";
import { UserInputError } from "../../../common/errors";
import { sirenifyTransporterInput } from "../../sirenify";
import { recipifyTransporterInput } from "../../recipify";

const updateFormTransporterResolver: MutationResolvers["updateFormTransporter"] =
  async (parent, { id, input }, context) => {
    const user = checkIsAuthenticated(context);
    const existingTransporter = await getFormTransporterOrNotFound({ id });
    if (existingTransporter.takenOverAt) {
      throw new UserInputError(
        "Impossible de modifier ce transporteur car il a déjà signé le bordereau"
      );
    }
    if (existingTransporter.formId) {
      // Si le transporteur a été associé à un bordereau, il devient nécessaire d'avoir les droits
      // sur ce bordereau pour pouvoir modifier le transporteur
      const form = await prisma.bsddTransporter
        .findUniqueOrThrow({
          where: { id }
        })
        .form();
      await checkCanUpdateFormTransporter(user, form!, id, input);
    }
    const isUpdatingCompany =
      input?.company?.siret || input?.company?.vatNumber;

    const sirenifiedInput = await sirenifyTransporterInput(input, user);
    const recipifiedInput = await recipifyTransporterInput({
      ...sirenifiedInput,
      ...(isUpdatingCompany
        ? {}
        : // Si on n'est pas en train de modifier l'établissement, il faut passer
          // explicitement le SIRET et le VAT existant ici pour que le calcul du
          // récépissé ait bien lieu quand on fait le changement isExemptedOfReceipt = true => false
          {
            company: {
              siret: existingTransporter.transporterCompanySiret,
              vatNumber: existingTransporter.transporterCompanyVatNumber
            }
          })
    });

    const data: Prisma.BsddTransporterUpdateInput = flattenTransporterInput({
      transporter: recipifiedInput
    });
    await transporterSchemaFn({}).validate(
      { ...existingTransporter, ...data },
      { abortEarly: false }
    );
    const transporter = await prisma.bsddTransporter.update({
      where: { id },
      data
    });
    return expandTransporterFromDb(transporter);
  };

export default updateFormTransporterResolver;
