import { BsddTransporter, Prisma } from "@td/prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationResolvers } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import {
  expandTransporterFromDb,
  flattenTransporterInput
} from "../../converter";
import { transporterSchemaFn } from "../../validation";
import { getFormTransporterOrNotFound, getTransporters } from "../../database";
import { checkCanUpdateFormTransporter } from "../../permissions";
import { UserInputError } from "../../../common/errors";
import { sirenifyTransporterInput } from "../../sirenify";
import { recipifyTransporterInput } from "../../recipify";
import { getFormRepository } from "../../repository";

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

    let updatedTransporter: BsddTransporter;

    if (existingTransporter.formId) {
      // Si le transporteur est déjà associé à un bordereau, on passe par l'update
      // du form repository pour être certain que l'événement soit loggué, que le
      // réindex ait lieu, et que `Form.transporterSirets` soit recalculé.
      const { update: updateForm } = getFormRepository(user);
      const updatedForm = await updateForm(
        { id: existingTransporter.formId },
        { transporters: { update: { where: { id }, data } } }
      );
      const updatedTransporters = await getTransporters(updatedForm);
      updatedTransporter = updatedTransporters.find(t => t.id === id)!;
    } else {
      updatedTransporter = await prisma.bsddTransporter.update({
        where: { id },
        data
      });
    }
    return expandTransporterFromDb(updatedTransporter);
  };

export default updateFormTransporterResolver;
