import { UserInputError } from "apollo-server-express";
import omit from "object.omit";
import { Prisma } from ".prisma/client";
import prisma from "../../../prisma";
import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getBsffOrNotFound } from "../../database";
import { flattenBsffInput, unflattenBsff } from "../../converter";
import { isBsffContributor } from "../../permissions";
import { canAssociateBsffs } from "../../validation";

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
      "destinationPlannedOperationCode",
      "destinationPlannedOperationQualification"
    ]);
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

  await isBsffContributor(user, { ...existingBsff, ...flatInput });

  const data: Prisma.BsffUpdateInput = flatInput;

  if (input.bsffs?.length > 0) {
    await canAssociateBsffs(input.bsffs);
    data.bsffs = {
      set: input.bsffs.map(id => ({ id }))
    };
  }

  const bsff = await prisma.bsff.update({
    data,
    where: { id }
  });
  return {
    ...unflattenBsff(bsff),
    ficheInterventions: [],
    bsffs: []
  };
};

export default updateBsff;
