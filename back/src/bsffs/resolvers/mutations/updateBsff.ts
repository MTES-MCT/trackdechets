import { UserInputError } from "apollo-server-express";
import omit from "object.omit";
import { Prisma, Bsff } from "@prisma/client";
import prisma from "../../../prisma";
import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getBsffOrNotFound } from "../../database";
import { flattenBsffInput, unflattenBsff } from "../../converter";
import { isBsffContributor } from "../../permissions";
import { isValidPreviousBsffs } from "../../validation";
import { indexBsff } from "../../elastic";

const updateBsff: MutationResolvers["updateBsff"] = async (
  _,
  { id, input },
  context
) => {
  const user = checkIsAuthenticated(context);

  const existingBsff = await getBsffOrNotFound({ id });
  await isBsffContributor(user, existingBsff);

  if (existingBsff.destinationOperationSignatureDate) {
    throw new UserInputError(
      `Il n'est pas possible d'éditer un bordereau dont le traitement final a été signé`
    );
  }

  let flatInput = flattenBsffInput(input);

  if (existingBsff.emitterEmissionSignatureDate) {
    flatInput = omit(flatInput, [
      "type",
      "emitterCompanyAddress",
      "emitterCompanyContact",
      "emitterCompanyMail",
      "emitterCompanyName",
      "emitterCompanyPhone",
      "emitterCompanySiret",
      "wasteCode",
      "wasteNature",
      "quantityKilos",
      "quantityIsEstimate",
      "destinationPlannedOperationCode"
    ]);

    delete input.previousBsffs;
    delete input.ficheInterventions;
  }

  if (existingBsff.transporterTransportSignatureDate) {
    flatInput = omit(flatInput, [
      "transporterCompanyAddress",
      "transporterCompanyContact",
      "transporterCompanyMail",
      "transporterCompanyName",
      "transporterCompanyPhone",
      "transporterCompanySiret",
      "transporterCompanyVatNumber",
      "transporterRecepisseDepartment",
      "transporterRecepisseNumber",
      "transporterRecepisseValidityLimit",
      "transporterTransportMode",
      "packagings",
      "wasteAdr"
    ]);
  }

  if (existingBsff.destinationReceptionDate) {
    flatInput = omit(flatInput, [
      "destinationCompanyAddress",
      "destinationCompanyContact",
      "destinationCompanyMail",
      "destinationCompanyName",
      "destinationCompanyPhone",
      "destinationCompanySiret",
      "destinationCap",
      "destinationReceptionDate",
      "destinationReceptionKilos",
      "destinationReceptionRefusal"
    ]);
  }

  const futureBsff: Bsff = { ...existingBsff, ...flatInput };
  await isBsffContributor(user, futureBsff);

  const data: Prisma.BsffUpdateInput = flatInput;

  if (input.previousBsffs) {
    await isValidPreviousBsffs(futureBsff.type, input.previousBsffs);
    data.previousBsffs = {
      set: input.previousBsffs.map(id => ({ id }))
    };
  }

  if (input.ficheInterventions) {
    data.ficheInterventions = {
      set: input.ficheInterventions.map(id => ({ id }))
    };
  }

  const updatedBsff = await prisma.bsff.update({
    data,
    where: { id }
  });

  await indexBsff(updatedBsff);

  return unflattenBsff(updatedBsff);
};

export default updateBsff;
