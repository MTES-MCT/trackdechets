import prisma from "../../prisma";
import { Decimal } from "decimal.js-light";
import { Bsff, BsffPackaging } from "@prisma/client";

export default async function updateBsffAcceptationOperation() {
  const take = 1000;

  const count = await prisma.bsff.count();

  console.log(`There are ${count} BSFF to migrate`);

  function migrateBsffAcceptationOperation(
    bsff: Bsff & { packagings: BsffPackaging[] }
  ) {
    return prisma.bsffPackaging.updateMany({
      where: {
        id: { in: bsff.packagings.map(p => p.id) },
        acceptationDate: null
      },
      data: {
        acceptationDate: bsff.destinationReceptionDate,
        acceptationStatus: bsff.destinationReceptionAcceptationStatus,
        acceptationWeight: !!bsff.destinationReceptionWeight
          ? new Decimal(bsff.destinationReceptionWeight)
              .div(bsff.packagings.length)
              .toNumber()
          : bsff.destinationReceptionWeight,
        acceptationSignatureDate: bsff.destinationReceptionSignatureDate,
        acceptationSignatureAuthor: bsff.destinationReceptionSignatureAuthor,
        acceptationRefusalReason: bsff.destinationReceptionRefusalReason,
        acceptationWasteCode: bsff.wasteCode,
        acceptationWasteDescription: bsff.wasteDescription,
        operationCode: bsff.destinationOperationCode,
        operationDescription: "",
        operationDate: bsff.destinationOperationSignatureDate,
        operationSignatureDate: bsff.destinationOperationSignatureDate,
        operationSignatureAuthor: bsff.destinationOperationSignatureAuthor,
        operationNextDestinationCompanyName:
          bsff.destinationOperationNextDestinationCompanyName,
        operationNextDestinationCompanySiret:
          bsff.destinationOperationNextDestinationCompanySiret,
        operationNextDestinationCompanyAddress:
          bsff.destinationOperationNextDestinationCompanyAddress,
        operationNextDestinationCompanyContact:
          bsff.destinationOperationNextDestinationCompanyContact,
        operationNextDestinationCompanyMail:
          bsff.destinationOperationNextDestinationCompanyMail,
        operationNextDestinationCompanyPhone:
          bsff.destinationOperationNextDestinationCompanyPhone,
        operationNextDestinationCompanyVatNumber:
          bsff.destinationOperationNextDestinationCompanyVatNumber,
        operationNoTraceability: false
      }
    });
  }

  async function migrateForwardedIn(
    bsff: Bsff & { packagings: BsffPackaging[] } & {
      forwardedIn: Bsff & { packagings: BsffPackaging[] };
    }
  ) {
    for (const packaging of bsff.packagings) {
      if (!packaging.nextPackagingId) {
        const nextPackaging = bsff.forwardedIn.packagings.find(
          p => p.numero === packaging.numero
        );
        if (nextPackaging) {
          await prisma.bsffPackaging.update({
            where: { id: packaging.id },
            data: {
              nextPackaging: { connect: { id: nextPackaging.id } }
            }
          });
        } else {
          console.log(
            `Could not resolve next packaging of packaging ${packaging.id} on BSFF ${bsff.id} (Réexpédition)`
          );
        }
      }
    }
  }

  async function migrateGroupedIn(
    bsff: Bsff & { packagings: BsffPackaging[] } & {
      groupedIn: Bsff & { packagings: BsffPackaging[] };
    }
  ) {
    for (const packaging of bsff.packagings) {
      if (!packaging.nextPackagingId) {
        const nextPackaging = bsff.groupedIn.packagings.find(
          p => p.numero === packaging.numero
        );
        if (nextPackaging) {
          await prisma.bsffPackaging.update({
            where: { id: packaging.id },
            data: {
              nextPackaging: { connect: { id: nextPackaging.id } }
            }
          });
        } else {
          console.log(
            `Could not resolve next packaging of packaging ${packaging.id} on BSFF ${bsff.id} (Groupement)`
          );
        }
      }
    }
  }

  async function migrateRepackedIn(
    bsff: Bsff & { packagings: BsffPackaging[] } & {
      repackagedIn: Bsff & { packagings: BsffPackaging[] };
    }
  ) {
    const nextPackaging = bsff.repackagedIn.packagings[0];
    if (nextPackaging) {
      await prisma.bsffPackaging.updateMany({
        where: {
          id: { in: bsff.packagings.map(p => p.id) },
          nextPackagingId: null
        },
        data: {
          nextPackagingId: nextPackaging.id
        }
      });
    } else {
      console.log(`BSFF ${bsff.id} (Reconditionnement) has no packagings`);
    }
  }

  async function inner(skip: number, bsffIds: string[]) {
    const bsffs = await prisma.bsff.findMany({
      orderBy: { createdAt: "asc" },
      skip,
      take,
      include: {
        packagings: true,
        forwardedIn: { include: { packagings: true } },
        repackagedIn: { include: { packagings: true } },
        groupedIn: { include: { packagings: true } }
      }
    });

    if (bsffs.length === 0) {
      return bsffIds;
    }

    for (const bsff of bsffs) {
      // update acceptation and operation
      if (bsff.packagings?.length && !!bsff.destinationReceptionDate) {
        await migrateBsffAcceptationOperation(bsff);
      }

      if (bsff.forwardedIn) {
        await migrateForwardedIn(bsff);
      } else if (bsff.groupedIn) {
        await migrateGroupedIn(bsff);
      } else if (bsff.repackagedIn) {
        await migrateRepackedIn(bsff);
      }
    }

    console.log(`Done processing ${skip + take} BSFFs...`);

    return inner(skip + take, [...bsffIds, ...bsffs.map(bsff => bsff.id)]);
  }

  return inner(0, []);
}
