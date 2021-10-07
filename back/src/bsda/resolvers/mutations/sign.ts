import { Bsda, BsdaStatus } from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import { checkSecurityCode } from "../../../forms/permissions";
import {
  BsdaSignatureType,
  MutationSignBsdaArgs
} from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { checkIsCompanyMember } from "../../../users/permissions";
import {
  AlreadySignedError,
  InvalidSignatureError
} from "../../../bsvhu/errors";
import { expandBsdaFromDb } from "../../converter";
import { getBsdaHistory, getBsdaOrNotFound } from "../../database";
import { indexBsda } from "../../elastic";
import { machine } from "../../machine";
import { validateBsda } from "../../validation";

type SignatureTypeInfos = {
  dbDateKey: keyof Bsda;
  dbAuthorKey: keyof Bsda;
  getAuthorizedSiret: (form: Bsda) => string;
};

export default async function sign(
  _,
  { id, input }: MutationSignBsdaArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const signatureTypeInfos = signatureTypeMapping[input.type];
  const prismaForm = await getBsdaOrNotFound(id);

  // To sign a form for a company, you must either:
  // - be part of that company
  // - provide the company security code
  await checkAuthorization(
    { currentUserId: user.id, securityCode: input.securityCode },
    signatureTypeInfos.getAuthorizedSiret(prismaForm)
  );

  // Cannot re-sign a form
  if (prismaForm[signatureTypeInfos.dbDateKey] != null) {
    throw new AlreadySignedError();
  }

  // Check that all necessary fields are filled
  await validateBsda(prismaForm, [], {
    isPrivateIndividual: prismaForm.emitterIsPrivateIndividual,
    emissionSignature:
      prismaForm.emitterEmissionSignatureDate != null ||
      input.type === "EMISSION",
    workSignature:
      prismaForm.workerWorkSignatureDate != null || input.type === "WORK",
    transportSignature:
      prismaForm.transporterTransportSignatureDate != null ||
      input.type === "TRANSPORT",
    operationSignature:
      prismaForm.destinationOperationSignatureDate != null ||
      input.type === "OPERATION"
  });

  const { value: newStatus } = machine.transition(prismaForm.status, {
    type: input.type,
    bsda: prismaForm
  });

  if (newStatus === prismaForm.status) {
    throw new InvalidSignatureError();
  }

  const signedBsda = await prisma.bsda.update({
    where: { id },
    data: {
      [signatureTypeInfos.dbAuthorKey]: input.author,
      [signatureTypeInfos.dbDateKey]: new Date(input.date),
      isDraft: false,
      status: newStatus as BsdaStatus
    }
  });

  if (newStatus === BsdaStatus.PROCESSED) {
    const previousBsdas = await getBsdaHistory(signedBsda);
    await prisma.bsda.updateMany({
      data: {
        status: BsdaStatus.PROCESSED
      },
      where: {
        id: { in: previousBsdas.map(bsff => bsff.id) }
      }
    });
    const updatedBsdas = await prisma.bsda.findMany({
      where: { id: { in: previousBsdas.map(bsff => bsff.id) } }
    });
    await Promise.all(updatedBsdas.map(bsda => indexBsda(bsda)));
  }

  await indexBsda(signedBsda, context);

  return expandBsdaFromDb(signedBsda);
}

const signatureTypeMapping: Record<BsdaSignatureType, SignatureTypeInfos> = {
  EMISSION: {
    dbDateKey: "emitterEmissionSignatureDate",
    dbAuthorKey: "emitterEmissionSignatureAuthor",
    getAuthorizedSiret: form => form.emitterCompanySiret
  },
  WORK: {
    dbDateKey: "workerWorkSignatureDate",
    dbAuthorKey: "workerWorkSignatureAuthor",
    getAuthorizedSiret: form => form.workerCompanySiret
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
  requestInfo: { currentUserId: string; securityCode?: number },
  signingCompanySiret: string
) {
  // If there is a security code provided, it must be authorized
  if (requestInfo.securityCode) {
    return checkSecurityCode(signingCompanySiret, requestInfo.securityCode);
  }

  return checkIsCompanyMember(
    { id: requestInfo.currentUserId },
    { siret: signingCompanySiret }
  );
}
