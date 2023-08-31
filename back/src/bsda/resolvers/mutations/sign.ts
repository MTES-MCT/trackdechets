import {
  Bsda,
  BsdaStatus,
  BsdaType,
  Prisma,
  WasteAcceptationStatus
} from "@prisma/client";
import {
  BsdTransporterReceiptPart,
  getTransporterReceipt
} from "../../../bsdasris/recipify";
import {
  AlreadySignedError,
  InvalidSignatureError
} from "../../../bsvhu/errors";
import { UserInputError } from "../../../common/errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import { runInTransaction } from "../../../common/repository/helper";
import { InvalidTransition } from "../../../forms/errors";
import {
  BsdaSignatureInput,
  BsdaSignatureType,
  MutationResolvers,
  MutationSignBsdaArgs
} from "../../../generated/graphql/types";
import { sendMail } from "../../../mailer/mailing";
import { finalDestinationModified } from "../../../mailer/templates";
import { renderMail } from "../../../mailer/templates/renderers";
import { checkCanSignFor } from "../../../permissions";
import { GraphQLContext } from "../../../types";
import { expandBsdaFromDb } from "../../converter";
import { getBsdaHistory, getBsdaOrNotFound } from "../../database";
import { machine } from "../../machine";
import { renderBsdaRefusedEmail } from "../../mails/refused";
import { BsdaRepository, getBsdaRepository } from "../../repository";
import { parseBsda } from "../../validation/validate";

const signBsda: MutationResolvers["signBsda"] = async (
  _,
  { id, input }: MutationSignBsdaArgs,
  context: GraphQLContext
) => {
  const user = checkIsAuthenticated(context);

  const bsda = await getBsdaOrNotFound(id);

  const authorizedOrgIds = getAuthorizedOrgIds(bsda, input.type);

  // To sign a form for a company, you must either:
  // - be part of that company
  // - provide the company security code
  await checkCanSignFor(user, input.type, authorizedOrgIds, input.securityCode);

  if (bsda.type === BsdaType.COLLECTION_2710 && input.type !== "OPERATION") {
    throw new UserInputError(
      "Ce type de bordereau ne peut être signé qu'à la réception par la déchetterie."
    );
  }

  checkBsdaTypeSpecificRules(bsda, input);

  let transporterReceipt = {};
  if (input.type === "TRANSPORT") {
    transporterReceipt = await getTransporterReceipt(bsda);
  }

  // Check that all necessary fields are filled
  await parseBsda(
    {
      ...bsda,
      grouping: bsda.grouping?.map(g => g.id),
      forwarding: bsda.forwarding?.id,
      ...transporterReceipt
    },
    {
      currentSignatureType: input.type
    }
  );

  const sign = signatures[input.type];
  const signedBsda = await sign(user, bsda, {
    ...input,
    ...transporterReceipt,
    date: new Date(input.date ?? Date.now())
  });

  return expandBsdaFromDb(signedBsda);
};

export default signBsda;

/**
 * Returns the different companies allowed to perform the signature
 * @param bsda the BSDA we wante to sign
 * @param signatureType the type of signature (ex: EMISSION, TRANSPORT, etc)
 * @returns a list of organisation identifiers
 */
export function getAuthorizedOrgIds(
  bsda: Bsda,
  signatureType: BsdaSignatureType
): string[] {
  const signatureTypeToFn: {
    [Key in BsdaSignatureType]: (bsda: Bsda) => (string | null)[];
  } = {
    EMISSION: (bsda: Bsda) => [bsda.emitterCompanySiret],
    WORK: (bsda: Bsda) => [bsda.workerCompanySiret],
    TRANSPORT: (bsda: Bsda) => [
      bsda.transporterCompanySiret,
      bsda.transporterCompanyVatNumber
    ],
    OPERATION: (bsda: Bsda) => [bsda.destinationCompanySiret]
  };

  const getAuthorizedSiretsFn = signatureTypeToFn[signatureType];

  return getAuthorizedSiretsFn(bsda).filter(Boolean);
}

// Defines different signature function based on signature type
const signatures: Record<
  BsdaSignatureType,
  (user: Express.User, bsda: Bsda, input: BsdaSignatureInput) => Promise<Bsda>
> = {
  EMISSION: signEmission,
  WORK: signWork,
  TRANSPORT: signTransport,
  OPERATION: signOperation
};

async function signEmission(
  user: Express.User,
  bsda: Bsda,
  input: BsdaSignatureInput
) {
  if (bsda.emitterEmissionSignatureDate !== null) {
    throw new AlreadySignedError();
  }

  const updateInput: Prisma.BsdaUpdateInput = {
    emitterEmissionSignatureAuthor: input.author,
    emitterEmissionSignatureDate: new Date(input.date ?? Date.now()),
    isDraft: false,
    status: await getNextStatus(bsda, input.type)
  };

  return updateBsda(user, bsda, updateInput);
}

