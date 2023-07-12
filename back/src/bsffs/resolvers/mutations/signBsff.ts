import {
  BsffStatus,
  Bsff,
  BsffPackaging,
  WasteAcceptationStatus
} from "@prisma/client";
import prisma from "../../../prisma";
import { UserInputError } from "apollo-server-express";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  BsffSignatureInput,
  BsffSignatureType,
  MutationResolvers
} from "../../../generated/graphql/types";
import {
  validateAfterReception,
  validateBeforeAcceptation,
  validateBeforeEmission,
  validateBeforeOperation,
  validateBeforeReception,
  validateBeforeTransport
} from "../../validation";
import { expandBsffFromDB } from "../../converter";
import { getBsffOrNotFound } from "../../database";
import { isFinalOperation } from "../../constants";
import { getStatus } from "../../compat";
import { runInTransaction } from "../../../common/repository/helper";
import {
  getBsffPackagingRepository,
  getBsffRepository
} from "../../repository";
import { checkCanSignFor } from "../../../permissions";
import { getTransporterCompanyOrgId } from "../../../common/constants/companySearchHelpers";
import { REQUIRED_RECEIPT_NUMBER } from "../../../common/validation";

const signBsff: MutationResolvers["signBsff"] = async (
  _,
  { id, input },
  context
) => {
  const user = checkIsAuthenticated(context);
  const existingBsff = await getBsffOrNotFound({ id });
  const authorizedOrgIds = getAuthorizedOrgIds(existingBsff, input.type);
  await checkCanSignFor(user, input.type, authorizedOrgIds, input.securityCode);

  const sign = signatures[input.type];
  const updatedBsff = await sign(user, existingBsff, {
    ...input,
    date: new Date(input.date ?? Date.now())
  });

  return expandBsffFromDB(updatedBsff);
};

export default signBsff;

/**
 * Returns the different companies allowed to perform the signature
 * @param bsff the BSFF we wante to sign
 * @param signatureType the type of signature (ex: EMISSION, TRANSPORT, etc)
 * @returns a list of organisation identifiers
 */
export function getAuthorizedOrgIds(
  bsff: Bsff,
  signatureType: BsffSignatureType
): string[] {
  const signatureTypeToFn: {
    [Key in BsffSignatureType]: (bsff: Bsff) => (string | null)[];
  } = {
    EMISSION: (bsff: Bsff) => [bsff.emitterCompanySiret],
    TRANSPORT: (bsff: Bsff) => [
      bsff.transporterCompanySiret,
      bsff.transporterCompanyVatNumber
    ],
    ACCEPTATION: (bsff: Bsff) => [bsff.destinationCompanySiret],
    RECEPTION: (bsff: Bsff) => [bsff.destinationCompanySiret],
    OPERATION: (bsff: Bsff) => [bsff.destinationCompanySiret]
  };

  const getAuthorizedSiretsFn = signatureTypeToFn[signatureType];

  return getAuthorizedSiretsFn(bsff).filter(Boolean);
}

export async function getTransporterReceipt(existingBsff: Bsff) {
  // fetch TransporterReceipt
  const orgId = getTransporterCompanyOrgId(existingBsff);
  let transporterReceipt;
  if (orgId) {
    transporterReceipt = await prisma.company
      .findUnique({
        where: { orgId }
      })
      .transporterReceipt();
  }
  return {
    transporterRecepisseNumber: transporterReceipt?.receiptNumber ?? null,
    transporterRecepisseDepartment: transporterReceipt?.department ?? null,
    transporterRecepisseValidityLimit: transporterReceipt?.validityLimit ?? null
  };
}

// Defines different signature function based on signature type
const signatures: Record<
  BsffSignatureType,
  (
    user: Express.User,
    bsff: Bsff & { packagings: BsffPackaging[] },
    input: BsffSignatureInput
  ) => Promise<Bsff>
> = {
  EMISSION: signEmission,
  TRANSPORT: signTransport,
  RECEPTION: signReception,
  ACCEPTATION: signAcceptation,
  OPERATION: signOperation
};

