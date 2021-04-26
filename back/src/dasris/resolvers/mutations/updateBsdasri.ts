import {
  expandBsdasriFromDb,
  flattenBsdasriInput
} from "../../dasri-converter";
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

const fieldsAllowedForUpdateOnceReceived = [
  "processingOperation",
  "processedAt"
];

const fieldsAllowedForUpdateOnceSent = fieldsAllowedForUpdateOnceReceived.concat(
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
    "recipientWasteQuantity",
    "recipientWasteVolume",
    "receivedAt",
    "handedOverToRecipientAt",
    "recipientCustomInfo"
  ]
);
const fieldsAllowedForUpdateOnceSignedByEmitter = fieldsAllowedForUpdateOnceSent.concat(
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
    "transporterSignedBy",
    "transporterSignedAt",
    "transporterCustomInfo"
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
const getRegroupedBsdasriArgs = inputRegroupedBsdasris => {
  if (inputRegroupedBsdasris === null) {
    return { set: [] };
  }

  const args = !!inputRegroupedBsdasris
    ? { connect: inputRegroupedBsdasris }
    : {};
  return { regroupedBsdasris: args };
};
const getIsRegrouping = (dbRegroupedBsdasris, regroupedBsdasris) => {
  if (regroupedBsdasris === null) {
    return { isRegrouping: false };
  }
  if (regroupedBsdasris === undefined) {
    return {
      isRegrouping:
        (!!regroupedBsdasris && !!regroupedBsdasris.length) ||
        !!dbRegroupedBsdasris.length
    };
  }
  if (!!regroupedBsdasris) {
    return { isRegrouping: true };
  }
};
const dasriUpdateResolver = async (
  parent: ResolversParentTypes["Mutation"],
  args: MutationUpdateBsdasriArgs,
  context: GraphQLContext
) => {
  const user = checkIsAuthenticated(context);

  const { bsdasriUpdateInput } = { ...args };

  const {
    regroupedBsdasris: inputRegroupedBsdasris,
    id,
    ...dasriContent
  } = bsdasriUpdateInput;

  const {
    regroupedBsdasris: dbRegroupedBsdasris,
    ...dbBsdasri
  } = await getBsdasriOrNotFound({ id, includeRegrouped: true });

  await checkIsBsdasriContributor(
    user,
    dbBsdasri,
    "Vous ne pouvez pas modifier un bordereau sur lequel votre entreprise n'apparait pas"
  );

  if (["PROCESSED", "REFUSED"].includes(dbBsdasri.status)) {
    throw new ForbiddenError("Ce bordereau n'est plus modifiable");
  }

  const flattenedInput = flattenBsdasriInput(dasriContent);

  const expectedBsdasri = { ...dbBsdasri, ...flattenedInput };
  // Validate form input
  await validateBsdasri(expectedBsdasri, {
    ...getIsRegrouping(dbRegroupedBsdasris, inputRegroupedBsdasris)
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
      ...getRegroupedBsdasriArgs(inputRegroupedBsdasris)
    }
  });
  return expandBsdasriFromDb(updatedDasri);
};

export default dasriUpdateResolver;
