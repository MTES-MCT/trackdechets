import {
  toAllWaste,
  toIncomingWaste,
  toManagedWaste,
  toOutgoingWaste,
  toGenericWaste,
  getTransportersData,
  toTransportedWaste
} from "../registry";
import { prisma } from "@td/prisma";
import { RegistryBsffInclude } from "../../registry/elastic";
import {
  createBsffAfterAcceptation,
  addBsffTransporter,
  createBsff,
  createBsffAfterOperation
} from "./factories";
import {
  companyFactory,
  userWithCompanyFactory
} from "../../__tests__/factories";
import { resetDatabase } from "../../../integration-tests/helper";
import { UserRole } from "@prisma/client";
import { OPERATION } from "../constants";

const createBsffWith5Transporters = async () => {
  const transporter1 = await userWithCompanyFactory(UserRole.ADMIN, {
    companyTypes: {
      set: ["TRANSPORTER"]
    },
    address: "4 Boulevard Pasteur 44100 Nantes"
  });

  const transporter2 = await userWithCompanyFactory(UserRole.ADMIN, {
    companyTypes: {
      set: ["TRANSPORTER"]
    },
    address: "2 RUE PIERRE BROSSOLETTE 64000 PAU"
  });

  const transporter3 = await userWithCompanyFactory(UserRole.ADMIN, {
    companyTypes: {
      set: ["TRANSPORTER"]
    },
    address: "34 ROUTE DE BRESSUIRE 79200 CHATILLON-SUR-THOUET"
  });

  const transporter4 = await userWithCompanyFactory(UserRole.ADMIN, {
    companyTypes: {
      set: ["TRANSPORTER"]
    },
    address: "15 Rue Jacques Prévert, Le Port 97420, Réunion"
  });

  const transporter5 = await userWithCompanyFactory(UserRole.ADMIN, {
    companyTypes: {
      set: ["TRANSPORTER"]
    },
    address: "VIA TRATTATO DI SCHENGEN 5 15067 NOVI LIGURE AL",
    vatNumber: "IT01144600069"
  });

  const bsff = await createBsff(
    { transporter: transporter1 },
    {
      data: { destinationCompanyMail: "destination@mail.com" },
      transporterData: {
        transporterCompanySiret: transporter1.company.siret,
        transporterTransportPlates: ["TRANSPORTER1-NBR-PLATES"],
        transporterCompanyAddress: transporter1.company.address
      }
    }
  );

  await addBsffTransporter({
    bsffId: bsff.id,
    transporter: transporter2,
    opt: { transporterTransportPlates: ["TRANSPORTER2-NBR-PLATES"] }
  });
  await addBsffTransporter({
    bsffId: bsff.id,
    transporter: transporter3,
    opt: { transporterTransportPlates: ["TRANSPORTER3-NBR-PLATES"] }
  });
  await addBsffTransporter({
    bsffId: bsff.id,
    transporter: transporter4,
    opt: { transporterTransportPlates: ["TRANSPORTER4-NBR-PLATES"] }
  });
  await addBsffTransporter({
    bsffId: bsff.id,
    transporter: transporter5,
    opt: { transporterTransportPlates: ["TRANSPORTER5-NBR-PLATES"] }
  });

  return {
    bsff,
    transporter1,
    transporter2,
    transporter3,
    transporter4,
    transporter5
  };
};