/**
 * Sign the emission of the BSFF
 * @param user the user who is performing the signature
 * @param bsff the BSFF under signature
 * @param input the signature info
 * @returns the signed BSFF
 *
 */
async function signEmission(
  user: Express.User,
  bsff: Bsff & { packagings: BsffPackaging[] },
  input: BsffSignatureInput
) {
  await validateBeforeEmission(bsff);

  const { update: updateBsff } = getBsffRepository(user);

  return updateBsff({
    where: { id: bsff.id },
    data: {
      status: BsffStatus.SIGNED_BY_EMITTER,
      emitterEmissionSignatureDate: input.date,
      emitterEmissionSignatureAuthor: input.author
    }
  });
}

/**
 * Sign the transport of the BSFF
 * @param user the user who is performing the signature
 * @param bsff the BSFF under signature
 * @param input the signature info
 * @returns the signed BSFF
 *
 */
async function signTransport(
  user: Express.User,
  bsff: Bsff & { packagings: BsffPackaging[] },
  input: BsffSignatureInput
) {
  const transporterReceipt = await getTransporterReceipt(bsff);
  // Hack to override the Bsff recepisse exemption with bsff.transporterRecepisseNumber is null
  if (!transporterReceipt.transporterRecepisseNumber) {
    throw new UserInputError(REQUIRED_RECEIPT_NUMBER);
  }
  await validateBeforeTransport({ ...bsff, ...transporterReceipt });

  const { update: updateBsff } = getBsffRepository(user);

  return updateBsff({
    where: { id: bsff.id },
    data: {
      status: BsffStatus.SENT,
      transporterTransportSignatureDate: input.date,
      transporterTransportSignatureAuthor: input.author,
      ...transporterReceipt
    }
  });
}

/**
 * Sign the reception of the BSFF
 * @param user the user who is performing the signature
 * @param bsff the BSFF under signature
 * @param input the signature info
 * @returns the signed BSFF
 *
 */
async function signReception(
  user: Express.User,
  bsff: Bsff & { packagings: BsffPackaging[] },
  input: BsffSignatureInput
) {
  await validateBeforeReception(bsff);

  const { update: updateBsff } = getBsffRepository(user);

  return updateBsff({
    where: { id: bsff.id },
    data: {
      status: BsffStatus.RECEIVED,
      destinationReceptionSignatureDate: input.date,
      destinationReceptionSignatureAuthor: input.author
    }
  });
}

/**
 * Sign the acceptation of the BSFF
 * @param user the user who is performing the signature
 * @param bsff the BSFF under signature
 * @param input the signature info including an optional `packagingId` to
 * perform the signature on only one packaging
 * @returns the signed BSFF
 *
 */
async function signAcceptation(
  user: Express.User,
  bsff: Bsff & { packagings: BsffPackaging[] },
  input: BsffSignatureInput
) {
  await validateAfterReception(bsff);

  return runInTransaction(async transaction => {
    const {
      update: updateBsffPackaging,
      updateMany: updateManyBsffPackaging,
      findMany: findManyBsffPackaging
    } = getBsffPackagingRepository(user, transaction);

    const packagingId = input.packagingId;

    if (packagingId) {
      const packaging = bsff.packagings.find(p => p.id === packagingId);
      if (!packaging) {
        throw new UserInputError(
          `Le contenant ${packagingId} n'apparait pas sur le BSFF n°${bsff.id}`
        );
      }

      await validateBeforeAcceptation(packaging);

      await updateBsffPackaging({
        where: { id: packagingId },
        data: {
          acceptationSignatureDate: input.date,
          acceptationSignatureAuthor: input.author,
          // set acceptation waste code if it was not set explicitly
          acceptationWasteCode:
            packaging.acceptationWasteCode ?? bsff.wasteCode,
          ...(packaging.acceptationStatus === "REFUSED"
            ? { previousPackagings: { set: [] } }
            : {})
        }
      });
    } else {
      await Promise.all(bsff.packagings.map(p => validateBeforeAcceptation(p)));

      // sign for all packagings
      await updateManyBsffPackaging({
        where: { bsffId: bsff.id },
        data: {
          acceptationSignatureDate: input.date,
          acceptationSignatureAuthor: input.author
        }
      });

      // set acceptation waste code if it was not set explicitly
      await updateManyBsffPackaging({
        where: { bsffId: bsff.id, acceptationWasteCode: null },
        data: {
          acceptationWasteCode: bsff.wasteCode
        }
      });

      const refusedPackagings = await findManyBsffPackaging({
        where: {
          bsffId: bsff.id,
          acceptationStatus: WasteAcceptationStatus.REFUSED
        }
      });

      for (const refusedPackaging of refusedPackagings) {
        await updateBsffPackaging({
          where: { id: refusedPackaging.id },
          data: { previousPackagings: { set: [] } }
        });
      }
    }

    const { update: updateBsff, findUniqueGetPackagings } = getBsffRepository(
      user,
      transaction
    );

    const packagings =
      (await findUniqueGetPackagings({
        where: { id: bsff.id }
      })) ?? [];

    const status = await getStatus(
      { ...bsff, packagings },
      {
        user,
        prisma: transaction
      }
    );

    const updatedBsff = await updateBsff({
      where: { id: bsff.id },
      data: { status }
    });

    return updatedBsff;
  });
}

