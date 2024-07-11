import {
  BsffStatus,
  Bsff,
  BsffPackaging,
  WasteAcceptationStatus
} from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  BsffSignatureInput,
  BsffSignatureType,
  MutationResolvers
} from "../../../generated/graphql/types";
import { expandBsffFromDB } from "../../converter";
import {
  getBsffOrNotFound,
  getNextTransporterSync,
  getNthTransporterSync
} from "../../database";
import { isFinalOperation } from "../../constants";
import { getStatus } from "../../compat";
import { runInTransaction } from "../../../common/repository/helper";
import {
  getBsffPackagingRepository,
  getBsffRepository
} from "../../repository";
import { checkCanSignFor } from "../../../permissions";
import { UserInputError } from "../../../common/errors";
import { operationHook } from "../../operationHook";
import { prisma } from "@td/prisma";
import {
  BsffWithPackagings,
  BsffWithTransporters,
  BsffWithTransportersInclude
} from "../../types";
import { parseBsffAsync } from "../../validation/bsff";
import {
  AllBsffSignatureType,
  PrismaBsffForParsing
} from "../../validation/bsff/types";
import { prismaToZodBsff } from "../../validation/bsff/helpers";
import { prismaToZodBsffPackaging } from "../../validation/bsffPackaging/helpers";
import { parseBsffPackagingAsync } from "../../validation/bsffPackaging";

