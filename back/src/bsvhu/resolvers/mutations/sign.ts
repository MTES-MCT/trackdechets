import { Bsvhu, BsvhuStatus } from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import { checkSecurityCode } from "../../../forms/permissions";
import {
  MutationSignBsvhuArgs,
  SignatureTypeInput
} from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { checkIsCompanyMember } from "../../../users/permissions";
import { expandVhuFormFromDb } from "../../converter";
import { getBsvhuOrNotFound } from "../../database";
import { AlreadySignedError, InvalidSignatureError } from "../../errors";
import { machine } from "../../machine";
import { validateBsvhu } from "../../validation";
import { getBsvhuRepository } from "../../repository";
import { getTransporterCompanyOrgId } from "../../../common/constants/companySearchHelpers";
import { UserInputError } from "apollo-server-core";

type SignatureTypeInfos = {
  dbDateKey: keyof Bsvhu;
  dbAuthorKey: keyof Bsvhu;
  getAuthorizedSiret: (form: Bsvhu) => string | null;
};

export default async function sign(
  _,
  { id, input }: MutationSignBsvhuArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const signatureTypeInfos = signatureTypeMapping[input.type];
  const prismaForm = await getBsvhuOrNotFound(id);

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
  const bsvhuRepository = getBsvhuRepository(user);
  const signedBsvhu = await bsvhuRepository.update(
    { id },
    {
      [signatureTypeInfos.dbAuthorKey]: input.author,
      [signatureTypeInfos.dbDateKey]: new Date(input.date ?? Date.now()),
      isDraft: false, // If it was one, signing always "un-drafts" it,
      status: newStatus as BsvhuStatus
    }
  );

  return expandVhuFormFromDb(signedBsvhu);
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
    getAuthorizedSiret: form => getTransporterCompanyOrgId(form)
  }
};

function checkAuthorization(
  requestInfo: { curretUserId: string; securityCode?: number | null },
  signingCompanySiret: string | null
) {
  if (!signingCompanySiret) {
    throw new UserInputError(
      "SIRET manquant pour pouvoir apposer cette signature."
    );
  }

  // If there is a security code provided, it must be authorized
  if (requestInfo.securityCode) {
    return checkSecurityCode(signingCompanySiret, requestInfo.securityCode);
  }

  return checkIsCompanyMember(
    { id: requestInfo.curretUserId },
    { orgId: signingCompanySiret }
  );
}
