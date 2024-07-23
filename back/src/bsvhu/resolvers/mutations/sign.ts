import { Bsvhu, BsvhuStatus, Prisma } from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  BsvhuSignatureInput,
  MutationSignBsvhuArgs,
  SignatureTypeInput
} from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { expandVhuFormFromDb } from "../../converter";
import { getBsvhuOrNotFound } from "../../database";
import { AlreadySignedError, InvalidSignatureError } from "../../errors";
import { machine } from "../../machine";
import { validateBsvhu } from "../../validation";
import { getBsvhuRepository } from "../../repository";
import { checkCanSignFor } from "../../../permissions";
import { runInTransaction } from "../../../common/repository/helper";
import { InvalidTransition } from "../../../forms/errors";
import {
  BsdTransporterReceiptPart,
  getTransporterReceipt
} from "../../../companies/recipify";

export default async function sign(
  _,
  { id, input }: MutationSignBsvhuArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const bsvhu = await getBsvhuOrNotFound(id);
  const authorizedOrgIds = getAuthorizedOrgIds(bsvhu, input.type);

  // To sign a form for a company, you must either:
  // - be part of that company
  // - provide the company security code
  await checkCanSignFor(user, input.type, authorizedOrgIds, input.securityCode);

  let transporterReceipt = {};
  if (input.type === "TRANSPORT") {
    transporterReceipt = await getTransporterReceipt(bsvhu);
  }

  // Check that all necessary fields are filled
  await validateBsvhu(
    {
      ...bsvhu,
      ...transporterReceipt
    },
    {
      emissionSignature:
        bsvhu.emitterEmissionSignatureDate != null || input.type === "EMISSION",
      transportSignature:
        bsvhu.transporterTransportSignatureDate != null ||
        input.type === "TRANSPORT",
      operationSignature:
        bsvhu.destinationOperationSignatureDate != null ||
        input.type === "OPERATION"
    }
  );

  const sign = signatures[input.type];
  const signedBsvhu = await sign(user, bsvhu, {
    ...input,
    ...transporterReceipt,
    date: new Date(input.date ?? Date.now())
  });

  return expandVhuFormFromDb(signedBsvhu);
}

/**
 * Returns the different companies allowed to perform the signature
 * @param bsvhu the BSVHU we wante to sign
 * @param signatureType the type of signature (ex: EMISSION, TRANSPORT, etc)
 * @returns a list of organisation identifiers
 */
export function getAuthorizedOrgIds(
  bsvhu: Bsvhu,
  signatureType: SignatureTypeInput
): string[] {
  const signatureTypeToFn: {
    [Key in SignatureTypeInput]: (bsda: Bsvhu) => (string | null)[];
  } = {
    EMISSION: (bsda: Bsvhu) => [bsda.emitterCompanySiret],
    TRANSPORT: (bsda: Bsvhu) => [
      bsda.transporterCompanySiret,
      bsda.transporterCompanyVatNumber
    ],
    OPERATION: (bsda: Bsvhu) => [bsda.destinationCompanySiret]
  };

  const getAuthorizedSiretsFn = signatureTypeToFn[signatureType];

  return getAuthorizedSiretsFn(bsvhu).filter(Boolean);
}

// Defines different signature function based on signature type
const signatures: Record<
  SignatureTypeInput,
  (
    user: Express.User,
    bsda: Bsvhu,
    input: BsvhuSignatureInput
  ) => Promise<Bsvhu>
> = {
  EMISSION: signEmission,
  TRANSPORT: signTransport,
  OPERATION: signOperation
};

async function signEmission(
  user: Express.User,
  bsda: Bsvhu,
  input: BsvhuSignatureInput
) {
  if (bsda.emitterEmissionSignatureDate !== null) {
    throw new AlreadySignedError();
  }

  const updateInput: Prisma.BsvhuUpdateInput = {
    emitterEmissionSignatureAuthor: input.author,
    emitterEmissionSignatureDate: new Date(input.date ?? Date.now()),
    isDraft: false,
    status: await getNextStatus(bsda, input.type)
  };

  return updateBsvhu(user, bsda, updateInput);
}

async function signTransport(
  user: Express.User,
  bsvhu: Bsvhu,
  input: BsvhuSignatureInput & BsdTransporterReceiptPart
) {
  if (bsvhu.transporterTransportSignatureDate !== null) {
    throw new AlreadySignedError();
  }

  const nextStatus = await getNextStatus(bsvhu, input.type);

  const updateInput: Prisma.BsvhuUpdateInput = {
    transporterTransportSignatureAuthor: input.author,
    transporterTransportSignatureDate: new Date(input.date ?? Date.now()),
    status: nextStatus,
    transporterRecepisseNumber: input.transporterRecepisseNumber ?? null,
    transporterRecepisseDepartment:
      input.transporterRecepisseDepartment ?? null,
    transporterRecepisseValidityLimit:
      input.transporterRecepisseValidityLimit ?? null
  };

  return updateBsvhu(user, bsvhu, updateInput);
}

async function signOperation(
  user: Express.User,
  bsvhu: Bsvhu,
  input: BsvhuSignatureInput
) {
  if (bsvhu.destinationOperationSignatureDate !== null) {
    throw new AlreadySignedError();
  }

  const nextStatus = await getNextStatus(bsvhu, input.type);

  const updateInput: Prisma.BsvhuUpdateInput = {
    destinationOperationSignatureAuthor: input.author,
    destinationOperationSignatureDate: new Date(input.date ?? Date.now()),
    status: nextStatus
  };

  return updateBsvhu(user, bsvhu, updateInput);
}

/**
 * Transition a BSVHU from initial state (ex: SENT) to next state (ex: RECEIVED)
 * Allowed transitions are defined as a state machine using xstate
 */
export async function getNextStatus(
  bsvhu: Bsvhu,
  signatureType: SignatureTypeInput
) {
  if (bsvhu.isDraft) {
    throw new InvalidTransition();
  }
  const currentStatus = bsvhu.status;

  // Use state machine to calculate new status
  const nextState = machine.transition(currentStatus, {
    type: signatureType,
    bsvhu
  });

  // This transition is not possible
  if (!nextState.changed) {
    throw new InvalidSignatureError();
  }

  const nextStatus = nextState.value as BsvhuStatus;

  return nextStatus;
}

/**
 * Perform the signature in DB and run the
 * post signature hook in transaction
 */
async function updateBsvhu(
  user: Express.User,
  bsvhu: Bsvhu,
  updateInput: Prisma.BsvhuUpdateInput
) {
  return runInTransaction(async transaction => {
    const bsvhuRepository = getBsvhuRepository(user, transaction);
    const signBsda = await bsvhuRepository.update(
      { id: bsvhu.id, status: bsvhu.status },
      updateInput
    );
    return signBsda;
  });
}
