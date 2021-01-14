import { VhuForm } from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import { checkSecurityCode } from "../../../forms/permissions";
import {
  BordereauVhuMutationSignArgs,
  SignatureTypeInput
} from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { checkIsCompanyMember } from "../../../users/permissions";
import { expandVhuFormFromDb } from "../../converter";
import { getFormOrFormNotFound } from "../../database";
import { AlreadySignedError } from "../../errors";
import { validateVhuForm } from "../../validation";

type SignatureTypeInfos = {
  dbDateKey: keyof VhuForm;
  dbAuthorKey: keyof VhuForm;
  getAuthorizedSiret: (form: VhuForm) => string;
};

export default async function sign(
  _,
  { id, input }: BordereauVhuMutationSignArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const signatureTypeInfos = signatureTypeMapping[input.type];
  const prismaForm = await getFormOrFormNotFound(id);

  // To sign a form for a company, you must either:
  // - be part of that company
  // - provide the company security code
  await checkAuthorization(
    { curretUserId: user.id, securityCode: input.securityCode },
    signatureTypeInfos.getAuthorizedSiret(prismaForm)
  );

  // Cannot re-sign a form
  if (prismaForm[signatureTypeInfos.dbDateKey] != null) {
    throw new AlreadySignedError();
  }

  // Check that all necessary fields are filled
  await validateVhuForm(prismaForm, {
    emitterSignature:
      prismaForm.emitterSignatureDate != null || input.type === "EMITTER",
    transporterSignature:
      prismaForm.transporterSignatureDate != null ||
      input.type === "TRANSPORTER",
    recipientSignature:
      prismaForm.recipientSignatureDate != null || input.type === "RECIPIENT"
  });

  const signedForm = await prisma.vhuForm.update({
    where: { id },
    data: {
      [signatureTypeInfos.dbAuthorKey]: input.author,
      [signatureTypeInfos.dbDateKey]: new Date(input.date),
      isDraft: false, // If it was one, signing always "un-drafts" it
      ...(input.type === "RECIPIENT" && { status: "DONE" }) // Last signature means the form is done
    }
  });

  return expandVhuFormFromDb(signedForm);
}

const signatureTypeMapping: Record<SignatureTypeInput, SignatureTypeInfos> = {
  EMITTER: {
    dbDateKey: "emitterSignatureDate",
    dbAuthorKey: "emitterSignatureAuthor",
    getAuthorizedSiret: form => form.emitterCompanySiret
  },
  RECIPIENT: {
    dbDateKey: "recipientSignatureDate",
    dbAuthorKey: "recipientSignatureAuthor",
    getAuthorizedSiret: form => form.recipientCompanySiret
  },
  TRANSPORTER: {
    dbDateKey: "transporterSignatureDate",
    dbAuthorKey: "transporterSignatureAuthor",
    getAuthorizedSiret: form => form.transporterCompanySiret
  }
};

function checkAuthorization(
  requestInfo: { curretUserId: string; securityCode?: number },
  signingCompanySiret: string
) {
  // If there is a security code provided, it must be authorized
  if (requestInfo.securityCode) {
    return checkSecurityCode(signingCompanySiret, requestInfo.securityCode);
  }

  return checkIsCompanyMember(
    { id: requestInfo.curretUserId },
    { siret: signingCompanySiret }
  );
}