describe("toGenericWaste", () => {
  afterAll(resetDatabase);

  it("should contain destinationCompanyMail", async () => {
    // Given
    const bsff = await createBsff(
      {},
      { data: { destinationCompanyMail: "destination@mail.com" } }
    );

    // When
    const bsffForRegistry = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: RegistryBsffInclude
    });
    const waste = toGenericWaste(bsffForRegistry);

    // Then
    expect(waste.destinationCompanyMail).toBe("destination@mail.com");
  });

  it("should contain destinationCompanyMail", async () => {
    // Given
    const bsff = await createBsff(
      {},
      { data: { destinationCompanyMail: "destination@mail.com" } }
    );

    // When
    const bsffForRegistry = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: RegistryBsffInclude
    });
    const waste = toGenericWaste(bsffForRegistry);

    // Then
    expect(waste.destinationCompanyMail).toBe("destination@mail.com");
  });

  it("should contain destination's splitted address, name & siret", async () => {
    // Given
    const destination = await companyFactory({
      name: "Acme Inc",
      address: "4 Boulevard Pasteur 44100 Nantes"
    });
    const bsff = await createBsff(
      {},
      {
        data: {
          destinationCompanyName: destination.name,
          destinationCompanyAddress: destination.address,
          destinationCompanySiret: destination.siret
        }
      }
    );

    // When
    const bsffForRegistry = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: RegistryBsffInclude
    });
    const waste = toGenericWaste(bsffForRegistry);

    // Then
    expect(waste.destinationCompanyAddress).toBe("4 Boulevard Pasteur");
    expect(waste.destinationCompanyPostalCode).toBe("44100");
    expect(waste.destinationCompanyCity).toBe("Nantes");
    expect(waste.destinationCompanyCountry).toBe("FR");

    expect(waste.destinationCompanySiret).toBe(destination.siret);
    expect(waste.destinationCompanyName).toBe(destination.name);
  });

  it("should contain emitter's splitted address, name & siret", async () => {
    // Given
    const emitter = await companyFactory({
      name: "Emitter company name",
      address: "4 Boulevard Pasteur 44100 Nantes"
    });
    const bsff = await createBsff(
      {},
      {
        data: {
          emitterCompanySiret: emitter.siret,
          emitterCompanyName: emitter.name,
          emitterCompanyAddress: emitter.address
        }
      }
    );

    // When
    const bsffForRegistry = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: RegistryBsffInclude
    });
    const waste = toGenericWaste(bsffForRegistry);

    // Then
    expect(waste.emitterCompanyName).toBe(emitter.name);
    expect(waste.emitterCompanySiret).toBe(emitter.siret);
    expect(waste.emitterCompanyAddress).toBe("4 Boulevard Pasteur");
    expect(waste.emitterCompanyPostalCode).toBe("44100");
    expect(waste.emitterCompanyCity).toBe("Nantes");
    expect(waste.emitterCompanyCountry).toBe("FR");
  });

  it(
    "it should return accepted wasteCode and wasteDescription when there is" +
      " only one packaging",
    async () => {
      const emitter = await userWithCompanyFactory();
      const transporter = await userWithCompanyFactory();
      const destination = await userWithCompanyFactory();

      const bsff = await createBsffAfterAcceptation(
        { emitter, transporter, destination },
        {
          data: {
            wasteCode: "14 06 01*",
            wasteDescription: "HFC"
          },
          packagingData: {
            acceptationWasteCode: "14 06 02*",
            acceptationWasteDescription: "HFC 2"
          }
        }
      );

      const bsffForRegistry = await prisma.bsff.findUniqueOrThrow({
        where: { id: bsff.id },
        include: RegistryBsffInclude
      });
      const waste = toGenericWaste(bsffForRegistry);

      expect(waste.wasteCode).toEqual("14 06 02*");
      expect(waste.wasteDescription).toEqual("HFC 2");
    }
  );
});

describe("toIncomingWaste", () => {
  afterAll(resetDatabase);

  it("should contain transporters info except plates", async () => {
    // Given
    const { bsff } = await createBsffWith5Transporters();

    // When
    const bsffForRegistry = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: RegistryBsffInclude
    });
    const waste = toIncomingWaste(bsffForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      bsffForRegistry.transporters[0].transporterCompanySiret
    );
    expect(waste["transporterNumberPlates"]).toBeUndefined();

    expect(waste.transporter2CompanySiret).toBe(
      bsffForRegistry.transporters[1].transporterCompanySiret
    );
    expect(waste["transporter2NumberPlates"]).toBeUndefined();

    expect(waste.transporter3CompanySiret).toBe(
      bsffForRegistry.transporters[2].transporterCompanySiret
    );
    expect(waste["transporter3NumberPlates"]).toBeUndefined();

    expect(waste.transporter4CompanySiret).toBe(
      bsffForRegistry.transporters[3].transporterCompanySiret
    );
    expect(waste["transporter4NumberPlates"]).toBeUndefined();

    expect(waste.transporter5CompanySiret).toBe(
      bsffForRegistry.transporters[4].transporterCompanyVatNumber
    );
    expect(waste["transporter5NumberPlates"]).toBeUndefined();
  });

  it("should contain emitted weight and destinationReception weight, acceptedWeight, & refusedWeight", async () => {
    // Given
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsffAfterAcceptation(
      {
        emitter,
        transporter,
        destination
      },
      {
        data: {
          weightValue: 89.6
        },
        packagingData: {
          acceptationWeight: 55.4
        }
      }
    );

    // When
    const bsffForRegistry = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: RegistryBsffInclude
    });
    const wasteRegistry = toIncomingWaste(bsffForRegistry);

    // Then
    expect(wasteRegistry.weight).toBe(0.0896);
    expect(wasteRegistry.destinationReceptionWeight).toBe(0.0554);
    expect(wasteRegistry.destinationReceptionAcceptedWeight).toBeNull();
    expect(wasteRegistry.destinationReceptionRefusedWeight).toBeNull();
  });
});