const signBsff: MutationResolvers["signBsff"] = async (
  _,
  { id, input },
  context
) => {
  const user = checkIsAuthenticated(context);
  const existingBsff = await getBsffOrNotFound({ id });

  const signatureType = getBsffSignatureType(input.type, existingBsff);

  const authorizedOrgIds = getAuthorizedOrgIds(existingBsff, signatureType);
  await checkCanSignFor(
    user,
    signatureType,
    authorizedOrgIds,
    input.securityCode
  );

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
 * @param bsff the BSFF we want to sign
 * @param signatureType the type of signature (ex: EMISSION, TRANSPORT, etc)
 * @returns a list of organisation identifiers
 */
export function getAuthorizedOrgIds(
  bsff: BsffWithTransporters,
  signatureType: AllBsffSignatureType
): string[] {
  const transportNthAuthorizedOrgIds = (
    bsff: BsffWithTransporters,
    n: number
  ) => {
    const transporterN = getNthTransporterSync(bsff, n);
    return [
      transporterN?.transporterCompanySiret,
      transporterN?.transporterCompanyVatNumber
    ].filter(Boolean);
  };

  const signatureTypeToFn: {
    [Key in AllBsffSignatureType]: (
      bsff: BsffWithTransporters
    ) => (string | null)[];
  } = {
    EMISSION: (bsff: Bsff) => [bsff.emitterCompanySiret],
    TRANSPORT: (bsff: BsffWithTransporters) =>
      transportNthAuthorizedOrgIds(bsff, 1),
    TRANSPORT_2: (bsff: BsffWithTransporters) =>
      transportNthAuthorizedOrgIds(bsff, 2),
    TRANSPORT_3: (bsff: BsffWithTransporters) =>
      transportNthAuthorizedOrgIds(bsff, 3),
    TRANSPORT_4: (bsff: BsffWithTransporters) =>
      transportNthAuthorizedOrgIds(bsff, 4),
    TRANSPORT_5: (bsff: BsffWithTransporters) =>
      transportNthAuthorizedOrgIds(bsff, 5),
    ACCEPTATION: (bsff: Bsff) => [bsff.destinationCompanySiret],
    RECEPTION: (bsff: Bsff) => [bsff.destinationCompanySiret],
    OPERATION: (bsff: Bsff) => [bsff.destinationCompanySiret]
  };

  const getAuthorizedSiretsFn = signatureTypeToFn[signatureType];

  return getAuthorizedSiretsFn(bsff).filter(Boolean);
}

// Defines different signature function based on signature type
const signatures: Record<
  BsffSignatureType,
  (
    user: Express.User,
    bsff: Bsff & BsffWithPackagings & BsffWithTransporters,
    input: BsffSignatureInput
  ) => Promise<BsffWithTransporters>
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
  bsff: PrismaBsffForParsing,
  input: BsffSignatureInput
) {
  if (bsff.emitterEmissionSignatureDate) {
    throw new UserInputError(
      "L'entreprise émettrice a déjà signé ce bordereau"
    );
  }

  const zodBsff = prismaToZodBsff(bsff);
  await parseBsffAsync(zodBsff, { user, currentSignatureType: "EMISSION" });

  const { updateBsff } = getBsffRepository(user);

  return updateBsff({
    where: { id: bsff.id },
    data: {
      status: BsffStatus.SIGNED_BY_EMITTER,
      emitterEmissionSignatureDate: input.date,
      emitterEmissionSignatureAuthor: input.author
    },
    include: BsffWithTransportersInclude
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
  bsff: PrismaBsffForParsing,
  input: BsffSignatureInput
) {
  if (bsff.transporters.length === 0) {
    throw new UserInputError("Aucun transporteur n'est renseigné sur ce BSFF.");
  }

  const transporter = getNextTransporterSync(bsff)!;

  if (!transporter) {
    throw new UserInputError("Tous les transporteurs ont déjà signé");
  }

  const zodBsff = prismaToZodBsff(bsff);
  const parsedBsff = await parseBsffAsync(zodBsff, {
    currentSignatureType: "TRANSPORT"
  });
  const parsedZodTransporter =
    (parsedBsff.transporters ?? []).find(
      t => t.number === transporter.number
    ) ?? null;

  const { updateBsff } = getBsffRepository(user);

  return updateBsff({
    where: { id: bsff.id },
    data: {
      status: BsffStatus.SENT,
      ...(transporter.number === 1
        ? // champ dénormalisé permettant de stocker la date de la première signature
          // transporteur sur le BSFF
          { transporterTransportSignatureDate: input.date }
        : {}),
      transporters: {
        update: {
          where: { id: transporter.id },
          data: {
            transporterTransportSignatureDate: input.date,
            transporterTransportSignatureAuthor: input.author,
            transporterRecepisseNumber:
              parsedZodTransporter?.transporterRecepisseNumber ?? null,
            transporterRecepisseDepartment:
              parsedZodTransporter?.transporterRecepisseDepartment ?? null,
            transporterRecepisseValidityLimit:
              parsedZodTransporter?.transporterRecepisseValidityLimit ?? null
          }
        }
      }
    },
    include: BsffWithTransportersInclude
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
  bsff: PrismaBsffForParsing,
  input: BsffSignatureInput
) {
  if (bsff.destinationReceptionSignatureDate) {
    throw new UserInputError(
      "L'entreprise émettrice a déjà signé ce bordereau"
    );
  }

  const zodBsff = prismaToZodBsff(bsff);
  await parseBsffAsync(zodBsff, { currentSignatureType: "RECEPTION" });

  const { updateBsff } = getBsffRepository(user);

  return updateBsff({
    where: { id: bsff.id },
    data: {
      status: BsffStatus.RECEIVED,
      destinationReceptionSignatureDate: input.date,
      destinationReceptionSignatureAuthor: input.author,
      // on autorise l'installation de destination à signer même si le ou les
      // derniers transporteurs multi-modaux n'ont pas signé dans le cas où le
      // premier transporteur ait finalement décidé d'aller directement à destination.
      // Dans ce cas on supprime les transporteurs multi-modaux qui n'ont pas signé.
      transporters: { deleteMany: { transporterTransportSignatureDate: null } }
    },
    include: BsffWithTransportersInclude
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
  if (!bsff.destinationReceptionSignatureDate) {
    throw new UserInputError(
      "L'installation de destination n'a pas encore signé la réception"
    );
  }

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

      if (packaging.acceptationSignatureDate) {
        throw new UserInputError(
          "L'installation de destination a déjà signé l'acceptation de ce contenant"
        );
      }

      const zodBsffPackaging = prismaToZodBsffPackaging(packaging);
      await parseBsffPackagingAsync(zodBsffPackaging, {
        currentSignatureType: "ACCEPTATION"
      });

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
      await Promise.all(
        bsff.packagings.map(async p => {
          const zodBsffPackaging = prismaToZodBsffPackaging(p);
          await parseBsffPackagingAsync(zodBsffPackaging, {
            currentSignatureType: "ACCEPTATION"
          });
        })
      );

      // sign for all packagings
      await updateManyBsffPackaging({
        where: { bsffId: bsff.id, acceptationSignatureDate: null },
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

    const { updateBsff, findUniqueGetPackagings } = getBsffRepository(
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
      data: { status },
      include: BsffWithTransportersInclude
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
  const packagingId = input.packagingId;

  return runInTransaction(async transaction => {
    const {
      updateMany: updateManyBsffPackaging,
      update: updateBsffPackaging,
      findPreviousPackagings
    } = getBsffPackagingRepository(user, transaction);

    const {
      updateBsff,
      findMany: findManyBsffs,
      findUniqueGetPackagings
    } = getBsffRepository(user, transaction);

    if (packagingId) {
      const packaging = bsff.packagings.find(p => p.id === packagingId);
      if (!packaging) {
        throw new UserInputError(
          `Le contenant ${packagingId} n'apparait pas sur le BSFF n°${bsff.id}`
        );
      }

      if (packaging.operationSignatureDate) {
        throw new UserInputError(
          "L'installation de destination a déjà signé l'acceptation de ce contenant"
        );
      }

      const zodBsffPackaging = prismaToZodBsffPackaging(packaging);
      await parseBsffPackagingAsync(zodBsffPackaging, {
        currentSignatureType: "OPERATION"
      });

      const updatedBsffPackaging = await updateBsffPackaging({
        where: { id: packagingId },
        data: {
          operationSignatureDate: input.date,
          operationSignatureAuthor: input.author
        }
      });

      transaction.addAfterCommitCallback(async () => {
        await operationHook(updatedBsffPackaging, { runSync: false });
      });
    } else {
      await Promise.all(
        bsff.packagings.map(async p => {
          const zodBsffPackaging = prismaToZodBsffPackaging(p);
          await parseBsffPackagingAsync(zodBsffPackaging, {
            currentSignatureType: "OPERATION"
          });
        })
      );

      // sign for all packagings
      await updateManyBsffPackaging({
        where: { bsffId: bsff.id, operationSignatureDate: null },
        data: {
          operationSignatureDate: input.date,
          operationSignatureAuthor: input.author
        }
      });

      transaction.addAfterCommitCallback(async () => {
        const { packagings: updatedPackagings } =
          await prisma.bsff.findUniqueOrThrow({
            where: { id: bsff.id },
            include: { packagings: true }
          });
        for (const updatedPackgaing of updatedPackagings) {
          await operationHook(updatedPackgaing, { runSync: false });
        }
      });
    }

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
      data: { status },
      include: BsffWithTransportersInclude
    });

    const finalOperationPackagings = packagings.filter(
      p =>
        p.operationSignatureDate &&
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

/**
 * Renvoie le numéro de la signature de transport en cas de signature d'un transporteur
 * mulit-modal. Renvoie la signature GraphQL dans les autres cas
 * @param signatureType
 * @param bsff
 * @returns
 */
function getBsffSignatureType(
  signatureType: BsffSignatureType,
  bsff: BsffWithTransporters
): AllBsffSignatureType {
  if (signatureType === "TRANSPORT") {
    if (bsff.transporters && bsff.transporters.length > 1) {
      const nextTransporter = getNextTransporterSync(bsff);
      if (!nextTransporter) {
        throw new UserInputError(
          "Impossible d'appliquer une signature TRANSPORT. Tous les transporteurs ont déjà signé"
        );
      }
      const number = nextTransporter.number;
      if (!number || number === 1) {
        return "TRANSPORT";
      }
      return `TRANSPORT_${number}` as AllBsffSignatureType;
    }
    return "TRANSPORT";
  }

  return signatureType;
}
