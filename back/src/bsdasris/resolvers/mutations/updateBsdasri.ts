import { unflattenBsdasri, flattenBsdasriInput } from "../../converter";
import { Bsdasri, BsdasriStatus } from "@prisma/client";
import prisma from "../../../prisma";
import {
  ResolversParentTypes,
  MutationUpdateBsdasriArgs
} from "../../../generated/graphql/types";

import { checkIsAuthenticated } from "../../../common/permissions";
import { checkIsBsdasriContributor } from "../../permissions";

import { GraphQLContext } from "../../../types";
import { getBsdasriOrNotFound } from "../../database";
import { validateBsdasri } from "../../validation";
import { ForbiddenError } from "apollo-server-express";
import { indexBsdasri } from "../../elastic";

type BsdasriField = keyof Bsdasri;
const fieldsAllowedForUpdateOnceReceived: BsdasriField[] = [
  "destinationOperationCode",
  "destinationOperationDate",
  "destinationReceptionWasteWeightValue"
];

const fieldsAllowedForUpdateOnceSent: BsdasriField[] = fieldsAllowedForUpdateOnceReceived.concat(
  [
    "destinationCompanyName",
    "destinationCompanySiret",
    "destinationCompanyAddress",
    "destinationCompanyContact",
    "destinationCompanyPhone",
    "destinationCompanyMail",
    "destinationCustomInfo",
    "destinationWastePackagings",
    "destinationReceptionAcceptationStatus",
    "destinationReceptionWasteRefusalReason",
    "destinationReceptionWasteRefusedWeightValue",
    "destinationReceptionWasteVolume",
    "destinationReceptionDate",
    "handedOverToRecipientAt" // optional field to be filled by transporter once waste is received
  ]
);

const fieldsAllowedForUpdateOnceSignedByEmitter: BsdasriField[] = fieldsAllowedForUpdateOnceSent.concat(
  [
    "transporterCompanyName",
    "transporterCompanySiret",
    "transporterCompanyAddress",
    "transporterCompanyPhone",
    "transporterCompanyContact",
    "transporterCompanyMail",
    "transporterRecepisseNumber",
    "transporterRecepisseDepartment",
    "transporterRecepisseValidityLimit",
    "transporterAcceptationStatus",
    "transporterWasteRefusalReason",
    "transporterWasteRefusedWeightValue",
    "transporterTakenOverAt",
    "transporterWastePackagings",
    "transporterWasteWeightValue",
    "transporterWasteWeightIsEstimate",
    "transporterWasteVolume",
    "handedOverToRecipientAt",
    "transporterCustomInfo",
    "transporterTransportMode",
    "transporterTransportPlates"
  ]
);

const getFieldsAllorwedForUpdate = (bsdasri: Bsdasri) => {
  const allowedFields = {
    [BsdasriStatus.SIGNED_BY_PRODUCER]: fieldsAllowedForUpdateOnceSignedByEmitter,
    [BsdasriStatus.SENT]: fieldsAllowedForUpdateOnceSent,
    [BsdasriStatus.RECEIVED]: fieldsAllowedForUpdateOnceReceived,
    [BsdasriStatus.PROCESSED]: []
  };
  return allowedFields[bsdasri.status];
};

const getGroupedBsdasriArgs = (
  inputRegroupedBsdasris: string[] | null | undefined
) => {
  if (inputRegroupedBsdasris === null) {
    return { grouping: { set: [] } };
  }

  const args = !!inputRegroupedBsdasris
    ? {
        set: inputRegroupedBsdasris.map(id => ({
          id
        }))
      }
    : {};
  return { grouping: args };
};

const getIsGrouping = (dbGrouping, grouping) => {
  // new input does not provide info about regrouped dasris: use db value
  if (grouping === undefined) {
    return {
      isGrouping: !!dbGrouping.length
    };
  }
  // else use provided input value

  return { isGrouping: !!grouping?.length };
};

/**
 * Bsdasri update mutation
 * sets type to `GROUPING` if a non empty array of grouping is provided
 * sets type to `SIMPLE` if a null grouping field is provided
 */
const dasriUpdateResolver = async (
  parent: ResolversParentTypes["Mutation"],
  args: MutationUpdateBsdasriArgs,
  context: GraphQLContext
) => {
  const user = checkIsAuthenticated(context);

  const { id, input } = { ...args };

  const { grouping: inputGrouping, ...dasriContent } = input;

  const { grouping: dbGrouping, ...dbBsdasri } = await getBsdasriOrNotFound({
    id,
    includeGrouped: true
  });

  await checkIsBsdasriContributor(
    user,
    dbBsdasri,
    "Vous ne pouvez pas modifier un bordereau sur lequel votre entreprise n'apparaît pas"
  );

  if (["PROCESSED", "REFUSED"].includes(dbBsdasri.status)) {
    throw new ForbiddenError("Ce bordereau n'est plus modifiable");
  }

  const flattenedInput = flattenBsdasriInput(dasriContent);

  const expectedBsdasri = { ...dbBsdasri, ...flattenedInput };
  // Validate form input
  const isGrouping = getIsGrouping(dbGrouping, inputGrouping);

  await validateBsdasri(expectedBsdasri, {
    ...isGrouping
  });

  const flattenedFields = Object.keys(flattenedInput);

  // except for draft and sealed status, update fields are whitelisted
  if (dbBsdasri.status !== "INITIAL") {
    const allowedFields = getFieldsAllorwedForUpdate(dbBsdasri);

    const diff = flattenedFields.filter(el => !allowedFields.includes(el));

    if (!!diff.length) {
      const errMessage = `Des champs ont été verrouillés via signature et ne peuvent plus être modifiés: ${diff.join()}`;
      throw new ForbiddenError(errMessage);
    }
  }

  const updatedDasri = await prisma.bsdasri.update({
    where: { id },
    data: {
      ...flattenedInput,
      ...getGroupedBsdasriArgs(inputGrouping),
      type: isGrouping.isGrouping ? "GROUPING" : "SIMPLE"
    }
  });

  const expandedDasri = unflattenBsdasri(updatedDasri);
  await indexBsdasri(updatedDasri);
  return expandedDasri;
};

export default dasriUpdateResolver;
