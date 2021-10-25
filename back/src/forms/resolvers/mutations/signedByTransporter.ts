import { UserInputError } from "apollo-server-express";
import prisma from "../../../prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { getFormOrFormNotFound } from "../../database";
import {
  expandFormFromDb,
  flattenSignedByTransporterInput
} from "../../form-converter";
import {
  checkCanSignedByTransporter,
  checkSecurityCode
} from "../../permissions";
import {
  beforeSignedByTransporterSchema,
  signingInfoSchema,
  wasteDetailsSchema
} from "../../validation";
import transitionForm from "../../workflow/transitionForm";
import { EventType } from "../../workflow/types";

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
    signatureAuthor,
    ...infos
  } = flattenSignedByTransporterInput(signingInfo);

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

  const wasteDetails = {
    wasteDetailsPackagingInfos:
      infos.packagingInfos ?? form.wasteDetailsPackagingInfos,
    wasteDetailsQuantity: infos.quantity ?? form.wasteDetailsQuantity,
    wasteDetailsOnuCode: infos.onuCode ?? form.wasteDetailsOnuCode
  };

  const futureForm = {
    ...form,
    ...wasteDetails
  };

  // check waste details override is valid
  await wasteDetailsSchema.validate(futureForm);
  await beforeSignedByTransporterSchema.validate(futureForm);

  if (form.sentAt) {
    // BSD has already been sent, it must be a signature for frame 18

    // check security code is temp storer's
    await checkSecurityCode(form.recipientCompanySiret, securityCode);

    const temporaryStorageDetail = await prisma.form
      .findUnique({ where: { id } })
      .temporaryStorageDetail();

    const hasWasteDetailsOverride = !!temporaryStorageDetail.wasteDetailsQuantity;

    const formUpdateInput = {
      ...(!hasWasteDetailsOverride && wasteDetails),
      temporaryStorageDetail: {
        update: {
          signedBy: infos.sentBy,
          signedAt: infos.sentAt,
          signedByTransporter: true,
          ...(hasWasteDetailsOverride && wasteDetails)
        }
      }
    };
    const resentForm = await transitionForm(user, form, {
      type: EventType.SignedByTransporter,
      formUpdateInput
    });

    return expandFormFromDb(resentForm);
  }

  // check security code is producer's or eco-organisme's (if there's one)
  if (args.signingInfo.signatureAuthor === "ECO_ORGANISME") {
    if (form.ecoOrganismeSiret == null) {
      throw new UserInputError(
        "Impossible de signer au nom de l'éco-organisme : le BSD n'en mentionne aucun."
      );
    }
    await checkSecurityCode(form.ecoOrganismeSiret, signingInfo.securityCode);
  } else {
    await checkSecurityCode(form.emitterCompanySiret, signingInfo.securityCode);
  }

  const formUpdateInput = {
    signedByTransporter: true,
    sentAt: infos.sentAt,
    sentBy: infos.sentBy,
    ...wasteDetails,
    currentTransporterSiret: form.transporterCompanySiret
  };

  const sentForm = await transitionForm(user, form, {
    type: EventType.SignedByTransporter,
    formUpdateInput
  });

  return expandFormFromDb(sentForm);
};

export default signedByTransporterResolver;
