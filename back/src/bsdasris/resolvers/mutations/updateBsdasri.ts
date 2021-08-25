import {
  expandBsdasriFromDb,
  flattenBsdasriInput
} from "../../dasri-converter";
import { Bsdasri, BsdasriStatus } from "@prisma/client";
import prisma from "../../../prisma";
import {
  ResolversParentTypes,
  MutationUpdateBsdasriArgs,
  SynthesisedBsdasriInput
} from "../../../generated/graphql/types";

import { checkIsAuthenticated } from "../../../common/permissions";
import { checkIsBsdasriContributor } from "../../permissions";

import { GraphQLContext } from "../../../types";
import { getBsdasriOrNotFound } from "../../database";
import { validateBsdasri } from "../../validation";
import { ForbiddenError } from "apollo-server-express";
import { indexBsdasri } from "../../elastic";
import { BsdasriGroupingParameterError } from "../../errors";
import {
  emitterIsAllowedToGroup,
  checkDasrisAreAssociable,
  getBsdasriType
} from "./utils";
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

const getBsdasriAssociationArgs = (
  inputAssociatedBsdasris: SynthesisedBsdasriInput[] | null | undefined
) => {
  if (
    inputAssociatedBsdasris === null ||
    inputAssociatedBsdasris?.length === 0
  ) {
    return { set: [] };
  }

  const args = !!inputAssociatedBsdasris
    ? { set: inputAssociatedBsdasris }
    : {};
  return args;
};

/**
 *
 * Is this dasri grouping or synthesizing other dasris
 */
const isDasriAssociating = ({
  dbAssociatedBsdasris,
  inputAssociatedBsdasris,
  parameterName
}: {
  dbAssociatedBsdasris: { id?: string }[] | null | undefined;
  inputAssociatedBsdasris: { id?: string }[] | null | undefined;
  parameterName: "isRegrouping" | "isSynthesizing";
}) => {
  // new input does not provide info about synthesized dasris: use db value
  if (inputAssociatedBsdasris === undefined) {
    return {
      [parameterName]: !!dbAssociatedBsdasris?.length
    };
  }
  // else use provided input value
  return { [parameterName]: !!inputAssociatedBsdasris?.length };
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

  const {
    regroupedBsdasris: inputRegroupedBsdasris,
    synthesizedBsdasris: inputSynthesizedBsdasris,
    ...dasriContent
  } = input;

  if (!!inputRegroupedBsdasris?.length && !!inputSynthesizedBsdasris?.length) {
    throw new BsdasriGroupingParameterError();
  }

  const {
    regroupedBsdasris: dbRegroupedBsdasris,
    synthesizedBsdasris: dbSynthesizedBsdasris,
    ...dbBsdasri
  } = await getBsdasriOrNotFound({
    id,
    includeRegrouped: true,
    includeSynthesized: true
  });

  await checkIsBsdasriContributor(
    user,
    dbBsdasri,
    "Vous ne pouvez pas modifier un bordereau sur lequel votre entreprise n'apparaît pas"
  );

  if (["PROCESSED", "REFUSED"].includes(dbBsdasri.status)) {
    throw new ForbiddenError("Ce bordereau n'est plus modifiable");
  }

  const isRegrouping = isDasriAssociating({
    dbAssociatedBsdasris: dbRegroupedBsdasris,
    inputAssociatedBsdasris: inputRegroupedBsdasris,
    parameterName: "isRegrouping"
  });

  const isSynthesizing = isDasriAssociating({
    dbAssociatedBsdasris: dbSynthesizedBsdasris,
    inputAssociatedBsdasris: inputSynthesizedBsdasris,
    parameterName: "isSynthesizing"
  });

  // Final dasri can't be both grouping and synthesizing other dasris
  if (isRegrouping.isRegrouping && isSynthesizing.isSynthesizing) {
    throw new BsdasriGroupingParameterError();
  }

  const flattenedInput = flattenBsdasriInput(dasriContent);
  const expectedBsdasri = { ...dbBsdasri, ...flattenedInput };
  const dbRegroupedBsdasrisIds = dbRegroupedBsdasris?.map(bsd => bsd.id);
  const dbSynthesizedBsdasrisIds = dbSynthesizedBsdasris.map(bsd => bsd.id);

  if (isRegrouping.isRegrouping) {
    // is emitter allowed to group dasris ?
    await emitterIsAllowedToGroup(expectedBsdasri?.emitterCompanySiret);

    // are the provided dasris groupable ?
    // we filter out already associated bsd
    await checkDasrisAreAssociable({
      bsdasrisToAssociate: inputRegroupedBsdasris?.filter(
        bsd =>
          !dbRegroupedBsdasrisIds?.includes(bsd.id) &&
          !dbSynthesizedBsdasrisIds?.includes(bsd.id)
      ),
      emitterSiret: expectedBsdasri.emitterCompanySiret,
      associationType: "group"
    });
  }
  if (isSynthesizing.isSynthesizing) {
    // todo : check if emitter is allowed to update a synthesis dasri
    // are the provided dasris suitable for a synthesis dasri ?
    // we filter out already associated bsds
    await checkDasrisAreAssociable({
      bsdasrisToAssociate: inputSynthesizedBsdasris?.filter(
        bsd =>
          !dbRegroupedBsdasrisIds?.includes(bsd.id) &&
          !dbSynthesizedBsdasrisIds?.includes(bsd.id)
      ),
      emitterSiret: expectedBsdasri.emitterCompanySiret,
      associationType: "synthesis"
    });
  }

  // Validate form input
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

      regroupedBsdasris: getBsdasriAssociationArgs(inputRegroupedBsdasris),
      synthesizedBsdasris: getBsdasriAssociationArgs(inputSynthesizedBsdasris),
      bsdasriType: getBsdasriType(
        isRegrouping.isRegrouping,
        isSynthesizing.isSynthesizing
      )
    }
  });

  const expandedDasri = expandBsdasriFromDb(updatedDasri);
  await indexBsdasri(updatedDasri);
  return expandedDasri;
};

export default dasriUpdateResolver;
