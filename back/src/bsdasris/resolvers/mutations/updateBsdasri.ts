import { expandBsdasriFromDB, flattenBsdasriInput } from "../../converter";
import { Bsdasri, BsdasriStatus, BsdasriType } from "@prisma/client";
import prisma from "../../../prisma";
import {
  ResolversParentTypes,
  MutationUpdateBsdasriArgs
} from "../../../generated/graphql/types";

import { checkIsAuthenticated } from "../../../common/permissions";
import {
  checkIsBsdasriContributor,
  checkCanEditBsdasri
} from "../../permissions";

import { GraphQLContext } from "../../../types";
import { getBsdasriOrNotFound } from "../../database";
import { validateBsdasri } from "../../validation";
import { ForbiddenError, UserInputError } from "apollo-server-express";
import { indexBsdasri } from "../../elastic";
import { getCachedUserSirets } from "../../../common/redis/users";

import {
  checkDasrisAreEligibleForSynthesis,
  emitterBelongsToUserSirets
} from "./utils";

type BsdasriField = keyof Bsdasri;
const fieldsAllowedForUpdateOnceReceived: BsdasriField[] = [
  "destinationOperationCode",
  "destinationOperationDate",
  "destinationReceptionWasteWeightValue"
];

const fieldsAllowedForUpdateOnceSent: BsdasriField[] =
  fieldsAllowedForUpdateOnceReceived.concat([
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
    "identificationNumbers",
    "handedOverToRecipientAt" // optional field to be filled by transporter once waste is received
  ]);

const fieldsAllowedForUpdateOnceSignedByEmitter: BsdasriField[] =
  fieldsAllowedForUpdateOnceSent.concat([
    "transporterCompanyName",
    "transporterCompanySiret",
    "transporterCompanyAddress",
    "transporterCompanyPhone",
    "transporterCompanyContact",
    "transporterCompanyMail",
    "transporterCompanyVatNumber",
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
  ]);

const getFieldsAllorwedForUpdate = (bsdasri: Bsdasri) => {
  const allowedFields = {
    [BsdasriStatus.SIGNED_BY_PRODUCER]:
      fieldsAllowedForUpdateOnceSignedByEmitter,
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

const getSynthesizedBsdasriArgs = (
  inputSynthesizedBsdasris: string[] | null | undefined
) => {
  if (inputSynthesizedBsdasris === null) {
    return { synthesizing: { set: [] } };
  }

  const args = !!inputSynthesizedBsdasris
    ? {
        set: inputSynthesizedBsdasris.map(id => ({
          id
        }))
      }
    : {};
  return { synthesizing: args };
};

const getIsGrouping = (dbGrouping, grouping) => {
  // new input does not provide info about regrouped dasris: use db value
  if (grouping === undefined) {
    return !!dbGrouping.length;
  }
  // else use provided input value

  return !!grouping?.length;
};

const getIsSynthesizing = (dbSynthesizing, synthesizing) => {
  // new input does not provide info about regrouped dasris: use db value

  if (synthesizing === undefined) {
    return !!dbSynthesizing.length;
  }
  // else use provided input value

  return !!synthesizing?.length;
};

const getType = (isGrouping: boolean, isSynthesizing: boolean): BsdasriType => {
  if (isGrouping) {
    return BsdasriType.GROUPING;
  }
  if (isSynthesizing) {
    return BsdasriType.SYNTHESIS;
  }
  return BsdasriType.SIMPLE;
};

/**
 * Bsdasri update mutation
 * sets type to `GROUPING` if a non empty array of grouping is provided
 * sets type to `SIMPLE` if a null grouping field is provided
 */
const dasriUpdateResolver = async (
  parent: ResolversParentTypes["Mutation"],
  { id, input }: MutationUpdateBsdasriArgs,
  context: GraphQLContext
) => {
  const user = checkIsAuthenticated(context);
  const userSirets = await getCachedUserSirets(user.id);

  const { grouping: inputGrouping, synthesizing: inputSynthesizing } = input;

  const {
    grouping: dbGrouping,
    synthesizing: dbSynthesizing,

    ...dbBsdasri
  } = await getBsdasriOrNotFound({
    id,
    includeAssociated: true
  });

  checkCanEditBsdasri(dbBsdasri);
  const formSirets = {
    emitterCompanySiret: dbBsdasri?.emitterCompanySiret,
    destinationCompanySiret: dbBsdasri?.destinationCompanySiret,
    transporterCompanySiret: dbBsdasri?.transporterCompanySiret
  };

  await checkIsBsdasriContributor(
    user,
    formSirets,
    "Vous ne pouvez pas modifier un bordereau sur lequel votre entreprise n'apparaît pas"
  );

  if (["PROCESSED", "REFUSED"].includes(dbBsdasri.status)) {
    throw new ForbiddenError("Ce bordereau n'est plus modifiable");
  }

  const flattenedInput = flattenBsdasriInput(input);

  const expectedBsdasri = { ...dbBsdasri, ...flattenedInput };

  // Validate form input

  const isGrouping = getIsGrouping(dbGrouping, inputGrouping);
  const isSynthesizing = getIsSynthesizing(dbSynthesizing, inputSynthesizing);

  if (isGrouping && isSynthesizing) {
    throw new UserInputError(
      "Un bordereau dasri ne peut pas à la fois être un bsd de synthèse et de groupement"
    );
  }

  if (inputGrouping !== undefined || inputSynthesizing !== undefined) {
    if (dbBsdasri.status !== BsdasriStatus.INITIAL) {
      throw new UserInputError(
        "Les bordereaux associés à ce bsd ne sont plus modifiables"
      );
    }
  }

  if (isSynthesizing && flattenedInput.emitterCompanySiret !== undefined) {
    await emitterBelongsToUserSirets(
      flattenedInput.emitterCompanySiret,
      userSirets
    );
  }
  if (isSynthesizing && !!inputSynthesizing?.length) {
    // filter dasris already associated to current dasri
    const newBsdToAssociate = inputSynthesizing.filter(
      el => !dbSynthesizing.map(el => el.id).includes(el)
    );
    await checkDasrisAreEligibleForSynthesis(
      newBsdToAssociate,
      flattenedInput.emitterCompanySiret
    );
  }

  await validateBsdasri(expectedBsdasri, {
    isGrouping,
    isSynthesizing
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
      ...getSynthesizedBsdasriArgs(inputSynthesizing),
      type: getType(isGrouping, isSynthesizing)
    }
  });

  const expandedDasri = expandBsdasriFromDB(updatedDasri);
  await indexBsdasri(updatedDasri);
  return expandedDasri;
};

export default dasriUpdateResolver;
