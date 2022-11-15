import {
  BsffStatus,
  Bsff,
  BsffPackaging,
  WasteAcceptationStatus
} from "@prisma/client";
import { UserInputError } from "apollo-server-express";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  BsffSignatureType,
  MutationResolvers,
  MutationSignBsffArgs
} from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import {
  validateAfterReception,
  validateBeforeAcceptation,
  validateBeforeEmission,
  validateBeforeOperation,
  validateBeforeReception,
  validateBeforeTransport
} from "../../validation";
import { expandBsffFromDB } from "../../converter";
import { getBsffOrNotFound, getPreviousPackagings } from "../../database";
import { indexBsff } from "../../elastic";
import { isFinalOperation } from "../../constants";
import { getStatus } from "../../compat";
import { runInTransaction } from "../../../common/repository/helper";
import { enqueueBsdToIndex } from "../../../queue/producers/elastic";

async function checkIsAllowed(
  siret: string | null,
  user: Express.User,
  securityCode: number | null
) {
  if (siret == null) {
    throw new UserInputError(
      `Les informations relatives à l'acteur pour lequel vous souhaitez signer sont manquantes.`
    );
  }

  if (securityCode) {
    const count = await prisma.company.count({
      where: {
        siret,
        securityCode
      }
    });
    if (count <= 0) {
      throw new UserInputError(`Le code de sécurité est incorrect.`);
    }
  } else {
    const count = await prisma.companyAssociation.count({
      where: {
        userId: user.id,
        company: {
          siret
        }
      }
    });
    if (count <= 0) {
      throw new UserInputError(
        `Vous n'êtes pas autorisé à signer pour cet acteur.`
      );
    }
  }
}

const signatures: Record<
  BsffSignatureType,
  (
    args: MutationSignBsffArgs,
    user: Express.User,
    existingBsff: Bsff & { packagings: BsffPackaging[] }
  ) => Promise<Bsff>