describe("toOutgoingWaste", () => {
  afterAll(resetDatabase);

  it(
    "should compute destinationFinalOperationCodes" +
      " and destinationfinalOperationWeights",
    async () => {
      const emitter = await userWithCompanyFactory("MEMBER");
      const transporter = await userWithCompanyFactory("MEMBER");
      const ttr = await userWithCompanyFactory("MEMBER");
      const destination = await userWithCompanyFactory("MEMBER");

      const finalBsff = await createBsffAfterOperation(
        {
          emitter: ttr,
          transporter,
          destination
        },
        { packagingData: { operationCode: "R 1", acceptationWeight: 1 } }
      );

      const finalPackaging = finalBsff.packagings[0];

      const bsff = await createBsffAfterOperation(
        {
          emitter,
          transporter,
          destination
        },
        {
          packagingData: {
            operationCode: "D 13",
            operationSignatureDate: new Date(),
            finalOperations: {
              create: {
                finalBsffPackagingId: finalPackaging.id,
                quantity: finalPackaging.acceptationWeight!,
                operationCode: finalPackaging.operationCode!,
                noTraceability: false
              }
            }
          }
        }
      );
      const bsffForRegistry = await prisma.bsff.findUniqueOrThrow({
        where: { id: bsff.id },
        include: RegistryBsffInclude
      });
      const waste = toOutgoingWaste(bsffForRegistry);
      expect(waste.destinationFinalOperationCodes).toStrictEqual(["R 1"]);
      expect(waste.destinationFinalOperationWeights).toStrictEqual([0.001]);
      expect(waste.destinationFinalOperationCompanySirets).toStrictEqual([
        destination.company.siret
      ]);
    }
  );

  test(
    "destinationFinalOperationCodes and destinationfinalOperationWeights should be empty" +
      " when BSFF has a final operation",
    async () => {
      const emitter = await userWithCompanyFactory("MEMBER");
      const transporter = await userWithCompanyFactory("MEMBER");
      const destination = await userWithCompanyFactory("MEMBER");

      const bsff = await createBsffAfterOperation(
        {
          emitter,
          transporter,
          destination
        },
        {
          packagingData: {
            operationCode: OPERATION.R1.code,
            operationSignatureDate: new Date()
          }
        }
      );

      const packaging = bsff.packagings[0];

      await prisma.bsff.update({
        where: { id: bsff.id },
        data: {
          packagings: {
            update: {
              where: { id: bsff.packagings[0].id },
              data: {
                finalOperations: {
                  create: {
                    finalBsffPackagingId: packaging.id,
                    quantity: packaging.acceptationWeight!,
                    operationCode: packaging.operationCode!,
                    noTraceability: false
                  }
                }
              }
            }
          }
        }
      });

      const bsffForRegistry = await prisma.bsff.findUniqueOrThrow({
        where: { id: bsff.id },
        include: RegistryBsffInclude
      });
      const waste = toOutgoingWaste(bsffForRegistry);
      expect(waste.destinationFinalOperationCodes).toStrictEqual([]);
      expect(waste.destinationFinalOperationWeights).toStrictEqual([]);
      expect(waste.destinationFinalOperationCompanySirets).toStrictEqual([]);
    }
  );

  it("should contain emitted weight and destinationReception weight, acceptedWeight, & refusedWeight", async () => {
    // Given
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsffAfterAcceptation(
      {
        emitter,
        transporter,
        destination
      },
      {
        data: {
          weightValue: 89.6
        },
        packagingData: {
          acceptationWeight: 55.4
        }
      }
    );

    // When
    const bsffForRegistry = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: RegistryBsffInclude
    });
    const wasteRegistry = toOutgoingWaste(bsffForRegistry);

    // Then
    expect(wasteRegistry.weight).toBe(0.0896);
    expect(wasteRegistry.destinationReceptionWeight).toBe(0.0554);
    expect(wasteRegistry.destinationReceptionAcceptedWeight).toBeNull();
    expect(wasteRegistry.destinationReceptionRefusedWeight).toBeNull();
  });

  it("should contain transporters info except plates", async () => {
    // Given
    const { bsff } = await createBsffWith5Transporters();

    // When
    const bsffForRegistry = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: RegistryBsffInclude
    });
    const waste = toOutgoingWaste(bsffForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      bsffForRegistry.transporters[0].transporterCompanySiret
    );
    expect(waste["transporterNumberPlates"]).toBeUndefined();

    expect(waste.transporter2CompanySiret).toBe(
      bsffForRegistry.transporters[1].transporterCompanySiret
    );
    expect(waste["transporter2NumberPlates"]).toBeUndefined();

    expect(waste.transporter3CompanySiret).toBe(
      bsffForRegistry.transporters[2].transporterCompanySiret
    );
    expect(waste["transporter3NumberPlates"]).toBeUndefined();

    expect(waste.transporter4CompanySiret).toBe(
      bsffForRegistry.transporters[3].transporterCompanySiret
    );
    expect(waste["transporter4NumberPlates"]).toBeUndefined();

    expect(waste.transporter5CompanySiret).toBe(
      bsffForRegistry.transporters[4].transporterCompanyVatNumber
    );
    expect(waste["transporter5NumberPlates"]).toBeUndefined();
  });
});

