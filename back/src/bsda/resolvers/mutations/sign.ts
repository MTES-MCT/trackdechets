import {
  Bsda,
  BsdaStatus,
  BsdaType,
  Prisma,
  UserNotification,
  WasteAcceptationStatus
} from "@prisma/client";

import {
  BsdTransporterReceiptPart,
  getTransporterReceipt
} from "../../../companies/recipify";

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
import { Mail, finalDestinationModified, renderMail } from "@td/mail";
import { checkCanSignFor } from "../../../permissions";
import { GraphQLContext } from "../../../types";
import { expandBsdaFromDb } from "../../converter";
import {
  getBsdaHistory,
  getBsdaOrNotFound,
  getNextTransporterSync,
  getNthTransporterSync,
  getTransportersSync
} from "../../database";
import { machine } from "../../machine";
import { renderBsdaRefusedEmail } from "../../mails/refused";
import { BsdaRepository, getBsdaRepository } from "../../repository";
import { AllBsdaSignatureType, BsdaWithTransporters } from "../../types";
import { parseBsdaAsync } from "../../validation";
import { prismaToZodBsda } from "../../validation/helpers";
import { AlreadySignedError } from "../../../bsvhu/errors";
import { operationHook } from "../../operationHook";
import { getNotificationSubscribers } from "../../../users/notifications";

const signBsda: MutationResolvers["signBsda"] = async (
  _,
  { id, input }: MutationSignBsdaArgs,
  context: GraphQLContext
) => {
  const user = checkIsAuthenticated(context);

  const bsda = await getBsdaOrNotFound(id, {
    include: {
      intermediaries: true,
      grouping: true,
      transporters: true
    }
  });

  const signatureType = getBsdaSignatureType(input.type, bsda);

  const authorizedOrgIds = getAuthorizedOrgIds(bsda, signatureType);

  // To sign a form for a company, you must either:
  // - be part of that company
  // - provide the company security code
  await checkCanSignFor(
    user,
    signatureType,
    authorizedOrgIds,
    input.securityCode
  );

  checkSignatureTypeSpecificRules(bsda, input);

  // TODO: should be replaced by code that get triggers when the
  // transporter receipt is set on the profile
  let transporterReceipt = {};
  if (input.type === "TRANSPORT") {
    transporterReceipt = await getTransporterReceipt(bsda.transporters[0]);
  }

  const zodBsda = prismaToZodBsda(bsda);

  // Check that all necessary fields are filled
  await parseBsdaAsync(
    { ...zodBsda, ...transporterReceipt },
    {
      user,
      currentSignatureType: signatureType
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
  bsda: BsdaForSignature,
  signatureType: AllBsdaSignatureType
): string[] {
  const transportNthAuthorizedOrgIds = (bsda: BsdaForSignature, n: number) => {
    const transporterN = getNthTransporterSync(bsda, n);
    return [
      transporterN?.transporterCompanySiret,
      transporterN?.transporterCompanyVatNumber
    ].filter(Boolean);
  };

  const signatureTypeToFn: {
    [Key in AllBsdaSignatureType]: (bsda: Bsda) => (string | null)[];
  } = {
    EMISSION: (bsda: Bsda) => [bsda.emitterCompanySiret],
    WORK: (bsda: Bsda) => [bsda.workerCompanySiret],
    TRANSPORT: (bsda: BsdaForSignature) =>
      transportNthAuthorizedOrgIds(bsda, 1),
    TRANSPORT_2: (bsda: BsdaForSignature) =>
      transportNthAuthorizedOrgIds(bsda, 2),
    TRANSPORT_3: (bsda: BsdaForSignature) =>
      transportNthAuthorizedOrgIds(bsda, 3),
    TRANSPORT_4: (bsda: BsdaForSignature) =>
      transportNthAuthorizedOrgIds(bsda, 4),
    TRANSPORT_5: (bsda: BsdaForSignature) =>
      transportNthAuthorizedOrgIds(bsda, 5),
    OPERATION: (bsda: Bsda) => [bsda.destinationCompanySiret]
  };

  const getAuthorizedSiretsFn = signatureTypeToFn[signatureType];

  return getAuthorizedSiretsFn(bsda).filter(Boolean);
}

type BsdaForSignature = Bsda & BsdaWithTransporters;

// Defines different signature function based on signature type
const signatures: Record<
  BsdaSignatureType,
  (
    user: Express.User,
    bsda: BsdaForSignature,
    input: BsdaSignatureInput
  ) => Promise<BsdaWithTransporters>
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
  bsda: BsdaForSignature,
  input: BsdaSignatureInput & BsdTransporterReceiptPart
) {
  if (bsda.transporters.length === 0) {
    throw new UserInputError("Aucun transporteur n'est renseigné sur ce BSDA.");
  }

  const transporter = getNextTransporterSync(bsda);

  if (!transporter) {
    throw new AlreadySignedError();
  }

  const nextStatus = await getNextStatus(bsda, input.type);

  const signatureDate = new Date(input.date ?? Date.now());

  const updateInput: Prisma.BsdaUpdateInput = {
    status: nextStatus,
    transporters: {
      update: {
        where: { id: transporter.id },
        data: {
          transporterTransportSignatureAuthor: input.author,
          transporterTransportSignatureDate: signatureDate,
          // auto-complete transporter receipt
          transporterRecepisseDepartment: input.transporterRecepisseDepartment,
          transporterRecepisseNumber: input.transporterRecepisseNumber,
          transporterRecepisseValidityLimit:
            input.transporterRecepisseValidityLimit
        }
      }
    }
  };

  if (transporter.number === 1) {
    // champ dénormalisé permettant de stocker la date de la première signature
    // transporteur sur le BSDA
    updateInput.transporterTransportSignatureDate = signatureDate;
  }

  return updateBsda(user, bsda, updateInput);
}

async function signOperation(
  user: Express.User,
  bsda: BsdaForSignature,
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
    ...(nextStatus === BsdaStatus.REFUSED && { forwardingId: null }),
    // on autorise l'installation de destination à signer même si le ou les
    // derniers transporteurs multi-modaux n'ont pas signé dans le cas où le
    // premier transporteur ait finalement décidé d'aller directement à destination.
    // Dans ce cas on supprime les transporteurs multi-modaux qui n'ont pas signé.
    transporters: { deleteMany: { transporterTransportSignatureDate: null } }
  };

  let refusedEmail: Mail | undefined = undefined;

  if (
    bsda.destinationReceptionAcceptationStatus &&
    [
      WasteAcceptationStatus.REFUSED,
      WasteAcceptationStatus.PARTIALLY_REFUSED
    ].includes(bsda.destinationReceptionAcceptationStatus) &&
    (!bsda.emitterIsPrivateIndividual ||
      // N'envoie rien si on ne connait pas l'adresse e-mail de l'émetteur particulier
      // FIXME il serait bien de quand même pouvoir envoyer l'email à la DREAL
      // mais ça demande un refacto de renderBsdaRefusedEmail
      (bsda.emitterIsPrivateIndividual && bsda.emitterCompanyMail))
  ) {
    refusedEmail = await renderBsdaRefusedEmail(bsda);
  }

  const updated = await updateBsda(user, bsda, updateInput);
  await operationHook(updated, { runSync: false });

  if (refusedEmail) {
    sendMail(refusedEmail);
  }

  return updated;
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
  if (nextState.transitions.length === 0) {
    // This transition is not possible
    throw new InvalidTransition();
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
    const signBsda = await bsdaRepository.update(
      { id: bsda.id, status: bsda.status },
      updateInput
    );
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
      const subscribers = await getNotificationSubscribers(
        UserNotification.BSDA_FINAL_DESTINATION_UPDATE,
        [previousBsda.emitterCompanySiret].filter(Boolean)
      );

      if (subscribers.length) {
        const mail = renderMail(finalDestinationModified, {
          to: subscribers,
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
              siret:
                previousBsda.destinationOperationNextDestinationCompanySiret,
              name: previousBsda.destinationOperationNextDestinationCompanyName!
            }
          }
        });
        sendMail(mail);
      }
    }
  }
}

