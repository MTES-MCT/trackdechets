import {
  expandBsdasriFromDb,
  flattenBsdasriInput
} from "../../dasri-converter";
import { Bsdasri, BsdasriStatus } from "@prisma/client";
import prisma from "../../../prisma";
import {
  ResolversParentTypes,
  MutationUpdateBsdasriArgs,
  RegroupedBsdasriInput
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
  "processingOperation",
  "processedAt",
  "recipientWasteQuantity"
];

const fieldsAllowedForUpdateOnceSent: BsdasriField[] = fieldsAllowedForUpdateOnceReceived.concat(
  [
    "recipientCompanyName",
    "recipientCompanySiret",
    "recipientCompanyAddress",
    "recipientCompanyContact",
    "recipientCompanyPhone",
    "recipientCompanyMail",
    "recipientWastePackagingsInfo",
    "recipientWasteAcceptationStatus",
    "recipientWasteRefusalReason",
    "recipientWasteRefusedQuantity",
    "recipientWasteVolume",
    "receivedAt",
    "handedOverToRecipientAt",
    "recipientCustomInfo"
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
    "transporterReceipt",
    "transporterReceiptDepartment",
    "transporterReceiptValidityLimit",
    "transporterWasteAcceptationStatus",
    "transporterWasteRefusalReason",
    "transporterWasteRefusedQuantity",
    "transporterTakenOverAt",
    "transporterWastePackagingsInfo",
    "transporterWasteQuantity",
    "transporterWasteQuantityType",
    "transporterWasteVolume",
    "handedOverToRecipientAt",
    "transporterCustomInfo",
    "transportMode"
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

const getRegroupedBsdasriArgs = (
  inputRegroupedBsdasris: RegroupedBsdasriInput[] | null | undefined
) => {
  if (inputRegroupedBsdasris === null || inputRegroupedBsdasris?.length === 0) {
    return { regroupedBsdasris: { set: [] } };
  }

  const args = !!inputRegroupedBsdasris ? { set: inputRegroupedBsdasris } : {};
  return { regroupedBsdasris: args };
};

const getIsRegrouping = (dbRegroupedBsdasris, regroupedBsdasris) => {
  // new input does not provide info about regrouped dasris: use db value
  if (regroupedBsdasris === undefined) {
    return {
      isRegrouping: !!dbRegroupedBsdasris.length
    };
  }
  // else use provided input value

  return { isRegrouping: !!regroupedBsdasris?.length };
};

/**
 * Bsdasri update mutation
 * sets bsdasriType to `GROUPING` if a non empty array of regroupedBsdasris is provided
 * sets bsdasriType to `SIMPLE` if a null regroupedBsdasris field is provided
 */
const dasriUpdateResolver = async (
  parent: ResolversParentTypes["Mutation"],
  args: MutationUpdateBsdasriArgs,
  context: GraphQLContext
) => {
  const user = checkIsAuthenticated(context);

  const { id, input } = { ...args };

  const { regroupedBsdasris: inputRegroupedBsdasris, ...dasriContent } = input;

  const {
    regroupedBsdasris: dbRegroupedBsdasris,
    ...dbBsdasri
  } = await getBsdasriOrNotFound({ id, includeRegrouped: true });

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
  const isRegrouping = getIsRegrouping(
    dbRegroupedBsdasris,
    inputRegroupedBsdasris
  );

  await validateBsdasri(expectedBsdasri, {
    ...isRegrouping
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
      ...getRegroupedBsdasriArgs(inputRegroupedBsdasris),
      bsdasriType: isRegrouping.isRegrouping ? "GROUPING" : "SIMPLE"
    }
  });

  const expandedDasri = expandBsdasriFromDb(updatedDasri);
  await indexBsdasri(updatedDasri, context);
  return expandedDasri;
};

export default dasriUpdateResolver;
