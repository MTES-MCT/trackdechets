import { resetDatabase } from "../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import getReadableId, { ReadableIdPrefix } from "../../forms/readableId";
import {
  BsffPackagingType,
  BsffStatus,
  BsffType,
  WasteAcceptationStatus
} from "@td/prisma";
import { getStatus, toBsffDestination } from "../compat";

describe("toBsffDestination", () => {
  afterAll(resetDatabase);

  test("when packagings are not yet accepted", async () => {
    const bsff = await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        type: BsffType.TRACER_FLUIDE,
        packagings: {
          create: [
            {
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont1",
              emissionNumero: "cont1",
              weight: 1,
              volume: 1
            },
            {
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont2",
              emissionNumero: "cont2",
              weight: 1,
              volume: 1
            }
          ]
        }
      },
      include: { packagings: true }
    });
    const destination = toBsffDestination(bsff.packagings);
    expect(destination).toEqual(
      expect.objectContaining({
        receptionAcceptationStatus: null,
        receptionWeight: null,
        receptionRefusalReason: null,
        operationCode: null,
        operationDate: null
      })
    );
  });

  test("when all packagings are accepted", async () => {
    const bsff = await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        type: BsffType.TRACER_FLUIDE,
        packagings: {
          create: [
            {
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont1",
              emissionNumero: "cont1",
              weight: 1,
              volume: 1,
              acceptationSignatureDate: new Date(),
              acceptationWeight: 2,
              acceptationStatus: WasteAcceptationStatus.ACCEPTED
            },
            {
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont2",
              emissionNumero: "cont2",
              weight: 1,
              volume: 1,
              acceptationSignatureDate: new Date(),
              acceptationWeight: 2,
              acceptationStatus: WasteAcceptationStatus.ACCEPTED
            }
          ]
        }
      },
      include: { packagings: true }
    });
    const destination = toBsffDestination(bsff.packagings);
    expect(destination).toEqual(
      expect.objectContaining({
        receptionAcceptationStatus: WasteAcceptationStatus.ACCEPTED,
        receptionWeight: 4,
        receptionRefusalReason: null,
        operationCode: null,
        operationDate: null
      })
    );
  });

  test("when all packagings are refused", async () => {
    const bsff = await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        type: BsffType.TRACER_FLUIDE,
        packagings: {
          create: [
            {
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont1",
              emissionNumero: "cont1",
              weight: 1,
              volume: 1,
              acceptationSignatureDate: new Date(),
              acceptationWeight: 0,
              acceptationStatus: WasteAcceptationStatus.REFUSED,
              acceptationRefusalReason: "non conforme"
            },
            {
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont2",
              emissionNumero: "cont2",
              weight: 1,
              volume: 1,
              acceptationSignatureDate: new Date(),
              acceptationWeight: 0,
              acceptationStatus: WasteAcceptationStatus.REFUSED,
              acceptationRefusalReason: "déchiré"
            }
          ]
        }
      },
      include: { packagings: true }
    });
    const destination = toBsffDestination(bsff.packagings);
    expect(destination).toEqual(
      expect.objectContaining({
        receptionAcceptationStatus: WasteAcceptationStatus.REFUSED,
        receptionWeight: 0,
        receptionRefusalReason: "cont1 : non conforme\ncont2 : déchiré",
        operationCode: null,
        operationDate: null
      })
    );
  });

  test("when some packagings are refused and other accepted", async () => {
    const bsff = await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        type: BsffType.TRACER_FLUIDE,
        packagings: {
          create: [
            {
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont1",
              emissionNumero: "cont1",
              weight: 1,
              volume: 1,
              acceptationSignatureDate: new Date(),
              acceptationWeight: 0,
              acceptationStatus: WasteAcceptationStatus.REFUSED,
              acceptationRefusalReason: "non conforme"
            },
            {
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont2",
              emissionNumero: "cont2",
              weight: 1,
              volume: 1,
              acceptationSignatureDate: new Date(),
              acceptationWeight: 1,
              acceptationStatus: WasteAcceptationStatus.ACCEPTED
            }
          ]
        }
      },
      include: { packagings: true }
    });
    const destination = toBsffDestination(bsff.packagings);
    expect(destination).toEqual(
      expect.objectContaining({
        receptionAcceptationStatus: WasteAcceptationStatus.PARTIALLY_REFUSED,
        receptionWeight: 1,
        receptionRefusalReason: "cont1 : non conforme",
        operationCode: null,
        operationDate: null
      })
    );
  });

  test("when all packagings are procesed", async () => {
    const bsff = await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        type: BsffType.TRACER_FLUIDE,
        packagings: {
          create: [
            {
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont1",
              emissionNumero: "cont1",
              weight: 1,
              volume: 1,
              acceptationSignatureDate: new Date(),
              acceptationWeight: 1,
              acceptationStatus: WasteAcceptationStatus.ACCEPTED,
              operationDate: new Date("2022-10-01"),
              operationSignatureDate: new Date("2022-10-03"),
              operationCode: "R2"
            },
            {
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont2",
              emissionNumero: "cont2",
              weight: 1,
              volume: 1,
              acceptationSignatureDate: new Date(),
              acceptationWeight: 1,
              acceptationStatus: WasteAcceptationStatus.ACCEPTED,
              operationDate: new Date("2022-10-02"),
              operationSignatureDate: new Date("2022-10-03"),
              operationCode: "R2"
            },
            {
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont2",
              emissionNumero: "cont1",
              weight: 1,
              volume: 1,
              acceptationSignatureDate: new Date(),
              acceptationWeight: 1,
              acceptationStatus: WasteAcceptationStatus.ACCEPTED,
              operationDate: new Date("2022-10-03"),
              operationSignatureDate: new Date("2022-10-03"),
              operationCode: "R12"
            }
          ]
        }
      },
      include: { packagings: true }
    });
    const destination = toBsffDestination(bsff.packagings);
    expect(destination).toEqual(
      expect.objectContaining({
        receptionAcceptationStatus: WasteAcceptationStatus.ACCEPTED,
        receptionWeight: 3,
        receptionRefusalReason: null,
        operationCode: "R2 R12",
        operationDate: new Date("2022-10-03")
      })
    );
  });
});

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
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont1",
              emissionNumero: "cont1",
              weight: 1,
              volume: 1,
              operationSignatureDate: new Date(),
              operationCode: "R2" // code de traitement final
            },
            {
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont2",
              emissionNumero: "cont2",
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
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont1",
              emissionNumero: "cont1",
              weight: 1,
              volume: 1,
              operationSignatureDate: new Date(),
              operationCode: "R12", // code de traitement non final
              operationNoTraceability: true
            },
            {
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont2",
              emissionNumero: "cont1",
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
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont1",
              emissionNumero: "cont1",
              weight: 1,
              volume: 1,
              operationSignatureDate: new Date(),
              operationCode: "R12" // code de traitement non final
            },
            {
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont2",
              emissionNumero: "cont1",
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
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont1",
              emissionNumero: "cont1",
              weight: 1,
              volume: 1,
              operationSignatureDate: new Date(),
              operationCode: "R2" // code de traitement final
            },
            {
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont2",
              emissionNumero: "cont1",
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
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont1",
              emissionNumero: "cont1",
              weight: 1,
              volume: 1,
              acceptationSignatureDate: new Date(),
              acceptationStatus: WasteAcceptationStatus.ACCEPTED
            },
            {
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont2",
              emissionNumero: "cont1",
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
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont1",
              emissionNumero: "cont1",
              weight: 1,
              volume: 1,
              acceptationSignatureDate: new Date(),
              acceptationStatus: WasteAcceptationStatus.REFUSED,
              acceptationRefusalReason: "Parce que"
            },
            {
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont2",
              emissionNumero: "cont2",
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
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont1",
              emissionNumero: "cont1",
              weight: 1,
              volume: 1,
              acceptationSignatureDate: new Date(),
              acceptationStatus: WasteAcceptationStatus.REFUSED,
              acceptationRefusalReason: "Parce que"
            },
            {
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont2",
              emissionNumero: "cont2",
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
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont1",
              emissionNumero: "cont1",
              weight: 1,
              volume: 1,
              acceptationSignatureDate: new Date(),
              acceptationStatus: WasteAcceptationStatus.REFUSED,
              acceptationRefusalReason: "Parce que"
            },
            {
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont2",
              emissionNumero: "cont2",
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
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont1",
              emissionNumero: "cont1",
              weight: 1,
              volume: 1,
              acceptationSignatureDate: new Date(),
              acceptationStatus: WasteAcceptationStatus.REFUSED,
              acceptationRefusalReason: "Parce que"
            },
            {
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont2",
              emissionNumero: "cont1",
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
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont1",
              emissionNumero: "cont1",
              weight: 1,
              volume: 1,
              acceptationSignatureDate: new Date(),
              acceptationStatus: WasteAcceptationStatus.REFUSED,
              acceptationRefusalReason: "Parce que"
            },
            {
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont2",
              emissionNumero: "cont2",
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
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont3",
              emissionNumero: "cont3",
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
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont1",
              emissionNumero: "cont1",
              weight: 1,
              volume: 1,
              acceptationSignatureDate: new Date(),
              acceptationStatus: WasteAcceptationStatus.REFUSED,
              acceptationRefusalReason: "Parce que"
            },
            {
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont2",
              emissionNumero: "cont2",
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
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont3",
              emissionNumero: "cont3",
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

  it("should return REFUSED when all next packagings are refused", async () => {
    const bsff = await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        type: BsffType.TRACER_FLUIDE,
        packagings: {
          create: [
            {
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont1",
              emissionNumero: "cont1",
              weight: 1,
              volume: 1,
              acceptationSignatureDate: new Date(),
              acceptationStatus: WasteAcceptationStatus.ACCEPTED,
              acceptationWeight: 1,
              acceptationDate: new Date(),
              operationCode: "R12",
              operationDate: new Date(),
              operationSignatureDate: new Date()
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
              type: BsffPackagingType.BOUTEILLE,
              numero: "cont2",
              emissionNumero: "cont2",
              weight: 2,
              volume: 2,
              acceptationSignatureDate: new Date(),
              acceptationStatus: WasteAcceptationStatus.REFUSED,
              acceptationWeight: 0,
              acceptationRefusalReason: "parce que",
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
    expect(status).toEqual(BsffStatus.REFUSED);
  });
});