> = {
  EMISSION: async (
    { id, input: { date, author, securityCode } },
    user,
    existingBsff
  ) => {
    await checkIsAllowed(existingBsff.emitterCompanySiret, user, securityCode);
    await validateBeforeEmission(existingBsff as any);

    return prisma.bsff.update({
      data: {
        status: BsffStatus.SIGNED_BY_EMITTER,
        emitterEmissionSignatureDate: date,
        emitterEmissionSignatureAuthor: author
      },
      where: {
        id
      }
    });
  },
  TRANSPORT: async (
    { id, input: { date, author, securityCode } },
    user,
    existingBsff
  ) => {
    await checkIsAllowed(
      existingBsff.transporterCompanySiret,
      user,
      securityCode
    );

    await validateBeforeTransport(existingBsff as any);

    return prisma.bsff.update({
      data: {
        status: BsffStatus.SENT,
        transporterTransportSignatureDate: date,
        transporterTransportSignatureAuthor: author
      },
      where: {
        id
      }
    });
  },
  RECEPTION: async (
    { id, input: { date, author, securityCode } },
    user,
    existingBsff
  ) => {
    await checkIsAllowed(
      existingBsff.destinationCompanySiret,
      user,
      securityCode
    );
    await validateBeforeReception(existingBsff as any);

    return prisma.bsff.update({
      data: {
        status: BsffStatus.RECEIVED,
        destinationReceptionSignatureDate: date,
        destinationReceptionSignatureAuthor: author
      },
      where: {
        id
      }
    });
  },
  ACCEPTATION: async (
    { id, input: { date, author, securityCode, packagingId } },
    user,
    existingBsff
  ) => {
    await checkIsAllowed(
      existingBsff.destinationCompanySiret,
      user,
      securityCode
    );

    await validateAfterReception(existingBsff as any);

    const updatedBsff = await runInTransaction(async transaction => {
      if (packagingId) {
        const packaging = existingBsff.packagings.find(
          p => p.id === packagingId
        );
        if (!packaging) {
          throw new UserInputError(
            `Le contenant ${packagingId} n'apparait pas sur le BSFF n°${id}`
          );
        }

        await validateBeforeAcceptation(packaging);

        await transaction.bsffPackaging.update({
          where: { id: packagingId },
          data: {
            acceptationSignatureDate: date,
            acceptationSignatureAuthor: author
          }
        });
      } else {
        await Promise.all(
          existingBsff.packagings.map(p => validateBeforeAcceptation(p))
        );

        // sign for all packagings
        await transaction.bsffPackaging.updateMany({
          where: { bsffId: id },
          data: {
            acceptationSignatureDate: date,
            acceptationSignatureAuthor: author
          }
        });
      }

      const packagings = await transaction.bsff
        .findUnique({
          where: { id }
        })
        .packagings();

      const status = await getStatus({ ...existingBsff, packagings });

      return transaction.bsff.update({
        where: { id },
        data: { status },
        include: { packagings: true }
      });
    });

    // TODO updating previous BSFFs status should be done in transaction

    const refusedPackagings = updatedBsff.packagings.filter(
      p => p.acceptationStatus === WasteAcceptationStatus.REFUSED
    );

    const previousPackagings = await getPreviousPackagings(
      refusedPackagings.map(p => p.id)
    );

    const bsffs = await prisma.bsff.findMany({
      where: { id: { in: previousPackagings.map(p => p.bsffId) } },
      include: { packagings: true }
    });

    await Promise.all(
      bsffs.map(async bsff => {
        const newStatus = await getStatus(bsff);
        if (newStatus !== bsff.status) {
          const updatedBsff = await prisma.bsff.update({
            where: { id: bsff.id },
            data: { status: newStatus }
          });
          enqueueBsdToIndex(updatedBsff.id);
          return updatedBsff;
        }
        return bsff;
      })
    );

    return updatedBsff;
  },
  OPERATION: async (
    { id, input: { date, author, securityCode, packagingId } },
    user,
    existingBsff
  ) => {
    await checkIsAllowed(
      existingBsff.destinationCompanySiret,
      user,
      securityCode
    );
    await validateAfterReception(existingBsff as any);

    const updatedBsff = await runInTransaction(async transaction => {
      if (packagingId) {
        const packaging = existingBsff.packagings.find(
          p => p.id === packagingId
        );
        if (!packaging) {
          throw new UserInputError(
            `Le contenant ${packagingId} n'apparait pas sur le BSFF n°${id}`
          );
        }

        await validateBeforeOperation(packaging);

        await transaction.bsffPackaging.update({
          where: { id: packagingId },
          data: {
            operationSignatureDate: date,
            operationSignatureAuthor: author
          }
        });
      } else {
        await Promise.all(
          existingBsff.packagings.map(p => validateBeforeOperation(p))
        );
        // sign for all packagings
        await transaction.bsffPackaging.updateMany({
          where: { bsffId: id },
          data: {
            operationSignatureDate: date,
            operationSignatureAuthor: author
          }
        });
      }

      const packagings = await transaction.bsff
        .findUnique({
          where: { id }
        })
        .packagings({ include: { previousPackagings: true } });

      const status = await getStatus({ ...existingBsff, packagings });

      return transaction.bsff.update({
        where: { id },
        data: { status },
        include: {
          packagings: { include: { previousPackagings: true } }
        }
      });
    });

    // TODO updating previous BSFFs status should be done in transaction

    const finalOperationPackagings = updatedBsff.packagings.filter(p =>
      isFinalOperation(p.operationCode, p.operationNoTraceability)
    );

    const previousPackagings = await getPreviousPackagings(
      finalOperationPackagings.map(p => p.id)
    );

    const bsffs = await prisma.bsff.findMany({
      where: { id: { in: previousPackagings.map(p => p.bsffId) } },
      include: { packagings: true }
    });

    await Promise.all(
      bsffs.map(async bsff => {
        const newStatus = await getStatus(bsff);
        if (newStatus !== bsff.status) {
          const updatedBsff = await prisma.bsff.update({
            where: { id: bsff.id },
            data: { status: newStatus }
          });
          enqueueBsdToIndex(updatedBsff.id);
          return updatedBsff;
        }
        return bsff;
      })
    );

    return updatedBsff;
  }
};

const signBsff: MutationResolvers["signBsff"] = async (
  _,
  { id, input },
  context
) => {
  const user = checkIsAuthenticated(context);
  const existingBsff = await getBsffOrNotFound({ id });
  const sign = signatures[input.type];
  const updatedBsff = await sign(
    { id, input: { ...input, date: new Date(input.date ?? Date.now()) } },
    user,
    existingBsff
  );

  await indexBsff(updatedBsff, context);

  return expandBsffFromDB(updatedBsff);
};

export default signBsff;
