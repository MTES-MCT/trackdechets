import {
  Bspaoh,
  BspaohStatus,
  Prisma,
  WasteAcceptationStatus
} from "@prisma/client";
import { BspaohForParsing, PrismaBspaohWithTransporters } from "../../types";

import {
  BsdTransporterReceiptPart,
  getTransporterReceipt
} from "../../../companies/recipify";
import { getBspaohRepository } from "../../repository";
import {
  AlreadySignedError,
  InvalidSignatureError
} from "../../../bsvhu/errors";

import { checkIsAuthenticated } from "../../../common/permissions";

import { InvalidTransition } from "../../../forms/errors";
import {
  BspaohSignatureInput,
  BspaohSignatureType,
  MutationResolvers,
  MutationSignBspaohArgs
} from "../../../generated/graphql/types";

import { getFirstTransporterSync, expandBspaohFromDb } from "../../converter";
import { sendMail } from "../../../mailer/mailing";
import { Mail } from "@td/mail";
import { checkCanSignFor } from "../../../permissions";
import { GraphQLContext } from "../../../types";
import { getBspaohOrNotFound } from "../../database";
import { machine } from "../../machine";
import { renderBspaohRefusedEmail } from "../../mails/refused";
import { parseBspaohInContext } from "../../validation";
import { prepareBspaohForParsing } from "./utils";

const signBspaoh: MutationResolvers["signBspaoh"] = async (
  _,
  { id, input }: MutationSignBspaohArgs,
  context: GraphQLContext
) => {
  const user = checkIsAuthenticated(context);

  const bspaoh = await getBspaohOrNotFound({ id });
  const { preparedExistingBspaoh, existingFirstTransporter } =
    prepareBspaohForParsing(bspaoh);

  const authorizedOrgIds = getAuthorizedOrgIds(
    preparedExistingBspaoh,
    input.type
  );

  await checkCanSignFor(user, input.type, authorizedOrgIds);

  let transporterReceipt = {};
  if (input.type === "TRANSPORT" && existingFirstTransporter) {
    transporterReceipt = await getTransporterReceipt(existingFirstTransporter);
  }

  // Check that all necessary fields are filled
  await parseBspaohInContext(
    { persisted: { ...preparedExistingBspaoh, ...transporterReceipt } },
    {
      currentSignatureType: input.type
    }
  );

  const sign = signatures[input.type];
  const signedBspaoh = await sign(user, bspaoh, {
    ...input,
    ...transporterReceipt,

    date: new Date(input.date ?? Date.now())
  });

  return expandBspaohFromDb(signedBspaoh);
};

export default signBspaoh;

/**
 * Returns the different companies allowed to perform the signature
 * @param bspaoh the BSPAOH we want to sign
 * @param signatureType the type of signature (ex: EMISSION, TRANSPORT, etc)
 * @returns a list of organisation identifiers
 */
export function getAuthorizedOrgIds(
  bspaoh: BspaohForParsing,

  signatureType: BspaohSignatureType
): string[] {
  const signatureTypeToFn: {
    [Key in BspaohSignatureType]: (
      bspaoh: BspaohForParsing
    ) => (string | null)[];
  } = {
    EMISSION: (bspaoh: BspaohForParsing) => [bspaoh.emitterCompanySiret],

    TRANSPORT: (bspaoh: BspaohForParsing) => [
      bspaoh?.transporterCompanySiret,
      bspaoh?.transporterCompanyVatNumber
    ],
    DELIVERY: (bspaoh: BspaohForParsing) => [
      bspaoh?.transporterCompanySiret,
      bspaoh?.transporterCompanyVatNumber
    ],
    RECEPTION: (bspaoh: BspaohForParsing) => [bspaoh.destinationCompanySiret],
    OPERATION: (bspaoh: BspaohForParsing) => [bspaoh.destinationCompanySiret]
  };

  const getAuthorizedSiretsFn = signatureTypeToFn[signatureType];

  return getAuthorizedSiretsFn(bspaoh).filter(Boolean);
}

// Defines different signature function based on signature type
const signatures: Record<
  BspaohSignatureType,
  (
    user: Express.User,
    bspaoh: Bspaoh,

    input: BspaohSignatureInput
  ) => Promise<PrismaBspaohWithTransporters>
> = {
  EMISSION: signEmission,
  TRANSPORT: signTransport,
  DELIVERY: signDelivery,
  RECEPTION: signReception,
  OPERATION: signOperation
};

async function signEmission(
  user: Express.User,
  bspaoh: Bspaoh,
  input: BspaohSignatureInput
) {
  if (bspaoh.emitterEmissionSignatureDate !== null) {
    throw new AlreadySignedError();
  }

  const updateInput: Prisma.BspaohUpdateInput = {
    emitterEmissionSignatureAuthor: input.author,
    emitterEmissionSignatureDate: new Date(input.date ?? Date.now()),

    status: await getNextStatus(bspaoh, input.type)
  };

  return updateBspaoh(user, bspaoh, updateInput);
}