describe("toTransportedWaste", () => {
  afterAll(resetDatabase);

  it("should contain emitted weight and destinationReception weight", async () => {
    // Given
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsffAfterAcceptation(
      {
        emitter,
        transporter,
        destination
      },
      {
        data: {
          weightValue: 89.6
        },
        packagingData: {
          acceptationWeight: 55.4
        }
      }
    );

    // When
    const bsffForRegistry = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: RegistryBsffInclude
    });
    const wasteRegistry = toTransportedWaste(bsffForRegistry);

    // Then
    expect(wasteRegistry.weight).toBe(0.0896);
    expect(wasteRegistry.destinationReceptionWeight).toBe(0.0554);
  });

  it("should contain transporters info including plates", async () => {
    // Given
    const { bsff } = await createBsffWith5Transporters();

    // When
    const bsffForRegistry = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: RegistryBsffInclude
    });

    const waste = toTransportedWaste(bsffForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      bsffForRegistry.transporters[0].transporterCompanySiret
    );
    expect(waste.transporterNumberPlates).toStrictEqual([
      "TRANSPORTER1-NBR-PLATES"
    ]);

    expect(waste.transporter2CompanySiret).toBe(
      bsffForRegistry.transporters[1].transporterCompanySiret
    );
    expect(waste.transporter2NumberPlates).toStrictEqual([
      "TRANSPORTER2-NBR-PLATES"
    ]);

    expect(waste.transporter3CompanySiret).toBe(
      bsffForRegistry.transporters[2].transporterCompanySiret
    );
    expect(waste.transporter3NumberPlates).toStrictEqual([
      "TRANSPORTER3-NBR-PLATES"
    ]);

    expect(waste.transporter4CompanySiret).toBe(
      bsffForRegistry.transporters[3].transporterCompanySiret
    );
    expect(waste.transporter4NumberPlates).toStrictEqual([
      "TRANSPORTER4-NBR-PLATES"
    ]);

    expect(waste.transporter5CompanySiret).toBe(
      bsffForRegistry.transporters[4].transporterCompanyVatNumber
    );
    expect(waste.transporter5NumberPlates).toStrictEqual([
      "TRANSPORTER5-NBR-PLATES"
    ]);
  });
});