/**
 * Sign the operation of the BSFF
 * @param user the user who is performing the signature
 * @param bsff the BSFF under signature
 * @param input the signature info including an optional `packagingId` to
 * perform the signature on only one packaging
 * @returns the signed BSFF
 *
 */
async function signOperation(
  user: Express.User,
  bsff: Bsff & { packagings: BsffPackaging[] },
  input: BsffSignatureInput
) {
  await validateAfterReception(bsff);

  const packagingId = input.packagingId;

  return runInTransaction(async transaction => {
    const {
      updateMany: updateManyBsffPackaging,
      update: updateBsffPackaging,
      findPreviousPackagings
    } = getBsffPackagingRepository(user, transaction);
    if (packagingId) {
      const packaging = bsff.packagings.find(p => p.id === packagingId);
      if (!packaging) {
        throw new UserInputError(
          `Le contenant ${packagingId} n'apparait pas sur le BSFF n°${bsff.id}`
        );
      }

      await validateBeforeOperation(packaging);

      await updateBsffPackaging({
        where: { id: packagingId },
        data: {
          operationSignatureDate: input.date,
          operationSignatureAuthor: input.author
        }
      });
    } else {
      await Promise.all(bsff.packagings.map(p => validateBeforeOperation(p)));

      // sign for all packagings
      await updateManyBsffPackaging({
        where: { bsffId: bsff.id },
        data: {
          operationSignatureDate: input.date,
          operationSignatureAuthor: input.author
        }
      });
    }
    const {
      update: updateBsff,
      findMany: findManyBsffs,
      findUniqueGetPackagings
    } = getBsffRepository(user, transaction);

    const packagings =
      (await findUniqueGetPackagings({
        where: { id: bsff.id }
      })) ?? [];

    const status = await getStatus(
      { ...bsff, packagings },
      { user, prisma: transaction }
    );

    const updatedBsff = await updateBsff({
      where: { id: bsff.id },
      data: { status }
    });

    const finalOperationPackagings = packagings.filter(
      p =>
        p.operationCode &&
        isFinalOperation(p.operationCode, p.operationNoTraceability)
    );

    const previousPackagings = await findPreviousPackagings(
      finalOperationPackagings.map(p => p.id)
    );

    const bsffs = await findManyBsffs({
      where: { id: { in: previousPackagings.map(p => p.bsffId) } }
    });

    await Promise.all(
      bsffs.map(async bsff => {
        const newStatus = await getStatus(bsff, {
          user,
          prisma: transaction
        });
        if (newStatus !== bsff.status) {
          const updatedBsff = await updateBsff({
            where: { id: bsff.id },
            data: { status: newStatus }
          });
          return updatedBsff;
        }
        return bsff;
      })
    );

    return updatedBsff;
  });
}
