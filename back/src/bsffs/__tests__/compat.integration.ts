import { resetDatabase } from "../../../integration-tests/helper";
import prisma from "../../prisma";
import getReadableId, { ReadableIdPrefix } from "../../forms/readableId";
import { BsffStatus, BsffType, WasteAcceptationStatus } from "@prisma/client";
import { getStatus } from "../compat";

describe("getStatus", () => {
  afterAll(resetDatabase);

  it("should return PROCESSED when all packagings are processed", async () => {
    const bsff = await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        type: BsffType.TRACER_FLUIDE,
        packagings: {
          create: [
            {
              name: "Bouteille",
              numero: "cont1",
              weight: 1,
              volume: 1,
              operationSignatureDate: new Date(),
              operationCode: "R2" // code de traitement final
            },
            {
              name: "Bouteille",
              numero: "cont2",
              weight: 1,
              volume: 1,
              operationSignatureDate: new Date(),
              operationCode: "R2" // code de traitement final
            }
          ]
        }
      },
      include: { packagings: true }
    });
    const status = await getStatus(bsff);
    expect(status).toEqual(BsffStatus.PROCESSED);
  });

  it("should return PROCESSED when all packagings are no traceability", async () => {
    const bsff = await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        type: BsffType.TRACER_FLUIDE,
        packagings: {
          create: [
            {
              name: "Bouteille",
              numero: "cont1",
              weight: 1,
              volume: 1,
              operationSignatureDate: new Date(),
              operationCode: "R12", // code de traitement non final
              operationNoTraceability: true
            },
            {
              name: "Bouteille",
              numero: "cont2",
              weight: 1,
              volume: 1,
              operationSignatureDate: new Date(),
              operationCode: "R12", // code de traitement non final
              operationNoTraceability: true
            }
          ]
        }
      },
      include: { packagings: true }
    });
    const status = await getStatus(bsff);
    expect(status).toEqual(BsffStatus.PROCESSED);
  });

  it("should return INTERMEDIATELY_PROCESSED when all packagings are intermediately processed", async () => {
    const bsff = await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        type: BsffType.TRACER_FLUIDE,
        packagings: {
          create: [
            {
              name: "Bouteille",
              numero: "cont1",
              weight: 1,
              volume: 1,
              operationSignatureDate: new Date(),
              operationCode: "R12" // code de traitement non final
            },
            {
              name: "Bouteille",
              numero: "cont2",
              weight: 1,
              volume: 1,
              operationSignatureDate: new Date(),
              operationCode: "D13" // code de traitement non final
            }
          ]
        }
      },
      include: { packagings: true }
    });
    const status = await getStatus(bsff);
    expect(status).toEqual(BsffStatus.INTERMEDIATELY_PROCESSED);
  });
  it("should return INTERMEDIATELY_PROCESSED when some packagings are processed and others are intermediately processed", async () => {
    const bsff = await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        type: BsffType.TRACER_FLUIDE,
        packagings: {
          create: [
            {
              name: "Bouteille",
              numero: "cont1",
              weight: 1,
              volume: 1,
              operationSignatureDate: new Date(),
              operationCode: "R2" // code de traitement final
            },
            {
              name: "Bouteille",
              numero: "cont2",
              weight: 1,
              volume: 1,
              operationSignatureDate: new Date(),
              operationCode: "D13" // code de traitement non final
            }
          ]
        }
      },
      include: { packagings: true }
    });
    const status = await getStatus(bsff);
    expect(status).toEqual(BsffStatus.INTERMEDIATELY_PROCESSED);
  });
  it("should return ACCEPTED when all packagings are accepted", async () => {
    const bsff = await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        type: BsffType.TRACER_FLUIDE,
        packagings: {
          create: [
            {
              name: "Bouteille",
              numero: "cont1",
              weight: 1,
              volume: 1,
              acceptationSignatureDate: new Date(),
              acceptationStatus: WasteAcceptationStatus.ACCEPTED
            },
            {
              name: "Bouteille",
              numero: "cont2",
              weight: 1,
              volume: 1,
              acceptationSignatureDate: new Date(),
              acceptationStatus: WasteAcceptationStatus.ACCEPTED
            }
          ]
        }
      },
      include: { packagings: true }
    });
    const status = await getStatus(bsff);
    expect(status).toEqual(BsffStatus.ACCEPTED);
  });
  it("should return REFUSED when all packagings are refused", async () => {
    const bsff = await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        type: BsffType.TRACER_FLUIDE,
        packagings: {
          create: [
            {
              name: "Bouteille",
              numero: "cont1",
              weight: 1,
              volume: 1,
              acceptationSignatureDate: new Date(),
              acceptationStatus: WasteAcceptationStatus.REFUSED,
              acceptationRefusalReason: "Parce que"
            },
            {
              name: "Bouteille",
              numero: "cont2",
              weight: 1,
              volume: 1,
              acceptationSignatureDate: new Date(),
              acceptationStatus: WasteAcceptationStatus.REFUSED,
              acceptationRefusalReason: "Parce que"
            }
          ]
        }
      },
      include: { packagings: true }
    });
    const status = await getStatus(bsff);
    expect(status).toEqual(BsffStatus.REFUSED);
  });
  it("should return PARTIALLY_REFUSED when some packagings are refused and other are accepted", async () => {
    const bsff = await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        type: BsffType.TRACER_FLUIDE,
        packagings: {
          create: [
            {
              name: "Bouteille",
              numero: "cont1",
              weight: 1,
              volume: 1,
              acceptationSignatureDate: new Date(),
              acceptationStatus: WasteAcceptationStatus.REFUSED,
              acceptationRefusalReason: "Parce que"
            },
            {
              name: "Bouteille",
              numero: "cont2",
              weight: 1,
              volume: 1,
              acceptationSignatureDate: new Date(),
              acceptationStatus: WasteAcceptationStatus.ACCEPTED
            }
          ]
        }
      },
      include: { packagings: true }
    });
    const status = await getStatus(bsff);
    expect(status).toEqual(BsffStatus.PARTIALLY_REFUSED);
  });
  it("should return PROCESSED when some packagings are refused and other are processed", async () => {
    const bsff = await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        type: BsffType.TRACER_FLUIDE,
        packagings: {
          create: [
            {
              name: "Bouteille",
              numero: "cont1",
              weight: 1,
              volume: 1,
              acceptationSignatureDate: new Date(),
              acceptationStatus: WasteAcceptationStatus.REFUSED,
              acceptationRefusalReason: "Parce que"
            },
            {
              name: "Bouteille",
              numero: "cont2",
              weight: 1,
              volume: 1,
              operationSignatureDate: new Date(),
              operationCode: "R2" // code de traitement final
            }
          ]
        }
      },
      include: { packagings: true }
    });
    const status = await getStatus(bsff);
    expect(status).toEqual(BsffStatus.PROCESSED);
  });
  it("should return INTERMEDIATELY_PROCESSED when some packagings are refused and other are intermediately processed", async () => {
    const bsff = await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        type: BsffType.TRACER_FLUIDE,
        packagings: {
          create: [
            {
              name: "Bouteille",
              numero: "cont1",
              weight: 1,
              volume: 1,
              acceptationSignatureDate: new Date(),
              acceptationStatus: WasteAcceptationStatus.REFUSED,
              acceptationRefusalReason: "Parce que"
            },
            {
              name: "Bouteille",
              numero: "cont2",
              weight: 1,
              volume: 1,
              operationSignatureDate: new Date(),
              operationCode: "R12" // code de traitement non final
            }
          ]
        }
      },
      include: { packagings: true }
    });
    const status = await getStatus(bsff);
    expect(status).toEqual(BsffStatus.INTERMEDIATELY_PROCESSED);
  });

  it("should return PROCESSED when all next packagings are processed", async () => {
    const bsff = await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        type: BsffType.TRACER_FLUIDE,
        packagings: {
          create: [
            {
              name: "Bouteille",
              numero: "cont1",
              weight: 1,
              volume: 1,
              acceptationSignatureDate: new Date(),
              acceptationStatus: WasteAcceptationStatus.REFUSED,
              acceptationRefusalReason: "Parce que"
            },
            {
              name: "Bouteille",
              numero: "cont2",
              weight: 1,
              volume: 1,
              operationSignatureDate: new Date(),
              operationCode: "R12" // code de traitement non final
            }
          ]
        }
      },
      include: { packagings: true }
    });

    await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        type: BsffType.GROUPEMENT,
        packagings: {
          create: [
            {
              name: "Bouteille",
              numero: "cont3",
              weight: 2,
              volume: 2,
              operationSignatureDate: new Date(),
              operationCode: "R2",
              previousPackagings: {
                connect: bsff.packagings.map(p => ({ id: p.id }))
              }
            }
          ]
        }
      },
      include: { packagings: true }
    });

    const status = await getStatus(bsff);
    expect(status).toEqual(BsffStatus.PROCESSED);
  });

  it("should return PROCESSED when all next packagings are no traceability", async () => {
    const bsff = await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        type: BsffType.TRACER_FLUIDE,
        packagings: {
          create: [
            {
              name: "Bouteille",
              numero: "cont1",
              weight: 1,
              volume: 1,
              acceptationSignatureDate: new Date(),
              acceptationStatus: WasteAcceptationStatus.REFUSED,
              acceptationRefusalReason: "Parce que"
            },
            {
              name: "Bouteille",
              numero: "cont2",
              weight: 1,
              volume: 1,
              operationSignatureDate: new Date(),
              operationCode: "R12" // code de traitement non final
            }
          ]
        }
      },
      include: { packagings: true }
    });

    await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        type: BsffType.GROUPEMENT,
        packagings: {
          create: [
            {
              name: "Bouteille",
              numero: "cont3",
              weight: 2,
              volume: 2,
              operationSignatureDate: new Date(),
              operationCode: "R12",
              operationNoTraceability: true,
              previousPackagings: {
                connect: bsff.packagings.map(p => ({ id: p.id }))
              }
            }
          ]
        }
      },
      include: { packagings: true }
    });

    const status = await getStatus(bsff);
    expect(status).toEqual(BsffStatus.PROCESSED);
  });
});