describe("toManagedWaste", () => {
  afterAll(resetDatabase);

  it("should contain emitted weight and destinationReception weight, acceptedWeight, & refusedWeight", async () => {
    // Given
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsffAfterAcceptation(
      {
        emitter,
        transporter,
        destination
      },
      {
        data: {
          weightValue: 89.6
        },
        packagingData: {
          acceptationWeight: 55.4
        }
      }
    );

    // When
    const bsffForRegistry = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: RegistryBsffInclude
    });
    const wasteRegistry = toManagedWaste(bsffForRegistry);

    // Then
    expect(wasteRegistry.weight).toBe(0.0896);
    expect(wasteRegistry.destinationReceptionWeight).toBe(0.0554);
    expect(wasteRegistry.destinationReceptionAcceptedWeight).toBeNull();
    expect(wasteRegistry.destinationReceptionRefusedWeight).toBeNull();
  });

  it("should contain transporters info except plates", async () => {
    // Given
    const { bsff } = await createBsffWith5Transporters();

    // When
    const bsffForRegistry = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: RegistryBsffInclude
    });
    const waste = toManagedWaste(bsffForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      bsffForRegistry.transporters[0].transporterCompanySiret
    );
    expect(waste["transporterNumberPlates"]).toBeUndefined();

    expect(waste.transporter2CompanySiret).toBe(
      bsffForRegistry.transporters[1].transporterCompanySiret
    );
    expect(waste["transporter2NumberPlates"]).toBeUndefined();

    expect(waste.transporter3CompanySiret).toBe(
      bsffForRegistry.transporters[2].transporterCompanySiret
    );
    expect(waste["transporter3NumberPlates"]).toBeUndefined();

    expect(waste.transporter4CompanySiret).toBe(
      bsffForRegistry.transporters[3].transporterCompanySiret
    );
    expect(waste["transporter4NumberPlates"]).toBeUndefined();

    expect(waste.transporter5CompanySiret).toBe(
      bsffForRegistry.transporters[4].transporterCompanyVatNumber
    );
    expect(waste["transporter5NumberPlates"]).toBeUndefined();
  });
});

describe("toAllWaste", () => {
  afterAll(resetDatabase);

  it(
    "should compute destinationFinalOperationCodes" +
      " and destinationfinalOperationWeights",
    async () => {
      const emitter = await userWithCompanyFactory("MEMBER");
      const transporter = await userWithCompanyFactory("MEMBER");
      const ttr = await userWithCompanyFactory("MEMBER");
      const destination = await userWithCompanyFactory("MEMBER");

      const finalBsff = await createBsffAfterOperation(
        {
          emitter: ttr,
          transporter,
          destination
        },
        { packagingData: { operationCode: "R 1", acceptationWeight: 1 } }
      );

      const finalPackaging = finalBsff.packagings[0];

      const bsff = await createBsffAfterOperation(
        {
          emitter,
          transporter,
          destination: ttr
        },
        {
          packagingData: {
            operationCode: "D 13",
            operationSignatureDate: new Date(),
            finalOperations: {
              create: {
                finalBsffPackagingId: finalPackaging.id,
                quantity: finalPackaging.acceptationWeight!,
                operationCode: finalPackaging.operationCode!,
                noTraceability: false
              }
            }
          }
        }
      );

      await prisma.bsffPackaging.update({
        where: { id: finalPackaging.id },
        data: {
          previousPackagings: {
            connect: bsff.packagings.map(p => ({ id: p.id }))
          }
        }
      });

      const bsffForRegistry = await prisma.bsff.findUniqueOrThrow({
        where: { id: bsff.id },
        include: RegistryBsffInclude
      });
      const waste = toAllWaste(bsffForRegistry);
      expect(waste.destinationFinalOperationCodes).toStrictEqual(["R 1"]);
      expect(waste.destinationFinalOperationWeights).toStrictEqual([0.001]);
      expect(waste.destinationFinalOperationCompanySirets).toStrictEqual([
        destination.company.siret
      ]);
    }
  );

  test(
    "destinationFinalOperationCodes and destinationfinalOperationWeights should be empty" +
      " when BSFF has a final operation",
    async () => {
      const emitter = await userWithCompanyFactory("MEMBER");
      const transporter = await userWithCompanyFactory("MEMBER");
      const destination = await userWithCompanyFactory("MEMBER");

      const bsff = await createBsffAfterOperation(
        {
          emitter,
          transporter,
          destination
        },
        {
          packagingData: {
            operationCode: OPERATION.R1.code,
            operationSignatureDate: new Date()
          }
        }
      );

      const packaging = bsff.packagings[0];

      await prisma.bsff.update({
        where: { id: bsff.id },
        data: {
          packagings: {
            update: {
              where: { id: bsff.packagings[0].id },
              data: {
                finalOperations: {
                  create: {
                    finalBsffPackagingId: packaging.id,
                    quantity: packaging.acceptationWeight!,
                    operationCode: packaging.operationCode!,
                    noTraceability: false
                  }
                }
              }
            }
          }
        }
      });

      const bsffForRegistry = await prisma.bsff.findUniqueOrThrow({
        where: { id: bsff.id },
        include: RegistryBsffInclude
      });
      const waste = toAllWaste(bsffForRegistry);
      expect(waste.destinationFinalOperationCodes).toStrictEqual([]);
      expect(waste.destinationFinalOperationWeights).toStrictEqual([]);
      expect(waste.destinationFinalOperationCompanySirets).toStrictEqual([]);
    }
  );

  it("should contain emitted weight and destinationReception weight, acceptedWeight, & refusedWeight", async () => {
    // Given
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsffAfterAcceptation(
      {
        emitter,
        transporter,
        destination
      },
      {
        data: {
          weightValue: 89.6
        },
        packagingData: {
          acceptationWeight: 55.4
        }
      }
    );

    // When
    const bsffForRegistry = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: RegistryBsffInclude
    });
    const wasteRegistry = toAllWaste(bsffForRegistry);

    // Then
    expect(wasteRegistry.weight).toBe(0.0896);
    expect(wasteRegistry.destinationReceptionWeight).toBe(0.0554);
    expect(wasteRegistry.destinationReceptionAcceptedWeight).toBeNull();
    expect(wasteRegistry.destinationReceptionRefusedWeight).toBeNull();
  });

  it("should contain transporters info including plates", async () => {
    // Given
    const { bsff } = await createBsffWith5Transporters();

    // When
    const bsffForRegistry = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: RegistryBsffInclude
    });
    const waste = toAllWaste(bsffForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      bsffForRegistry.transporters[0].transporterCompanySiret
    );
    expect(waste.transporterNumberPlates).toStrictEqual([
      "TRANSPORTER1-NBR-PLATES"
    ]);

    expect(waste.transporter2CompanySiret).toBe(
      bsffForRegistry.transporters[1].transporterCompanySiret
    );
    expect(waste.transporter2NumberPlates).toStrictEqual([
      "TRANSPORTER2-NBR-PLATES"
    ]);

    expect(waste.transporter3CompanySiret).toBe(
      bsffForRegistry.transporters[2].transporterCompanySiret
    );
    expect(waste.transporter3NumberPlates).toStrictEqual([
      "TRANSPORTER3-NBR-PLATES"
    ]);

    expect(waste.transporter4CompanySiret).toBe(
      bsffForRegistry.transporters[3].transporterCompanySiret
    );
    expect(waste.transporter4NumberPlates).toStrictEqual([
      "TRANSPORTER4-NBR-PLATES"
    ]);

    expect(waste.transporter5CompanySiret).toBe(
      bsffForRegistry.transporters[4].transporterCompanyVatNumber
    );
    expect(waste.transporter5NumberPlates).toStrictEqual([
      "TRANSPORTER5-NBR-PLATES"
    ]);
  });
});

