import { Bsvhu, BsvhuStatus } from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import { checkSecurityCode } from "../../../forms/permissions";
import {
  MutationSignBsvhuArgs,
  SignatureTypeInput
} from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { checkIsCompanyMember } from "../../../users/permissions";
import { expandVhuFormFromDb } from "../../converter";
import { getFormOrFormNotFound } from "../../database";
import { AlreadySignedError, InvalidSignatureError } from "../../errors";
import { machine } from "../../machine";
import { validateBsvhu } from "../../validation";
import { indexBsvhu } from "../../elastic";
type SignatureTypeInfos = {
  dbDateKey: keyof Bsvhu;
  dbAuthorKey: keyof Bsvhu;
  getAuthorizedSiret: (form: Bsvhu) => string;
};

export default async function sign(
  _,
  { id, input }: MutationSignBsvhuArgs,
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
  await validateBsvhu(prismaForm, {
    emissionSignature:
      prismaForm.emitterEmissionSignatureDate != null ||
      input.type === "EMISSION",
    transportSignature:
      prismaForm.transporterTransportSignatureDate != null ||
      input.type === "TRANSPORT",
    operationSignature:
      prismaForm.destinationOperationSignatureDate != null ||
      input.type === "OPERATION"
  });

  const { value: newStatus } = machine.transition(prismaForm.status, {
    type: input.type,
    bsvhu: prismaForm
  });

  if (newStatus === prismaForm.status) {
    throw new InvalidSignatureError();
  }

  const signedForm = await prisma.bsvhu.update({
    where: { id },
    data: {
      [signatureTypeInfos.dbAuthorKey]: input.author,
      [signatureTypeInfos.dbDateKey]: new Date(input.date),
      isDraft: false, // If it was one, signing always "un-drafts" it,
      status: newStatus as BsvhuStatus
    }
  });
  await indexBsvhu(signedForm, context);
  return expandVhuFormFromDb(signedForm);
}

const signatureTypeMapping: Record<SignatureTypeInput, SignatureTypeInfos> = {
  EMISSION: {
    dbDateKey: "emitterEmissionSignatureDate",
    dbAuthorKey: "emitterEmissionSignatureAuthor",
    getAuthorizedSiret: form => form.emitterCompanySiret
  },
  OPERATION: {
    dbDateKey: "destinationOperationSignatureDate",
    dbAuthorKey: "destinationOperationSignatureAuthor",
    getAuthorizedSiret: form => form.destinationCompanySiret
  },
  TRANSPORT: {
    dbDateKey: "transporterTransportSignatureDate",
    dbAuthorKey: "transporterTransportSignatureAuthor",
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
