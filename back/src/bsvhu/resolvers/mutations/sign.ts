import { Bsvhu, BsvhuStatus, Prisma } from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import type {
  BsvhuSignatureInput,
  MutationSignBsvhuArgs,
  SignatureTypeInput
} from "@td/codegen-back";
import { UserInputError } from "../../../common/errors";
import { GraphQLContext } from "../../../types";
import { expandVhuFormFromDb } from "../../converter";
import {
  getBsvhuOrNotFound,
  getNextTransporterSync,
  getNthTransporterSync,
  getTransportersSync
} from "../../database";
import { AlreadySignedError, InvalidSignatureError } from "../../errors";
import { machine } from "../../machine";
import { parseBsvhuAsync } from "../../validation";
import { getBsvhuRepository } from "../../repository";
import { checkCanSignFor } from "../../../permissions";
import { runInTransaction } from "../../../common/repository/helper";
import { InvalidTransition } from "../../../forms/errors";
import { getTransporterReceipt } from "../../../companies/recipify";
import { prismaToZodBsvhu } from "../../validation/helpers";
import { prisma } from "@td/prisma";
import {
  BsvhuForParsingInclude,
  PrismaBsvhuForParsing
} from "../../validation/types";
import { AllBsvhuSignatureType, BsvhuWithTransporters } from "../../types";

