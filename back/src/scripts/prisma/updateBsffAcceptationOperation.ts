import prisma from "../../prisma";
import { Decimal } from "decimal.js-light";

export default async function updateBsffAcceptationOperation() {
  const take = 1000;

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
      if (bsff.packagings?.length) {
        await prisma.bsffPackaging.updateMany({
          where: { id: { in: bsff.packagings.map(p => p.id) } },
          data: {
            acceptationDate: bsff.destinationReceptionDate,
            acceptationStatus: bsff.destinationReceptionAcceptationStatus,
            acceptationWeight: !!bsff.destinationReceptionWeight
              ? new Decimal(bsff.destinationReceptionWeight)
                  .div(bsff.packagings.length)
                  .toNumber()
              : bsff.destinationReceptionWeight,
            acceptationSignatureDate: bsff.destinationReceptionSignatureDate,
            acceptationSignatureAuthor:
              bsff.destinationReceptionSignatureAuthor,
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

        if (bsff.forwardedIn) {
          for (const packaging of bsff.packagings) {
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
        } else if (bsff.groupedIn) {
          for (const packaging of bsff.packagings) {
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
        } else if (bsff.repackagedIn) {
          const nextPackaging = bsff.repackagedIn.packagings[0];
          if (nextPackaging) {
            await prisma.bsffPackaging.updateMany({
              where: { id: { in: bsff.packagings.map(p => p.id) } },
              data: {
                nextPackagingId: nextPackaging.id
              }
            });
          } else {
            console.log(
              `BSFF ${bsff.id} (Reconditionnement) has no packagings`
            );
          }
        }
      }
    }

    console.log(`Done processing ${skip + take} BSFFs...`);

    return inner(skip + take, [...bsffIds, ...bsffs.map(bsff => bsff.id)]);
  }

  return inner(0, []);
}