async function signTransport(
  user: Express.User,
  bspaoh: PrismaBspaohWithTransporters,

  input: BspaohSignatureInput & BsdTransporterReceiptPart
) {
  const existingFirstTransporter = getFirstTransporterSync(bspaoh);

  if (!existingFirstTransporter) {
    throw new InvalidSignatureError();
  }

  if (existingFirstTransporter.transporterTransportSignatureDate !== null) {
    throw new AlreadySignedError();
  }
  const nextStatus = await getNextStatus(bspaoh, input.type);

  const updateInput: Prisma.BspaohUpdateInput = {
    status: nextStatus,
    transporters: {
      update: {
        where: { id: existingFirstTransporter.id },
        data: {
          transporterTransportSignatureAuthor: input.author,
          transporterTransportSignatureDate: new Date(input.date ?? Date.now()),

          // auto-complete transporter receipt
          transporterRecepisseDepartment: input.transporterRecepisseDepartment,
          transporterRecepisseNumber: input.transporterRecepisseNumber,
          transporterRecepisseValidityLimit:
            input.transporterRecepisseValidityLimit
        }
      }
    }
  };

  return updateBspaoh(user, bspaoh, updateInput);
}

async function signDelivery(
  user: Express.User,
  bspaoh: PrismaBspaohWithTransporters,

  input: BspaohSignatureInput & BsdTransporterReceiptPart
) {
  if (bspaoh.handedOverToDestinationSignatureDate !== null) {
    throw new AlreadySignedError();
  }
  const nextStatus = await getNextStatus(bspaoh, input.type);
  const timestamp = new Date(input.date ?? Date.now());
  const updateInput: Prisma.BspaohUpdateInput = {
    status: nextStatus,
    handedOverToDestinationSignatureDate: timestamp,

    handedOverToDestinationSignatureAuthor: input.author
  };

  return updateBspaoh(user, bspaoh, updateInput);
}

async function signReception(
  user: Express.User,
  bspaoh: PrismaBspaohWithTransporters,

  input: BspaohSignatureInput
) {
  if (bspaoh.destinationReceptionSignatureDate !== null) {
    throw new AlreadySignedError();
  }

  const updateInput: Prisma.BspaohUpdateInput = {
    destinationReceptionSignatureAuthor: input.author,
    destinationReceptionSignatureDate: new Date(input.date ?? Date.now()),
    status: await getNextStatus(bspaoh, input.type)
  };

  let refusedEmail: Mail | undefined = undefined;

  if (
    bspaoh.destinationReceptionAcceptationStatus &&
    [
      WasteAcceptationStatus.REFUSED,
      WasteAcceptationStatus.PARTIALLY_REFUSED
    ].includes(bspaoh.destinationReceptionAcceptationStatus) &&
    bspaoh.emitterCompanyMail
  ) {
    refusedEmail = await renderBspaohRefusedEmail(bspaoh);
  }

  const updated = await updateBspaoh(user, bspaoh, updateInput);

  if (refusedEmail) {
    sendMail(refusedEmail);
  }

  return updated;
}

async function signOperation(
  user: Express.User,
  bspaoh: Bspaoh,
  input: BspaohSignatureInput
) {
  if (bspaoh.destinationOperationSignatureDate !== null) {
    throw new AlreadySignedError();
  }

  const nextStatus = await getNextStatus(bspaoh, input.type);

  const updateInput: Prisma.BspaohUpdateInput = {
    destinationOperationSignatureAuthor: input.author,
    destinationOperationSignatureDate: new Date(input.date ?? Date.now()),
    status: nextStatus
  };

  const updated = await updateBspaoh(user, bspaoh, updateInput);

  return updated;
}

/**
 * Transition a BSPAOH from initial state (ex: SENT) to next state (ex: ACCEPTED)
 * Allowed transitions are defined as a state machine using xstate
 */
export async function getNextStatus(
  bspaoh: Bspaoh,
  signatureType: BspaohSignatureType
) {
  if (bspaoh.status === BspaohStatus.DRAFT) {
    throw new InvalidTransition();
  }
  const currentStatus = bspaoh.status;

  // Use state machine to calculate new status
  const nextState = machine.transition(currentStatus, {
    type: signatureType,
    bspaoh: bspaoh
  });

  // DELIVERY signature does not mutate state, we have to handle this subtlety
  const isDelivery =
    currentStatus == BspaohStatus.SENT && signatureType == "DELIVERY";

  // This transition is not possible
  if (!nextState.changed && !isDelivery) {
    throw new InvalidSignatureError();
  }

  const nextStatus = nextState.value as BspaohStatus;

  return nextStatus;
}

/**
 * Perform the signature in DB and run the
 * post signature hook in transaction
 */
async function updateBspaoh(
  user: Express.User,
  bspaoh: Bspaoh,
  updateInput: Prisma.BspaohUpdateInput
) {
  const bspaohRepository = getBspaohRepository(user);
  return bspaohRepository.update(
    { id: bspaoh.id, status: bspaoh.status },
    { ...updateInput }
  );
}
