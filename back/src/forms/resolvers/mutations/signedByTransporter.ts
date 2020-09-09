import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getFormOrFormNotFound } from "../../database";
import { UserInputError } from "apollo-server-express";
import { prisma } from "../../../generated/prisma-client";
import transitionForm from "../../workflow/transitionForm";
import {
  checkCanSignedByTransporter,
  checkSecurityCode
} from "../../permissions";
import { signingInfoSchema, wasteDetailsSchema } from "../../validation";

const signedByTransporterResolver: MutationResolvers["signedByTransporter"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  const { id, signingInfo } = args;

  const form = await getFormOrFormNotFound({ id });

  await checkCanSignedByTransporter(user, form);

  const {
    signedByProducer,
    signedByTransporter,
    securityCode,
    ...infos
  } = signingInfo;

  if (signedByTransporter === false) {
    throw new UserInputError(
      "Le transporteur doit signer pour valider l'enlèvement."
    );
  }

  if (signedByProducer === false) {
    throw new UserInputError(
      "Le producteur doit signer pour valider l'enlèvement."
    );
  }

  await signingInfoSchema.validate({
    sentAt: infos.sentAt,
    sentBy: infos.sentBy
  });

  const wasteDetails = infos => ({
    wasteDetailsPackagings: infos.packagings || form.wasteDetailsPackagings,
    wasteDetailsQuantity: infos.quantity || form.wasteDetailsQuantity,
    wasteDetailsOnuCode: infos.onuCode || form.wasteDetailsOnuCode
  });

  // check waste details override is valid
  await wasteDetailsSchema.validate({
    ...form,
    ...wasteDetails(infos)
  });

  if (form.sentAt) {
    // BSD has already been sent, it must be a signature for frame 18

    // check security code is temp storer's
    await checkSecurityCode(form.recipientCompanySiret, securityCode);

    const temporaryStorageDetail = await prisma
      .form({ id })
      .temporaryStorageDetail();

    const hasWasteDetailsOverride = !!temporaryStorageDetail.wasteDetailsQuantity;

    return transitionForm(
      form,
      { eventType: "MARK_SIGNED_BY_TRANSPORTER", eventParams: infos },
      context,
      infos => {
        return {
          ...(!hasWasteDetailsOverride && wasteDetails(infos)),
          temporaryStorageDetail: {
            update: {
              signedBy: infos.sentBy,
              signedAt: infos.sentAt,
              signedByTransporter: true,
              ...(hasWasteDetailsOverride && wasteDetails(infos))
            }
          }
        };
      }
    );
  }

  // check security code is producer's
  await checkSecurityCode(form.emitterCompanySiret, securityCode);

  return transitionForm(
    form,
    { eventType: "MARK_SIGNED_BY_TRANSPORTER", eventParams: infos },
    context,
    infos => ({
      signedByTransporter: true,
      sentAt: infos.sentAt,
      sentBy: infos.sentBy,
      ...wasteDetails(infos),
      currentTransporterSiret: form.transporterCompanySiret
    })
  );
};

export default signedByTransporterResolver;