describe("getTransportersData", () => {
  afterAll(resetDatabase);

  it("should contain the splitted addresses of all transporters", async () => {
    // Given
    const { bsff } = await createBsffWith5Transporters();

    // When
    const bsffForRegistry = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: RegistryBsffInclude
    });
    const waste = getTransportersData(bsffForRegistry);

    // Then
    expect(waste.transporterCompanyAddress).toBe("4 Boulevard Pasteur");
    expect(waste.transporterCompanyPostalCode).toBe("44100");
    expect(waste.transporterCompanyCity).toBe("Nantes");
    expect(waste.transporterCompanyCountry).toBe("FR");

    expect(waste.transporter2CompanyAddress).toBe("2 RUE PIERRE BROSSOLETTE");
    expect(waste.transporter2CompanyPostalCode).toBe("64000");
    expect(waste.transporter2CompanyCity).toBe("PAU");
    expect(waste.transporter2CompanyCountry).toBe("FR");

    expect(waste.transporter3CompanyAddress).toBe("34 ROUTE DE BRESSUIRE");
    expect(waste.transporter3CompanyPostalCode).toBe("79200");
    expect(waste.transporter3CompanyCity).toBe("CHATILLON-SUR-THOUET");
    expect(waste.transporter3CompanyCountry).toBe("FR");

    expect(waste.transporter4CompanyAddress).toBe(
      "15 Rue Jacques Prévert, Le Port"
    );
    expect(waste.transporter4CompanyPostalCode).toBe("97420");
    expect(waste.transporter4CompanyCity).toBe("Réunion");
    expect(waste.transporter4CompanyCountry).toBe("FR");

    // Foreign transporter
    expect(waste.transporter5CompanyAddress).toBe("VIA TRATTATO DI SCHENGEN 5");
    expect(waste.transporter5CompanyPostalCode).toBe("15067");
    expect(waste.transporter5CompanyCity).toBe("NOVI LIGURE AL");
    expect(waste.transporter5CompanyCountry).toBe("IT");
  });
});
