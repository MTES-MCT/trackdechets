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
import { getTransporterCompanyOrgId } from "../../../common/constants/companySearchHelpers";
import {
  getBsffPackagingRepository,
  getBsffRepository
} from "../../repository";
import { checkCanSignFor } from "../../permissions";

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
    await checkCanSignFor(
      user,
      existingBsff.emitterCompanySiret!,
      securityCode
    );

    await validateBeforeEmission(existingBsff);

    const { update: updateBsff } = getBsffRepository(user);

    return updateBsff({
      where: { id },
      data: {
        status: BsffStatus.SIGNED_BY_EMITTER,
        emitterEmissionSignatureDate: date,
        emitterEmissionSignatureAuthor: author
      }
    });
  },
  TRANSPORT: async (
    { id, input: { date, author, securityCode } },
    user,
    existingBsff
  ) => {
    await checkCanSignFor(
      user,
      getTransporterCompanyOrgId(existingBsff)!,
      securityCode
    );

    await validateBeforeTransport(existingBsff);

    const { update: updateBsff } = getBsffRepository(user);

    return updateBsff({
      where: { id },
      data: {
        status: BsffStatus.SENT,
        transporterTransportSignatureDate: date,
        transporterTransportSignatureAuthor: author
      }
    });
  },
  RECEPTION: async (
    { id, input: { date, author, securityCode } },
    user,
    existingBsff
  ) => {
    await checkCanSignFor(
      user,
      existingBsff.destinationCompanySiret!,
      securityCode
    );
    await validateBeforeReception(existingBsff);

    const { update: updateBsff } = getBsffRepository(user);

    return updateBsff({
      where: { id },
      data: {
        status: BsffStatus.RECEIVED,
        destinationReceptionSignatureDate: date,
        destinationReceptionSignatureAuthor: author
      }
    });
  },
  ACCEPTATION: async (
    { id, input: { date, author, securityCode, packagingId } },
    user,
    existingBsff
  ) => {
    await checkCanSignFor(
      user,
      existingBsff.destinationCompanySiret!,
      securityCode
    );

    await validateAfterReception(existingBsff);

    return runInTransaction(async transaction => {
      const {
        update: updateBsffPackaging,
        updateMany: updateManyBsffPackaging,
        findMany: findManyBsffPackaging
      } = getBsffPackagingRepository(user, transaction);

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

        await updateBsffPackaging({
          where: { id: packagingId },
          data: {
            acceptationSignatureDate: date,
            acceptationSignatureAuthor: author,
            // set acceptation waste code if it was not set explicitly
            acceptationWasteCode:
              packaging.acceptationWasteCode ?? existingBsff.wasteCode,
            ...(packaging.acceptationStatus === "REFUSED"
              ? { previousPackagings: { set: [] } }
              : {})
          }
        });
      } else {
        await Promise.all(
          existingBsff.packagings.map(p => validateBeforeAcceptation(p))
        );

        // sign for all packagings
        await updateManyBsffPackaging({
          where: { bsffId: id },
          data: {
            acceptationSignatureDate: date,
            acceptationSignatureAuthor: author
          }
        });

        // set acceptation waste code if it was not set explicitly
        await updateManyBsffPackaging({
          where: { bsffId: id, acceptationWasteCode: null },
          data: {
            acceptationWasteCode: existingBsff.wasteCode
          }
        });

        const refusedPackagings = await findManyBsffPackaging({
          where: {
            bsffId: id,
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
          where: { id }
        })) ?? [];

      const status = await getStatus(
        { ...existingBsff, packagings },
        {
          user,
          prisma: transaction
        }
      );

      const updatedBsff = await updateBsff({ where: { id }, data: { status } });

      return updatedBsff;
    });
  },
  OPERATION: async (
    { id, input: { date, author, securityCode, packagingId } },
    user,
    existingBsff
  ) => {
    await checkCanSignFor(
      user,
      existingBsff.destinationCompanySiret!,
      securityCode
    );
    await validateAfterReception(existingBsff);

    return runInTransaction(async transaction => {
      const {
        updateMany: updateManyBsffPackaging,
        update: updateBsffPackaging,
        findPreviousPackagings
      } = getBsffPackagingRepository(user, transaction);
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

        await updateBsffPackaging({
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
        await updateManyBsffPackaging({
          where: { bsffId: id },
          data: {
            operationSignatureDate: date,
            operationSignatureAuthor: author
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
          where: { id }
        })) ?? [];

      const status = await getStatus(
        { ...existingBsff, packagings },
        { user, prisma: transaction }
      );

      const updatedBsff = await updateBsff({
        where: { id },
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

  return expandBsffFromDB(updatedBsff);
};

export default signBsff;
