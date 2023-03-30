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
import { sendMail } from "../../../mailer/mailing";
import { finalDestinationModified } from "../../../mailer/templates";
import { renderMail } from "../../../mailer/templates/renderers";
import { GraphQLContext } from "../../../types";
import { checkIsCompanyMember } from "../../../users/permissions";
import { expandBsdaFromDb } from "../../converter";
import { getBsdaHistory, getBsdaOrNotFound } from "../../database";
import { machine } from "../../machine";
import { getBsdaRepository } from "../../repository";
import { runInTransaction } from "../../../common/repository/helper";
import { validateBsda } from "../../validation";
import { getTransporterCompanyOrgId } from "../../../common/constants/companySearchHelpers";

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
  const {
    intermediaries,
    BsdaRevisionRequest,
    groupedIn,
    grouping,
    forwardedIn,
    forwarding,
    ...simpleBsda
  } = bsda;
  // Check that all necessary fields are filled
  await validateBsda(
    simpleBsda,
    { previousBsdas: [], intermediaries: [] },
    {
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
    }
  );

  const { value: newStatus } = machine.transition(bsda.status, {
    type: input.type,
    bsda: bsda
  });

  if (newStatus === bsda.status) {
    throw new InvalidSignatureError();
  }

  const signedBsda = await runInTransaction(async transaction => {
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

    return signedBsda;
  });

  sendAlertIfFollowingBsdaChangedPlannedDestination(signedBsda);

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
    getAuthorizedSiret: form => getTransporterCompanyOrgId(form)
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
    { orgId: signingCompanySiret }
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

async function sendAlertIfFollowingBsdaChangedPlannedDestination(bsda: Bsda) {
  // Alert can only be sent:
  // - if the bsda is either a reshipment or a grouping
  // - when the producer signs the bsda
  if (
    (bsda.type !== BsdaType.GATHERING && bsda.type !== BsdaType.RESHIPMENT) ||
    bsda.status !== BsdaStatus.SIGNED_BY_PRODUCER
  ) {
    return;
  }

  const previousBsdas = await getBsdaHistory(bsda);
  for (const previousBsda of previousBsdas) {
    if (
      previousBsda.destinationOperationNextDestinationCompanySiret &&
      previousBsda.destinationOperationNextDestinationCompanySiret !==
        bsda.destinationCompanySiret
    ) {
      const mail = renderMail(finalDestinationModified, {
        to: [
          {
            email: previousBsda.emitterCompanyMail,
            name: previousBsda.emitterCompanyName
          }
        ],
        variables: {
          id: previousBsda.id,
          emitter: {
            siret: bsda.emitterCompanySiret,
            name: bsda.emitterCompanyName
          },
          destination: {
            siret: bsda.destinationCompanySiret,
            name: bsda.destinationCompanyName
          },
          plannedDestination: {
            siret: previousBsda.destinationOperationNextDestinationCompanySiret,
            name: previousBsda.destinationOperationNextDestinationCompanyName
          }
        }
      });
      sendMail(mail);
    }
  }
}
