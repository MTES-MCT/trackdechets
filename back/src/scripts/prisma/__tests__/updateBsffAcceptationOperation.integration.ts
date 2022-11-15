import { WasteAcceptationStatus } from "@prisma/client";
import { resetDatabase } from "../../../../integration-tests/helper";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import prisma from "../../../prisma";
import updateBsffAcceptationOperation from "../updateBsffAcceptationOperation";

describe("updateBsffPackagingOperationAcceptation", () => {
  afterEach(resetDatabase);

  it("should copy acceptation and operation information at the packaging level", async () => {
    const bsff = await prisma.bsff.create({
      data: {
        type: "COLLECTE_PETITES_QUANTITES",
        id: getReadableId(ReadableIdPrefix.FF),
        wasteCode: "14 06 01*",
        wasteDescription: "R410A",
        packagings: {
          create: [
            { name: "Bouteille", numero: "cont1", weight: 1, volume: 1 },
            { name: "Bouteille", numero: "cont2", weight: 1, volume: 1 }
          ]
        },
        destinationReceptionAcceptationStatus: WasteAcceptationStatus.ACCEPTED,
        destinationReceptionDate: new Date("2022-10-01"),
        destinationReceptionRefusalReason: "raison du refus",
        destinationReceptionSignatureAuthor: "John Snow",
        destinationReceptionSignatureDate: new Date("2022-10-02"),
        destinationReceptionWeight: 1.5,
        destinationOperationCode: "R2",
        destinationOperationSignatureDate: new Date("2022-10-03"),
        destinationOperationSignatureAuthor: "Arya Stark",
        destinationOperationNextDestinationCompanyName: "Incinérateur",
        destinationOperationNextDestinationCompanySiret: "11111111111111",
        destinationOperationNextDestinationCompanyAddress: "1 rue des héros",
        destinationOperationNextDestinationCompanyContact: "Tyrion Lannister",
        destinationOperationNextDestinationCompanyMail:
          "tyryon@trackdechets.fr",
        destinationOperationNextDestinationCompanyPhone: "00 00 00 00 00",
        destinationOperationNextDestinationCompanyVatNumber: "FRXXX"
      }
    });
    await updateBsffAcceptationOperation();
    const updatedBsff = await prisma.bsff.findUnique({
      where: { id: bsff.id },
      include: { packagings: true }
    });
    for (const packaging of updatedBsff.packagings) {
      expect(packaging.acceptationDate).toEqual(bsff.destinationReceptionDate);
      expect(packaging.acceptationRefusalReason).toEqual(
        bsff.destinationReceptionRefusalReason
      );
      expect(packaging.acceptationSignatureAuthor).toEqual(
        bsff.destinationReceptionSignatureAuthor
      );
      expect(packaging.acceptationSignatureDate).toEqual(
        bsff.destinationReceptionSignatureDate
      );
      expect(packaging.acceptationStatus).toEqual(
        bsff.destinationReceptionAcceptationStatus
      );
      expect(packaging.acceptationWasteCode).toEqual(bsff.wasteCode);
      expect(packaging.acceptationWasteDescription).toEqual(
        bsff.wasteDescription
      );
      expect(packaging.acceptationWeight).toEqual(0.75);
      expect(packaging.operationCode).toEqual(bsff.destinationOperationCode);
      expect(packaging.operationDate).toEqual(
        bsff.destinationOperationSignatureDate
      );
      expect(packaging.operationDescription).toEqual("");
      expect(packaging.operationNextDestinationCompanyAddress).toEqual(
        bsff.destinationOperationNextDestinationCompanyAddress
      );
      expect(packaging.operationNextDestinationCompanyContact).toEqual(
        bsff.destinationOperationNextDestinationCompanyContact
      );
      expect(packaging.operationNextDestinationCompanyMail).toEqual(
        bsff.destinationOperationNextDestinationCompanyMail
      );
      expect(packaging.operationNextDestinationCompanyName).toEqual(
        bsff.destinationOperationNextDestinationCompanyName
      );
      expect(packaging.operationNextDestinationCompanyPhone).toEqual(
        bsff.destinationOperationNextDestinationCompanyPhone
      );
      expect(packaging.operationNextDestinationCompanySiret).toEqual(
        bsff.destinationOperationNextDestinationCompanySiret
      );
      expect(packaging.operationNextDestinationCompanyVatNumber).toEqual(
        bsff.destinationOperationNextDestinationCompanyVatNumber
      );
    }
  });

  it("should migrate forwarding info", async () => {
    const bsff = await prisma.bsff.create({
      data: {
        type: "COLLECTE_PETITES_QUANTITES",
        id: getReadableId(ReadableIdPrefix.FF),
        wasteCode: "14 06 01*",
        wasteDescription: "R410A",
        packagings: {
          create: [
            { name: "Bouteille", numero: "cont1", weight: 1, volume: 1 },
            { name: "Bouteille", numero: "cont2", weight: 1, volume: 1 }
          ]
        }
      }
    });
    const nextBsff = await prisma.bsff.create({
      data: {
        type: "REEXPEDITION",
        id: getReadableId(ReadableIdPrefix.FF),
        wasteCode: "14 06 01*",
        wasteDescription: "R410A",
        packagings: {
          create: [
            { name: "Bouteille", numero: "cont1", weight: 1, volume: 1 },
            { name: "Bouteille", numero: "cont2", weight: 1, volume: 1 }
          ]
        },
        forwarding: { connect: { id: bsff.id } }
      },
      include: { packagings: { orderBy: { numero: "asc" } } }
    });

    await updateBsffAcceptationOperation();

    const updatedBsff = await prisma.bsff.findFirst({
      where: { id: bsff.id },
      include: {
        packagings: {
          include: { nextPackaging: true },
          orderBy: { numero: "asc" }
        }
      }
    });

    expect(updatedBsff.packagings[0].nextPackagingId).toEqual(
      nextBsff.packagings[0].id
    );
    expect(updatedBsff.packagings[1].nextPackagingId).toEqual(
      nextBsff.packagings[1].id
    );
  });

  it("should migrate grouping info", async () => {
    const bsff1 = await prisma.bsff.create({
      data: {
        type: "COLLECTE_PETITES_QUANTITES",
        id: getReadableId(ReadableIdPrefix.FF),
        wasteCode: "14 06 01*",
        wasteDescription: "R410A",
        packagings: {
          create: [{ name: "Bouteille", numero: "cont1", weight: 1, volume: 1 }]
        }
      }
    });
    const bsff2 = await prisma.bsff.create({
      data: {
        type: "COLLECTE_PETITES_QUANTITES",
        id: getReadableId(ReadableIdPrefix.FF),
        wasteCode: "14 06 01*",
        wasteDescription: "R410A",
        packagings: {
          create: [{ name: "Bouteille", numero: "cont2", weight: 1, volume: 1 }]
        }
      }
    });
    const nextBsff = await prisma.bsff.create({
      data: {
        type: "GROUPEMENT",
        id: getReadableId(ReadableIdPrefix.FF),
        wasteCode: "14 06 01*",
        wasteDescription: "R410A",
        packagings: {
          create: [
            { name: "Bouteille", numero: "cont1", weight: 1, volume: 1 },
            { name: "Bouteille", numero: "cont2", weight: 1, volume: 1 }
          ]
        },
        grouping: { connect: [{ id: bsff1.id }, { id: bsff2.id }] }
      },
      include: { packagings: { orderBy: { numero: "asc" } } }
    });

    await updateBsffAcceptationOperation();

    const updatedBsff1 = await prisma.bsff.findFirst({
      where: { id: bsff1.id },
      include: {
        packagings: {
          include: { nextPackaging: true }
        }
      }
    });

    expect(updatedBsff1.packagings[0].nextPackagingId).toEqual(
      nextBsff.packagings[0].id
    );

    const updatedBsff2 = await prisma.bsff.findFirst({
      where: { id: bsff2.id },
      include: { packagings: { include: { nextPackaging: true } } }
    });

    expect(updatedBsff2.packagings[0].nextPackagingId).toEqual(
      nextBsff.packagings[1].id
    );
  });

  it("should migrate repackaging info", async () => {
    const bsff1 = await prisma.bsff.create({
      data: {
        type: "COLLECTE_PETITES_QUANTITES",
        id: getReadableId(ReadableIdPrefix.FF),
        wasteCode: "14 06 01*",
        wasteDescription: "R410A",
        packagings: {
          create: [{ name: "Bouteille", numero: "cont1", weight: 1, volume: 1 }]
        }
      }
    });
    const bsff2 = await prisma.bsff.create({
      data: {
        type: "COLLECTE_PETITES_QUANTITES",
        id: getReadableId(ReadableIdPrefix.FF),
        wasteCode: "14 06 01*",
        wasteDescription: "R410A",
        packagings: {
          create: [{ name: "Bouteille", numero: "cont2", weight: 1, volume: 1 }]
        }
      }
    });
    const nextBsff = await prisma.bsff.create({
      data: {
        type: "RECONDITIONNEMENT",
        id: getReadableId(ReadableIdPrefix.FF),
        wasteCode: "14 06 01*",
        wasteDescription: "R410A",
        packagings: {
          create: [{ name: "Citerne", numero: "cont2", weight: 1, volume: 1 }]
        },
        repackaging: { connect: [{ id: bsff1.id }, { id: bsff2.id }] }
      },
      include: { packagings: { orderBy: { numero: "asc" } } }
    });

    await updateBsffAcceptationOperation();

    const updatedBsff1 = await prisma.bsff.findFirst({
      where: { id: bsff1.id },
      include: { packagings: { include: { nextPackaging: true } } }
    });

    expect(updatedBsff1.packagings[0].nextPackagingId).toEqual(
      nextBsff.packagings[0].id
    );

    const updatedBsff2 = await prisma.bsff.findFirst({
      where: { id: bsff1.id },
      include: { packagings: { include: { nextPackaging: true } } }
    });

    expect(updatedBsff2.packagings[0].nextPackagingId).toEqual(
      nextBsff.packagings[0].id
    );
  });
});
