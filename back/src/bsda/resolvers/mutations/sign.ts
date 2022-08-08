import { Bsda, BsdaStatus, BsdaType } from "@prisma/client";
import { UserInputError } from "apollo-server-express";
import {
  AlreadySignedError,
  InvalidSignatureError
} from "../../../bsvhu/errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import { checkSecurityCode } from "../../../forms/permissions";
import {
  BsdaSignatureInput,
  BsdaSignatureType,
  MutationSignBsdaArgs
} from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { checkIsCompanyMember } from "../../../users/permissions";
import { expandBsdaFromDb } from "../../converter";
import { getBsdaHistory, getBsdaOrNotFound } from "../../database";
import { machine } from "../../machine";
import { getBsdaRepository, runInTransaction } from "../../repository";
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
  const bsda = await getBsdaOrNotFound(id);

  // To sign a form for a company, you must either:
  // - be part of that company
  // - provide the company security code
  await checkAuthorization(
    { currentUserId: user.id, securityCode: input.securityCode },
    signatureTypeInfos.getAuthorizedSiret(bsda)
  );

  // Cannot re-sign a form
  if (bsda[signatureTypeInfos.dbDateKey] != null) {
    throw new AlreadySignedError();
  }

  checkBsdaTypeSpecificRules(bsda, input);

  // Check that all necessary fields are filled
  await validateBsda(bsda, [], {
    skipPreviousBsdas: true,
    emissionSignature:
      bsda.emitterEmissionSignatureDate != null || input.type === "EMISSION",
    workSignature:
      bsda.workerWorkSignatureDate != null || input.type === "WORK",
    transportSignature:
      bsda.transporterTransportSignatureDate != null ||
      input.type === "TRANSPORT",
    operationSignature:
      bsda.destinationOperationSignatureDate != null ||
      input.type === "OPERATION"
  });

  const { value: newStatus } = machine.transition(bsda.status, {
    type: input.type,
    bsda: bsda
  });

  if (newStatus === bsda.status) {
    throw new InvalidSignatureError();
  }

  return runInTransaction(async transaction => {
    const bsdaRepository = getBsdaRepository(user, transaction);

    const signedBsda = await bsdaRepository.update(
      { id },
      {
        [signatureTypeInfos.dbAuthorKey]: input.author,
        [signatureTypeInfos.dbDateKey]: new Date(input.date ?? Date.now()),
        isDraft: false,
        status: newStatus as BsdaStatus,
        ...(newStatus === BsdaStatus.REFUSED && { forwardingId: null })
      }
    );

    if (newStatus === BsdaStatus.PROCESSED) {
      const previousBsdas = await getBsdaHistory(signedBsda);
      await bsdaRepository.updateMany(
        {
          id: { in: previousBsdas.map(bsff => bsff.id) }
        },
        {
          status: BsdaStatus.PROCESSED
        }
      );
    }

    if (newStatus === BsdaStatus.REFUSED) {
      await bsdaRepository.updateMany(
        {
          groupedInId: signedBsda.id
        },
        { groupedInId: null }
      );
    }

    return expandBsdaFromDb(signedBsda);
  });
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

function checkBsdaTypeSpecificRules(bsda: Bsda, input: BsdaSignatureInput) {
  if (bsda.type === BsdaType.COLLECTION_2710 && input.type !== "OPERATION") {
    throw new UserInputError(
      "Ce type de bordereau ne peut être signé qu'à la réception par la déchetterie."
    );
  }

  if (
    (bsda.type === BsdaType.RESHIPMENT || bsda.type === BsdaType.GATHERING) &&
    input.type === "WORK"
  ) {
    throw new UserInputError(
      "Ce type de bordereau ne peut pas être signé par une entreprise de travaux."
    );
  }
}