async function signWork(
  user: Express.User,
  bsda: Bsda,
  input: BsdaSignatureInput
) {
  if (bsda.workerWorkSignatureDate !== null) {
    throw new AlreadySignedError();
  }

  if (bsda.type === BsdaType.RESHIPMENT || bsda.type === BsdaType.GATHERING) {
    throw new UserInputError(
      "Ce type de bordereau ne peut pas être signé par une entreprise de travaux."
    );
  }

  const nextStatus = await getNextStatus(bsda, input.type);

  const updateInput: Prisma.BsdaUpdateInput = {
    workerWorkSignatureAuthor: input.author,
    workerWorkSignatureDate: new Date(input.date ?? Date.now()),
    status: nextStatus
  };

  return updateBsda(user, bsda, updateInput);
}

async function signTransport(
  user: Express.User,
  bsda: Bsda,
  input: BsdaSignatureInput & BsdTransporterReceiptPart
) {
  if (bsda.transporterTransportSignatureDate !== null) {
    throw new AlreadySignedError();
  }

  const nextStatus = await getNextStatus(bsda, input.type);

  const updateInput: Prisma.BsdaUpdateInput = {
    transporterTransportSignatureAuthor: input.author,
    transporterTransportSignatureDate: new Date(input.date ?? Date.now()),
    status: nextStatus,
    // auto-complete transporter receipt
    transporterRecepisseDepartment: input.transporterRecepisseDepartment,
    transporterRecepisseNumber: input.transporterRecepisseNumber,
    transporterRecepisseValidityLimit: input.transporterRecepisseValidityLimit
  };

  return updateBsda(user, bsda, updateInput);
}

async function signOperation(
  user: Express.User,
  bsda: Bsda,
  input: BsdaSignatureInput
) {
  if (bsda.destinationOperationSignatureDate !== null) {
    throw new AlreadySignedError();
  }

  const nextStatus = await getNextStatus(bsda, input.type);

  const updateInput: Prisma.BsdaUpdateInput = {
    destinationOperationSignatureAuthor: input.author,
    destinationOperationSignatureDate: new Date(input.date ?? Date.now()),
    status: await getNextStatus(bsda, input.type),
    ...(nextStatus === BsdaStatus.REFUSED && { forwardingId: null })
  };

  if (
    bsda.destinationReceptionAcceptationStatus &&
    [
      WasteAcceptationStatus.REFUSED,
      WasteAcceptationStatus.PARTIALLY_REFUSED
    ].includes(bsda.destinationReceptionAcceptationStatus)
  ) {
    const refusedEmail = await renderBsdaRefusedEmail(bsda);
    if (refusedEmail) {
      sendMail(refusedEmail);
    }
  }

  return updateBsda(user, bsda, updateInput);
}

/**
 * Transition a BSDA from initial state (ex: SENT) to next state (ex: RECEIVED)
 * Allowed transitions are defined as a state machine using xstate
 */
export async function getNextStatus(
  bsda: Bsda,
  signatureType: BsdaSignatureType
) {
  if (bsda.isDraft) {
    throw new InvalidTransition();
  }
  const currentStatus = bsda.status;

  // Use state machine to calculate new status
  const nextState = machine.transition(currentStatus, {
    type: signatureType,
    bsda: bsda
  });

  // This transition is not possible
  if (!nextState.changed) {
    throw new InvalidSignatureError();
  }

  const nextStatus = nextState.value as BsdaStatus;

  return nextStatus;
}

/**
 * Perform the signature in DB and run the
 * post signature hook in transaction
 */
async function updateBsda(
  user: Express.User,
  bsda: Bsda,
  updateInput: Prisma.BsdaUpdateInput
) {
  return runInTransaction(async transaction => {
    const bsdaRepository = getBsdaRepository(user, transaction);
    const signBsda = await bsdaRepository.update({ id: bsda.id }, updateInput);
    await postSignatureHook(signBsda, bsdaRepository);
    return signBsda;
  });
}

/**
 * Custom signature hook used to update dependent objects
 * based on the new status of the signed BSDA
 */
async function postSignatureHook(bsda: Bsda, repository: BsdaRepository) {
  if (bsda.status === BsdaStatus.PROCESSED) {
    const previousBsdas = await getBsdaHistory(bsda);
    await repository.updateMany(
      {
        id: { in: previousBsdas.map(bsff => bsff.id) }
      },
      {
        status: BsdaStatus.PROCESSED
      }
    );
  }

  if (bsda.status === BsdaStatus.REFUSED) {
    await repository.updateMany(
      {
        groupedInId: bsda.id
      },
      { groupedInId: null }
    );
  }
  await sendAlertIfFollowingBsdaChangedPlannedDestination(bsda);
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
            email: previousBsda.emitterCompanyMail!,
            name: previousBsda.emitterCompanyName!
          }
        ],
        variables: {
          id: previousBsda.id,
          emitter: {
            siret: bsda.emitterCompanySiret!,
            name: bsda.emitterCompanyName!
          },
          destination: {
            siret: bsda.destinationCompanySiret!,
            name: bsda.destinationCompanyName!
          },
          plannedDestination: {
            siret: previousBsda.destinationOperationNextDestinationCompanySiret,
            name: previousBsda.destinationOperationNextDestinationCompanyName!
          }
        }
      });
      sendMail(mail);
    }
  }
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