function checkSignatureTypeSpecificRules(
  bsda: Bsda,
  input: BsdaSignatureInput
) {
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

  if (bsda.type === BsdaType.COLLECTION_2710 && input.type !== "OPERATION") {
    throw new UserInputError(
      "Ce type de bordereau ne peut être signé qu'à la réception par la déchetterie."
    );
  }
}

/**
 * Renvoie le numéro de la signature de transport en cas de signature d'un transporteur
 * mulit-modal. Renvoie la signature GraphQL dans les autres cas
 * @param signatureType
 * @param bsda
 * @returns
 */
function getBsdaSignatureType(
  signatureType: BsdaSignatureType,
  bsda: BsdaWithTransporters
): AllBsdaSignatureType {
  if (signatureType === "TRANSPORT") {
    if (bsda.transporters && bsda.transporters.length > 1) {
      const transporters = getTransportersSync(bsda);
      const nextTransporter = transporters.find(
        t => !t.transporterTransportSignatureDate
      );
      if (!nextTransporter) {
        throw new UserInputError(
          "Impossible d'appliquer une signature TRANSPORT. Tous les transporteurs ont déjà signé"
        );
      }
      const number = nextTransporter.number;
      if (!number || number === 1) {
        return "TRANSPORT";
      }
      return `TRANSPORT_${number}` as AllBsdaSignatureType;
    }
    return "TRANSPORT";
  }

  return signatureType;
}
