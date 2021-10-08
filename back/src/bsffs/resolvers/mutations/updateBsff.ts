import { UserInputError } from "apollo-server-express";
import omit from "object.omit";
import { Prisma, Bsff } from "@prisma/client";
import prisma from "../../../prisma";
import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getBsffOrNotFound } from "../../database";
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
      "wasteDescription",
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

  const forwardedBsff = input.forwarding
    ? await getBsffOrNotFound({ id: input.forwarding })
    : existingBsff.forwardingId
    ? await prisma.bsff.findUnique({ where: { id: existingBsff.forwardingId } })
    : null;

  const repackagedBsffs =
    input.repackaging?.length > 0
      ? await prisma.bsff.findMany({ where: { id: { in: input.repackaging } } })
      : await prisma.bsff.findFirst({ where: { id } }).repackaging();

  const groupedBsffs =
    input.grouping?.length > 0
      ? await prisma.bsff.findMany({ where: { id: { in: input.grouping } } })
      : await prisma.bsff.findFirst({ where: { id } }).grouping();

  const isForwarding = !!forwardedBsff;
  const isRepackaging = repackagedBsffs.length > 0;
  const isGrouping = groupedBsffs.length > 0;

  if ([isForwarding, isRepackaging, isGrouping].filter(b => b).length > 1) {
    throw new UserInputError(
      "Les opérations d'entreposage provisoire, reconditionnement et groupement ne sont pas compatibles entre elles"
    );
  }

  const previousBsffs = [
    ...(isForwarding ? [forwardedBsff] : []),
    ...groupedBsffs,
    ...repackagedBsffs
  ];

  const ficheInterventions = await prisma.bsffFicheIntervention.findMany({
    where:
      input.ficheInterventions?.length > 0
        ? { id: { in: input.ficheInterventions } }
        : { bsffId: existingBsff.id }
  });

  await validateBsff(futureBsff, previousBsffs, ficheInterventions);

  const data: Prisma.BsffUpdateInput = flatInput;

  if (input.grouping?.length > 0) {
    data.grouping = {
      set: input.grouping.map(id => ({
        id
      }))
    };
  }

  if (input.repackaging?.length > 0) {
    data.repackaging = {
      set: input.repackaging.map(id => ({
        id
      }))
    };
  }

  if (input.forwarding) {
    // disconnect current relation
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
