import {
  MutationMarkAsCollectedArgs,
  ResolversParentTypes
} from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { UserInputError } from "apollo-server-express";
import { isValidDatetime, validateSecurityCode } from "../../validation";
import { InvalidDateTime } from "../../../common/errors";
import { getFormOrFormNotFound } from "../../database";
import { checkCanMarkAsCollected } from "../../permissions";
import { prisma } from "../../../generated/prisma-client";
import transitionForm from "../../workflow/transitionForm";
import { GraphQLContext } from "../../../types";

function validateArgs(args: MutationMarkAsCollectedArgs) {
  if (args.collectedInfo.quantity <= 0) {
    throw new UserInputError("La quantité saisie doit être supérieure à 0");
  }

  if (!isValidDatetime(args.collectedInfo.sentAt)) {
    throw new InvalidDateTime("sentAt");
  }
  return args;
}

const markAsCollectedResolver = async (
  parent: ResolversParentTypes["Mutation"],
  args: MutationMarkAsCollectedArgs,
  context: GraphQLContext
) => {
  const user = checkIsAuthenticated(context);

  const { id, collectedInfo } = validateArgs(args);

  const form = await getFormOrFormNotFound({ id });

  await checkCanMarkAsCollected(user, form);

  if (form.sentAt) {
    // BSD has already been sent, it must be a signature for frame 18

    // check security code is temp storer's
    await validateSecurityCode(
      form.recipientCompanySiret,
      collectedInfo.securityCode
    );

    const temporaryStorageDetail = await prisma
      .form({ id })
      .temporaryStorageDetail();

    const hasWasteDetailsOverride = !!temporaryStorageDetail.wasteDetailsQuantity;

    return transitionForm(
      form,
      { eventType: "MARK_SIGNED_BY_TRANSPORTER", eventParams: collectedInfo },
      context,
      infos => {
        const wasteDetails = {
          wasteDetailsPackagings: infos.packagings,
          wasteDetailsQuantity: infos.quantity,
          wasteDetailsOnuCode: infos.onuCode
        };

        return {
          ...(!hasWasteDetailsOverride && wasteDetails),

          temporaryStorageDetail: {
            update: {
              signedBy: infos.sentBy,
              signedAt: infos.sentAt,
              signedByTransporter: infos.signedByTransporter,
              ...(hasWasteDetailsOverride && wasteDetails)
            }
          }
        };
      }
    );
  }

  // check security code is producer's
  await validateSecurityCode(
    form.emitterCompanySiret,
    collectedInfo.securityCode
  );

  const transformEventToFormParams = infos => ({
    signedByTransporter: infos.signedByTransporter,
    sentAt: infos.sentAt,
    sentBy: infos.sentBy,
    wasteDetailsPackagings: infos.packagings,
    wasteDetailsQuantity: infos.quantity,
    wasteDetailsOnuCode: infos.onuCode,
    currentTransporterSiret: form.transporterCompanySiret
  });

  return transitionForm(
    form,
    { eventType: "MARK_SIGNED_BY_TRANSPORTER", eventParams: collectedInfo },
    context,
    transformEventToFormParams
  );
};

export default markAsCollectedResolver;
