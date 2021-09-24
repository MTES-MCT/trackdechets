import { UserInputError } from "apollo-server-express";
import omit from "object.omit";
import { Prisma, Bsff } from "@prisma/client";
import prisma from "../../../prisma";
import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  getBsffCreateGroupementInput,
  getBsffOrNotFound,
  getGroupingBsffs
} from "../../database";
import { flattenBsffInput, unflattenBsff } from "../../converter";
import { isBsffContributor } from "../../permissions";
import { validateBsff } from "../../validation";
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
      "weightValue",
      "weightIsEstimate",
      "destinationPlannedOperationCode"
    ]);

    delete input.grouping;
    delete input.forwarding;
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

  if (existingBsff.destinationReceptionSignatureDate) {
    flatInput = omit(flatInput, [
      "destinationCompanyAddress",
      "destinationCompanyContact",
      "destinationCompanyMail",
      "destinationCompanyName",
      "destinationCompanyPhone",
      "destinationCompanySiret",
      "destinationCap",
      "destinationReceptionDate",
      "destinationReceptionWeight",
      "destinationReceptionAcceptationStatus",
      "destinationReceptionRefusalReason"
    ]);
  }

  const futureBsff: Bsff = { ...existingBsff, ...flatInput };

  await isBsffContributor(user, futureBsff);

  const groupingBsffs =
    input.grouping?.length > 0
      ? await prisma.bsff.findMany({
          where: { id: { in: input.grouping.map(({ bsffId }) => bsffId) } }
        })
      : await getGroupingBsffs(existingBsff.id);

  const forwardingBsff = input.forwarding
    ? await getBsffOrNotFound({ id: input.forwarding })
    : existingBsff.forwardingId
    ? await prisma.bsff.findUnique({ where: { id: existingBsff.forwardingId } })
    : null;

  const previousBsffs = groupingBsffs;
  if (forwardingBsff) {
    previousBsffs.push(forwardingBsff);
  }

  const ficheInterventions = await prisma.bsffFicheIntervention.findMany({
    where:
      input.ficheInterventions?.length > 0
        ? { id: { in: input.ficheInterventions } }
        : { bsffId: existingBsff.id }
  });

  await validateBsff(futureBsff, previousBsffs, ficheInterventions);

  const data: Prisma.BsffUpdateInput = flatInput;

  if (input.grouping?.length > 0) {
    // delete previous groupements
    await prisma.bsffGroupement.deleteMany({
      where: { nextId: existingBsff.id }
    });
    data.grouping = await getBsffCreateGroupementInput(input.grouping);
  }

  if (input.forwarding) {
    // disconnect previous relation
    await prisma.bsff.update({
      where: { id },
      data: { forwarding: { disconnect: true } }
    });
    data.forwarding = { connect: { id: input.forwarding } };
  }

  if (ficheInterventions.length > 0) {
    data.ficheInterventions = {
      set: ficheInterventions.map(({ id }) => ({ id }))
    };
  }

  const updatedBsff = await prisma.bsff.update({
    data,
    where: { id }
  });

  await indexBsff(updatedBsff, context);

  return unflattenBsff(updatedBsff);
};

export default updateBsff;
