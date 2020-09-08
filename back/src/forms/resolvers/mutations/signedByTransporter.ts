import {
  MutationResolvers,
  MutationSignedByTransporterArgs
} from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getFormOrFormNotFound } from "../../database";
import { UserInputError } from "apollo-server-express";
import { isValidDatetime, validateSecurityCode } from "../../validation";
import { prisma } from "../../../generated/prisma-client";
import transitionForm from "../../workflow/transitionForm";
import { checkCanSignedByTransporter } from "../../permissions";
import { InvalidDateTime } from "../../../common/errors";

function validateArgs(args: MutationSignedByTransporterArgs) {
  if (args.signingInfo.quantity <= 0) {
    throw new UserInputError("La quantité saisie doit être supérieure à 0");
  }

  if (args.signingInfo.signedByTransporter === false) {
    throw new UserInputError(
      "Le transporteur doit signer pour valider l'enlèvement."
    );
  }

  if (args.signingInfo.signedByProducer === false) {
    throw new UserInputError(
      "Le producteur doit signer pour valider l'enlèvement."
    );
  }
  if (!isValidDatetime(args.signingInfo.sentAt)) {
    throw new InvalidDateTime("sentAt");
  }
  return args;
}

const signedByTransporterResolver: MutationResolvers["signedByTransporter"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  const { id, signingInfo } = validateArgs(args);

  const form = await getFormOrFormNotFound({ id });

  await checkCanSignedByTransporter(user, form);

  const wasteDetails = {
    wasteDetailsPackagings: signingInfo.packagings,
    wasteDetailsQuantity: signingInfo.quantity,
    wasteDetailsOnuCode: signingInfo.onuCode || form.wasteDetailsOnuCode
  };

  if (form.sentAt) {
    // BSD has already been sent, it must be a signature for frame 18

    // check security code is temp storer's
    await validateSecurityCode(
      form.recipientCompanySiret,
      signingInfo.securityCode
    );

    const temporaryStorageDetail = await prisma
      .form({ id })
      .temporaryStorageDetail();

    const hasWasteDetailsOverride = !!temporaryStorageDetail.wasteDetailsQuantity;

    return transitionForm(
      form,
      { eventType: "MARK_SIGNED_BY_TRANSPORTER", eventParams: signingInfo },
      context,
      infos => {
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
    signingInfo.securityCode
  );

  const transformEventToFormParams = infos => ({
    ...wasteDetails,
    signedByTransporter: infos.signedByTransporter,
    sentAt: infos.sentAt,
    sentBy: infos.sentBy,
    currentTransporterSiret: form.transporterCompanySiret
  });

  return transitionForm(
    form,
    { eventType: "MARK_SIGNED_BY_TRANSPORTER", eventParams: signingInfo },
    context,
    transformEventToFormParams
  );
};

export default signedByTransporterResolver;