export default async function sign(
  _,
  { id, input }: MutationSignBsvhuArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const bsvhu = await getBsvhuOrNotFound(id, {
    include: BsvhuForParsingInclude
  });

  const signatureType = getBsvhuSignatureType(input.type, bsvhu);
  const authorizedOrgIds = getAuthorizedOrgIds(bsvhu, signatureType);

  // To sign a form for a company, you must either:
  // - be part of that company
  // - provide the company security code
  await checkCanSignFor<AllBsvhuSignatureType>(
    user,
    signatureType,
    authorizedOrgIds,
    input.securityCode
  );

  const zodBsvhu = prismaToZodBsvhu(bsvhu);

  // Check that all necessary fields are filled
  await parseBsvhuAsync(zodBsvhu, {
    user,
    currentSignatureType: signatureType
  });

  const sign = signatures[signatureType];
  const signedBsvhu = await sign(user, bsvhu, {
    ...input,
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
  bsvhu: PrismaBsvhuForParsing,
  signatureType: AllBsvhuSignatureType
): string[] {
  const transportNthAuthorizedOrgIds = (
    bsvhu: PrismaBsvhuForParsing,
    n: number
  ) => {
    const transporterN = getNthTransporterSync(bsvhu, n);
    return [
      transporterN?.transporterCompanySiret,
      transporterN?.transporterCompanyVatNumber
    ].filter(Boolean);
  };
  const signatureTypeToFn: {
    [Key in AllBsvhuSignatureType]: (
      bsvhu: PrismaBsvhuForParsing
    ) => (string | null)[];
  } = {
    EMISSION: (bsvhu: PrismaBsvhuForParsing) => [bsvhu.emitterCompanySiret],
    TRANSPORT: (bsvhu: PrismaBsvhuForParsing) =>
      transportNthAuthorizedOrgIds(bsvhu, 1),
    TRANSPORT_2: (bsvhu: PrismaBsvhuForParsing) =>
      transportNthAuthorizedOrgIds(bsvhu, 2),
    TRANSPORT_3: (bsvhu: PrismaBsvhuForParsing) =>
      transportNthAuthorizedOrgIds(bsvhu, 3),
    TRANSPORT_4: (bsvhu: PrismaBsvhuForParsing) =>
      transportNthAuthorizedOrgIds(bsvhu, 4),
    TRANSPORT_5: (bsvhu: PrismaBsvhuForParsing) =>
      transportNthAuthorizedOrgIds(bsvhu, 5),
    RECEPTION: (bsvhu: PrismaBsvhuForParsing) => [
      bsvhu.destinationCompanySiret
    ],
    OPERATION: (bsvhu: PrismaBsvhuForParsing) => [bsvhu.destinationCompanySiret]
  };

  const getAuthorizedSiretsFn = signatureTypeToFn[signatureType];

  return getAuthorizedSiretsFn(bsvhu).filter(Boolean);
}

// Defines different signature function based on signature type
const signatures: Record<
  SignatureTypeInput,
  (
    user: Express.User,
    bsvhu: PrismaBsvhuForParsing,
    input: BsvhuSignatureInput
  ) => Promise<BsvhuWithTransporters>
> = {
  EMISSION: signEmission,
  TRANSPORT: signTransport,
  RECEPTION: signReception,
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
  bsvhu: PrismaBsvhuForParsing,
  input: BsvhuSignatureInput
) {
  if (bsvhu.transporters.length === 0) {
    throw new UserInputError(
      "Aucun transporteur n'est renseigné sur ce BSVHU."
    );
  }

  const transporter = getNextTransporterSync(bsvhu);

  if (!transporter) {
    throw new AlreadySignedError();
  }
  const transporterReceipt = await getTransporterReceipt(transporter);

  // le bsvhu n'a pas reçu de signature émetteur
  // Ce cas est possible en situation irrégulière,
  // si l'entreprise n'est pas sur TD ou si il n'y a pas de SIRET
  let emitterCompanyNotOnTD = false;
  if (!bsvhu.emitterEmissionSignatureDate) {
    if (!bsvhu.emitterNoSiret && bsvhu.emitterCompanySiret) {
      const emitterCompany = await prisma.company.findFirst({
        where: {
          orgId: bsvhu.emitterCompanySiret
        }
      });
      if (!emitterCompany) {
        emitterCompanyNotOnTD = true;
      }
    }
  }

  const nextStatus = await getNextStatus(
    bsvhu,
    input.type,
    emitterCompanyNotOnTD
  );
  const signatureDate = new Date(input.date ?? Date.now());

  const updateInput: Prisma.BsvhuUpdateInput = {
    status: nextStatus,
    transporters: {
      update: {
        where: { id: transporter.id },
        data: {
          transporterTransportSignatureAuthor: input.author,
          transporterTransportSignatureDate: signatureDate,
          // auto-complete transporter receipt
          transporterRecepisseDepartment:
            transporterReceipt.transporterRecepisseDepartment,
          transporterRecepisseNumber:
            transporterReceipt.transporterRecepisseNumber,
          transporterRecepisseValidityLimit:
            transporterReceipt.transporterRecepisseValidityLimit
        }
      }
    }
  };

  if (transporter.number === 1) {
    // champ dénormalisé permettant de stocker la date de la première signature
    // transporteur sur le BSVHU
    updateInput.transporterTransportSignatureDate = signatureDate;
  }

  return updateBsvhu(user, bsvhu, updateInput);
}

async function signReception(
  user: Express.User,
  bsvhu: Bsvhu,
  input: BsvhuSignatureInput
) {
  if (bsvhu.destinationReceptionSignatureDate !== null) {
    throw new AlreadySignedError();
  }

  const nextStatus = await getNextStatus(bsvhu, input.type);

  const updateInput: Prisma.BsvhuUpdateInput = {
    destinationReceptionSignatureAuthor: input.author,
    destinationReceptionSignatureDate: new Date(input.date ?? Date.now()),
    status: nextStatus
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
    status: nextStatus,
    // on autorise l'installation de destination à signer même si le ou les
    // derniers transporteurs multi-modaux n'ont pas signé dans le cas où le
    // premier transporteur ait finalement décidé d'aller directement à destination.
    // Dans ce cas on supprime les transporteurs multi-modaux qui n'ont pas signé.
    transporters: { deleteMany: { transporterTransportSignatureDate: null } }
  };

  return updateBsvhu(user, bsvhu, updateInput);
}

/**
 * Transition a BSVHU from initial state (ex: SENT) to next state (ex: RECEIVED)
 * Allowed transitions are defined as a state machine using xstate
 */
export async function getNextStatus(
  bsvhu: Bsvhu,
  signatureType: SignatureTypeInput,
  emitterCompanyNotOnTD?: boolean
) {
  if (bsvhu.isDraft) {
    throw new InvalidTransition();
  }
  const currentStatus = bsvhu.status;

  // Use state machine to calculate new status
  const nextState = machine.transition(currentStatus, {
    type: signatureType,
    bsvhu,
    emitterCompanyNotOnTD
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

/**
 * Renvoie le numéro de la signature de transport en cas de signature d'un transporteur
 * mulit-modal. Renvoie la signature GraphQL dans les autres cas
 * @param signatureType
 * @param bsda
 * @returns
 */
function getBsvhuSignatureType(
  signatureType: SignatureTypeInput,
  bsvhu: BsvhuWithTransporters
): AllBsvhuSignatureType {
  if (signatureType === "TRANSPORT") {
    if (bsvhu.transporters && bsvhu.transporters.length > 1) {
      const transporters = getTransportersSync(bsvhu);
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
      return `TRANSPORT_${number}` as AllBsvhuSignatureType;
    }
    return "TRANSPORT";
  }

  return signatureType;
}
