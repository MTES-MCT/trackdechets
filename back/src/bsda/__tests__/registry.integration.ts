import {
  getSubType,
  getTransportersData,
  toAllWaste,
  toGenericWaste,
  toIncomingWaste,
  toManagedWaste,
  toOutgoingWaste,
  toTransportedWaste
} from "../registry";
import { prisma } from "@td/prisma";
import { RegistryBsdaInclude } from "../../registry/elastic";
import { bsdaFactory } from "./factories";
import { resetDatabase } from "../../../integration-tests/helper";
import { BsdaType, UserRole } from "@prisma/client";
import {
  companyFactory,
  toIntermediaryCompany,
  userWithCompanyFactory
} from "../../__tests__/factories";

const createBsdaWith5Transporters = async () => {
  const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
    companyTypes: {
      set: ["PRODUCER"]
    }
  });

  const transporter = await userWithCompanyFactory(UserRole.ADMIN, {
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

  const destination = await userWithCompanyFactory(UserRole.ADMIN, {
    companyTypes: {
      set: ["WASTEPROCESSOR"]
    }
  });

  const bsda = await bsdaFactory({
    opt: {
      status: "PROCESSED",
      emitterCompanySiret: emitter.company.siret,
      transporters: {
        createMany: {
          data: [
            {
              transporterCompanySiret: transporter.company.siret,
              transporterTransportPlates: ["TRANSPORTER1-NBR-PLATES"],
              transporterCompanyAddress: transporter.company.address,
              number: 1
            },
            {
              transporterCompanySiret: transporter2.company.siret,
              transporterTransportPlates: ["TRANSPORTER2-NBR-PLATES"],
              transporterCompanyAddress: transporter2.company.address,
              number: 2
            },
            {
              transporterCompanySiret: transporter3.company.siret,
              transporterTransportPlates: ["TRANSPORTER3-NBR-PLATES"],
              transporterCompanyAddress: transporter3.company.address,
              number: 3
            },
            {
              transporterCompanySiret: transporter4.company.siret,
              transporterTransportPlates: ["TRANSPORTER4-NBR-PLATES"],
              transporterCompanyAddress: transporter4.company.address,
              number: 4
            },
            {
              transporterCompanyVatNumber: transporter5.company.vatNumber,
              transporterTransportPlates: ["TRANSPORTER5-NBR-PLATES"],
              transporterCompanyAddress: transporter5.company.address,
              number: 5
            }
          ]
        }
      },
      destinationCompanySiret: destination.company.siret
    }
  });

  const bsdaForRegistry = await prisma.bsda.findUniqueOrThrow({
    where: { id: bsda.id },
    include: RegistryBsdaInclude
  });

  return {
    bsda: bsdaForRegistry,
    transporter1: transporter.company,
    transporter2: transporter2.company,
    transporter3: transporter3.company,
    transporter4: transporter4.company,
    transporter5: transporter5.company
  };
};

describe("toIncomingWaste", () => {
  afterAll(resetDatabase);

  it("should contain next destination operation code", async () => {
    // Given
    const bsda = await bsdaFactory({
      opt: {
        destinationOperationNextDestinationPlannedOperationCode: "D9"
      }
    });

    // When
    const bsdaForRegistry = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsda.id },
      include: RegistryBsdaInclude
    });
    const waste = toIncomingWaste(bsdaForRegistry);

    // Then
    expect(waste.nextDestinationProcessingOperation).toBe("D9");
  });

  it("should contain transporters info except plates", async () => {
    // Given
    const data = await createBsdaWith5Transporters();

    // When
    const waste = toIncomingWaste(data.bsda);

    // Then
    expect(waste.transporterCompanySiret).toBe(data.transporter1.siret);
    expect(waste["transporterNumberPlates"]).toBeUndefined();

    expect(waste.transporter2CompanySiret).toBe(data.transporter2.siret);
    expect(waste["transporter2NumberPlates"]).toBeUndefined();

    expect(waste.transporter3CompanySiret).toBe(data.transporter3.siret);
    expect(waste["transporter3NumberPlates"]).toBeUndefined();

    expect(waste.transporter4CompanySiret).toBe(data.transporter4.siret);
    expect(waste["transporter4NumberPlates"]).toBeUndefined();

    expect(waste.transporter5CompanySiret).toBe(data.transporter5.vatNumber);
    expect(waste["transporter5NumberPlates"]).toBeUndefined();
  });

  it("if forwarding BSD, should contain the info of the initial emitter", async () => {
    // Given
    const emitter = await companyFactory({
      name: "Acme Inc.",
      address: "4 boulevard Pasteur 44100 Nantes"
    });
    const forwardedBsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: emitter.siret,
        emitterCompanyName: emitter.name,
        emitterCompanyAddress: emitter.address
      }
    });
    const forwardingBsda = await bsdaFactory({
      opt: {
        forwarding: { connect: { id: forwardedBsda.id } },
        emitterCompanyName: emitter.name,
        emitterCompanyAddress: emitter.address,
        emitterCompanySiret: emitter.siret
      }
    });

    // When
    const forwardingBsdaForRegistry = await prisma.bsda.findUniqueOrThrow({
      where: { id: forwardingBsda.id },
      include: RegistryBsdaInclude
    });
    const waste = toIncomingWaste(forwardingBsdaForRegistry);

    // Then
    expect(waste.initialEmitterCompanyAddress).toBe("4 boulevard Pasteur");
    expect(waste.initialEmitterCompanyPostalCode).toBe("44100");
    expect(waste.initialEmitterCompanyCity).toBe("Nantes");
    expect(waste.initialEmitterCompanyCountry).toBe("FR");
    expect(waste.initialEmitterCompanyName).toBe("Acme Inc.");
    expect(waste.initialEmitterCompanySiret).toBe(emitter.siret);
  });
});

describe("toOutgoingWaste", () => {
  afterAll(resetDatabase);

  it(
    "should compute destinationFinalOperationCodes" +
      " and destinationfinalOperationWeights",
    async () => {
      const finalBsda1 = await bsdaFactory({});
      const finalBsda2 = await bsdaFactory({});

      const form = await bsdaFactory({
        opt: {
          finalOperations: {
            createMany: {
              data: [
                {
                  finalBsdaId: finalBsda1.id,
                  operationCode: "R 5",
                  quantity: 1
                },
                {
                  finalBsdaId: finalBsda2.id,
                  operationCode: "D 5",
                  quantity: 2
                }
              ]
            }
          }
        }
      });
      const bsdaForRegistry = await prisma.bsda.findUniqueOrThrow({
        where: { id: form.id },
        include: RegistryBsdaInclude
      });
      const waste = toOutgoingWaste(bsdaForRegistry);
      expect(waste.destinationFinalOperationCodes).toStrictEqual([
        "R 5",
        "D 5"
      ]);
      expect(waste.destinationFinalOperationWeights).toStrictEqual([1, 2]);
    }
  );

  it("should contain next destination operation code", async () => {
    // Given
    const bsda = await bsdaFactory({
      opt: {
        destinationOperationNextDestinationPlannedOperationCode: "D9"
      }
    });

    // When
    const bsdaForRegistry = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsda.id },
      include: RegistryBsdaInclude
    });
    const waste = toOutgoingWaste(bsdaForRegistry);

    // Then
    expect(waste.nextDestinationProcessingOperation).toBe("D9");
  });

  it("bsda with tmp storage should mention post-temp-storage destination", async () => {
    // Given
    const recipient = await companyFactory({ name: "Recipient" });
    const forwardedInNextDestination = await companyFactory({
      name: "ForwardedIn next destination",
      address: "25 rue Voltaire 37100 TOURS"
    });

    const forwardedBsda = await bsdaFactory({
      opt: {
        destinationCompanySiret: recipient.siret,
        destinationCompanyName: recipient.name,
        destinationCompanyAddress: recipient.address
      }
    });
    await bsdaFactory({
      opt: {
        forwarding: { connect: { id: forwardedBsda.id } },
        destinationCompanyAddress: forwardedInNextDestination.address,
        destinationCompanyName: forwardedInNextDestination.name,
        destinationCompanySiret: forwardedInNextDestination.siret
      }
    });

    // When
    const bsdaForRegistry = await prisma.bsda.findUniqueOrThrow({
      where: { id: forwardedBsda.id },
      include: RegistryBsdaInclude
    });
    const waste = toOutgoingWaste(bsdaForRegistry);

    // Then
    expect(waste.postTempStorageDestinationSiret).toBe(
      forwardedInNextDestination.siret
    );
    expect(waste.postTempStorageDestinationName).toBe(
      "ForwardedIn next destination"
    );

    // Address
    expect(waste.postTempStorageDestinationAddress).toBe("25 rue Voltaire");
    expect(waste.postTempStorageDestinationCity).toBe("TOURS");
    expect(waste.postTempStorageDestinationPostalCode).toBe("37100");
    expect(waste.postTempStorageDestinationCountry).toBe("FR");
  });

  it("should contain transporters info except plates", async () => {
    // Given
    const data = await createBsdaWith5Transporters();

    // When
    const waste = toOutgoingWaste(data.bsda);

    // Then
    expect(waste.transporterCompanySiret).toBe(data.transporter1.siret);
    expect(waste["transporterNumberPlates"]).toBeUndefined();

    expect(waste.transporter2CompanySiret).toBe(data.transporter2.siret);
    expect(waste["transporter2NumberPlates"]).toBeUndefined();

    expect(waste.transporter3CompanySiret).toBe(data.transporter3.siret);
    expect(waste["transporter3NumberPlates"]).toBeUndefined();

    expect(waste.transporter4CompanySiret).toBe(data.transporter4.siret);
    expect(waste["transporter4NumberPlates"]).toBeUndefined();

    expect(waste.transporter5CompanySiret).toBe(data.transporter5.vatNumber);
    expect(waste["transporter5NumberPlates"]).toBeUndefined();
  });

  it("if forwarding BSD, should contain the info of the initial emitter", async () => {
    // Given
    const emitter = await companyFactory({
      name: "Acme Inc.",
      address: "4 boulevard Pasteur 44100 Nantes"
    });
    const forwardedBsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: emitter.siret,
        emitterCompanyName: emitter.name,
        emitterCompanyAddress: emitter.address
      }
    });
    const forwardingBsda = await bsdaFactory({
      opt: {
        forwarding: { connect: { id: forwardedBsda.id } },
        emitterCompanyName: emitter.name,
        emitterCompanyAddress: emitter.address,
        emitterCompanySiret: emitter.siret
      }
    });

    // When
    const forwardingBsdaForRegistry = await prisma.bsda.findUniqueOrThrow({
      where: { id: forwardingBsda.id },
      include: RegistryBsdaInclude
    });
    const waste = toOutgoingWaste(forwardingBsdaForRegistry);

    // Then
    expect(waste.initialEmitterCompanyAddress).toBe("4 boulevard Pasteur");
    expect(waste.initialEmitterCompanyPostalCode).toBe("44100");
    expect(waste.initialEmitterCompanyCity).toBe("Nantes");
    expect(waste.initialEmitterCompanyCountry).toBe("FR");
    expect(waste.initialEmitterCompanyName).toBe("Acme Inc.");
    expect(waste.initialEmitterCompanySiret).toBe(emitter.siret);
  });
});

describe("toManagedWaste", () => {
  afterAll(resetDatabase);

  it("should contain next destination operation code", async () => {
    // Given
    const bsda = await bsdaFactory({
      opt: {
        destinationOperationNextDestinationPlannedOperationCode: "D9"
      }
    });

    // When
    const bsdaForRegistry = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsda.id },
      include: RegistryBsdaInclude
    });
    const waste = toManagedWaste(bsdaForRegistry);

    // Then
    expect(waste.nextDestinationProcessingOperation).toBe("D9");
  });

  it("should contain transporters info except plates", async () => {
    // Given
    const data = await createBsdaWith5Transporters();

    // When
    const waste = toManagedWaste(data.bsda);

    // Then
    expect(waste.transporterCompanySiret).toBe(data.transporter1.siret);
    expect(waste["transporterNumberPlates"]).toBeUndefined();

    expect(waste.transporter2CompanySiret).toBe(data.transporter2.siret);
    expect(waste["transporter2NumberPlates"]).toBeUndefined();

    expect(waste.transporter3CompanySiret).toBe(data.transporter3.siret);
    expect(waste["transporter3NumberPlates"]).toBeUndefined();

    expect(waste.transporter4CompanySiret).toBe(data.transporter4.siret);
    expect(waste["transporter4NumberPlates"]).toBeUndefined();

    expect(waste.transporter5CompanySiret).toBe(data.transporter5.vatNumber);
    expect(waste["transporter5NumberPlates"]).toBeUndefined();
  });
});

describe("toAllWaste", () => {
  afterAll(resetDatabase);

  it(
    "should compute destinationFinalOperationCodes" +
      " and destinationfinalOperationWeights",
    async () => {
      const finalBsda1 = await bsdaFactory({});
      const finalBsda2 = await bsdaFactory({});

      const form = await bsdaFactory({
        opt: {
          finalOperations: {
            createMany: {
              data: [
                {
                  finalBsdaId: finalBsda1.id,
                  operationCode: "R 5",
                  quantity: 1
                },
                {
                  finalBsdaId: finalBsda2.id,
                  operationCode: "D 5",
                  quantity: 2
                }
              ]
            }
          }
        }
      });
      const bsdaForRegistry = await prisma.bsda.findUniqueOrThrow({
        where: { id: form.id },
        include: RegistryBsdaInclude
      });
      const waste = toAllWaste(bsdaForRegistry);
      expect(waste.destinationFinalOperationCodes).toStrictEqual([
        "R 5",
        "D 5"
      ]);
      expect(waste.destinationFinalOperationWeights).toStrictEqual([1, 2]);
    }
  );

  it("should contain next destination operation code", async () => {
    // Given
    const bsda = await bsdaFactory({
      opt: {
        destinationOperationNextDestinationPlannedOperationCode: "D9"
      }
    });

    // When
    const bsdaForRegistry = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsda.id },
      include: RegistryBsdaInclude
    });
    const waste = toAllWaste(bsdaForRegistry);

    // Then
    expect(waste.nextDestinationProcessingOperation).toBe("D9");
  });

  it("should contain all 3 intermediaries", async () => {
    // Given
    const intermediary1 = await companyFactory({});
    const intermediary2 = await companyFactory({});
    const intermediary3 = await companyFactory({});

    const bsda = await bsdaFactory({
      opt: {
        intermediaries: {
          create: [
            toIntermediaryCompany(intermediary1),
            toIntermediaryCompany(intermediary2),
            toIntermediaryCompany(intermediary3)
          ]
        }
      }
    });

    // When
    const bsdaForRegistry = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsda.id },
      include: RegistryBsdaInclude
    });
    const waste = toAllWaste(bsdaForRegistry);

    // Then
    expect(waste).not.toBeUndefined();
    expect(waste.intermediary1CompanyName).toBe(intermediary1.name);
    expect(waste.intermediary1CompanySiret).toBe(intermediary1.siret);
    expect(waste.intermediary2CompanyName).toBe(intermediary2.name);
    expect(waste.intermediary2CompanySiret).toBe(intermediary2.siret);
    expect(waste.intermediary3CompanyName).toBe(intermediary3.name);
    expect(waste.intermediary3CompanySiret).toBe(intermediary3.siret);
  });

  it("bsda with tmp storage should mention post-temp-storage destination", async () => {
    // Given
    const recipient = await companyFactory({ name: "Recipient" });
    const forwardedInNextDestination = await companyFactory({
      name: "ForwardedIn next destination",
      address: "25 rue Voltaire 37100 TOURS"
    });

    const forwardedBsda = await bsdaFactory({
      opt: {
        destinationCompanySiret: recipient.siret,
        destinationCompanyName: recipient.name,
        destinationCompanyAddress: recipient.address
      }
    });
    await bsdaFactory({
      opt: {
        forwarding: { connect: { id: forwardedBsda.id } },
        destinationCompanyAddress: forwardedInNextDestination.address,
        destinationCompanyName: forwardedInNextDestination.name,
        destinationCompanySiret: forwardedInNextDestination.siret
      }
    });

    // When
    const bsdaForRegistry = await prisma.bsda.findUniqueOrThrow({
      where: { id: forwardedBsda.id },
      include: RegistryBsdaInclude
    });
    const waste = toAllWaste(bsdaForRegistry);

    // Then
    expect(waste.postTempStorageDestinationSiret).toBe(
      forwardedInNextDestination.siret
    );
    expect(waste.postTempStorageDestinationName).toBe(
      "ForwardedIn next destination"
    );

    // Address
    expect(waste.postTempStorageDestinationAddress).toBe("25 rue Voltaire");
    expect(waste.postTempStorageDestinationCity).toBe("TOURS");
    expect(waste.postTempStorageDestinationPostalCode).toBe("37100");
    expect(waste.postTempStorageDestinationCountry).toBe("FR");
  });

  it("should work with 1 intermediary", async () => {
    // Given
    const intermediary1 = await companyFactory({});

    const bsda = await bsdaFactory({
      opt: {
        intermediaries: {
          create: [toIntermediaryCompany(intermediary1)]
        }
      }
    });

    // When
    const bsdaForRegistry = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsda.id },
      include: RegistryBsdaInclude
    });
    const waste = toAllWaste(bsdaForRegistry);

    // Then
    expect(waste).not.toBeUndefined();
    expect(waste.intermediary1CompanyName).toBe(intermediary1.name);
    expect(waste.intermediary1CompanySiret).toBe(intermediary1.siret);
    expect(waste.intermediary2CompanyName).toBe(null);
    expect(waste.intermediary2CompanySiret).toBe(null);
    expect(waste.intermediary3CompanyName).toBe(null);
    expect(waste.intermediary3CompanySiret).toBe(null);
  });

  it("should work with 2 intermediaries", async () => {
    // Given
    const intermediary1 = await companyFactory({});
    const intermediary2 = await companyFactory({});
    const bsda = await bsdaFactory({
      opt: {
        intermediaries: {
          create: [
            toIntermediaryCompany(intermediary1),
            toIntermediaryCompany(intermediary2)
          ]
        }
      }
    });

    // When
    const bsdaForRegistry = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsda.id },
      include: RegistryBsdaInclude
    });
    const waste = toAllWaste(bsdaForRegistry);

    // Then
    expect(waste).not.toBeUndefined();
    expect(waste.intermediary1CompanyName).toBe(intermediary1.name);
    expect(waste.intermediary1CompanySiret).toBe(intermediary1.siret);
    expect(waste.intermediary2CompanyName).toBe(intermediary2.name);
    expect(waste.intermediary2CompanySiret).toBe(intermediary2.siret);
    expect(waste.intermediary3CompanyName).toBe(null);
    expect(waste.intermediary3CompanySiret).toBe(null);
  });

  it("should not crash if no intermediary", async () => {
    // Given
    const bsda = await bsdaFactory({});

    // When
    const bsdaForRegistry = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsda.id },
      include: RegistryBsdaInclude
    });
    const waste = toAllWaste(bsdaForRegistry);

    // Then
    expect(waste).not.toBeUndefined();
    expect(waste.intermediary1CompanyName).toBe(null);
    expect(waste.intermediary1CompanySiret).toBe(null);
    expect(waste.intermediary2CompanyName).toBe(null);
    expect(waste.intermediary2CompanySiret).toBe(null);
    expect(waste.intermediary3CompanyName).toBe(null);
    expect(waste.intermediary3CompanySiret).toBe(null);
  });

  it("should contain transporters info including plates", async () => {
    // Given
    const data = await createBsdaWith5Transporters();

    // When
    const waste = toAllWaste(data.bsda);

    // Then
    expect(waste.transporterCompanySiret).toBe(data.transporter1.siret);
    expect(waste.transporterNumberPlates).toStrictEqual([
      "TRANSPORTER1-NBR-PLATES"
    ]);

    expect(waste.transporter2CompanySiret).toBe(data.transporter2.siret);
    expect(waste.transporter2NumberPlates).toStrictEqual([
      "TRANSPORTER2-NBR-PLATES"
    ]);

    expect(waste.transporter3CompanySiret).toBe(data.transporter3.siret);
    expect(waste.transporter3NumberPlates).toStrictEqual([
      "TRANSPORTER3-NBR-PLATES"
    ]);

    expect(waste.transporter4CompanySiret).toBe(data.transporter4.siret);
    expect(waste.transporter4NumberPlates).toStrictEqual([
      "TRANSPORTER4-NBR-PLATES"
    ]);

    expect(waste.transporter5CompanySiret).toBe(data.transporter5.vatNumber);
    expect(waste.transporter5NumberPlates).toStrictEqual([
      "TRANSPORTER5-NBR-PLATES"
    ]);
  });

  it("if forwarding BSD, should contain the info of the initial emitter", async () => {
    // Given
    const emitter = await companyFactory({
      name: "Acme Inc.",
      address: "4 boulevard Pasteur 44100 Nantes"
    });
    const forwardedBsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: emitter.siret,
        emitterCompanyName: emitter.name,
        emitterCompanyAddress: emitter.address
      }
    });
    const forwardingBsda = await bsdaFactory({
      opt: {
        forwarding: { connect: { id: forwardedBsda.id } },
        emitterCompanyName: emitter.name,
        emitterCompanyAddress: emitter.address,
        emitterCompanySiret: emitter.siret
      }
    });

    // When
    const forwardingBsdaForRegistry = await prisma.bsda.findUniqueOrThrow({
      where: { id: forwardingBsda.id },
      include: RegistryBsdaInclude
    });
    const waste = toAllWaste(forwardingBsdaForRegistry);

    // Then
    expect(waste.initialEmitterCompanyAddress).toBe("4 boulevard Pasteur");
    expect(waste.initialEmitterCompanyPostalCode).toBe("44100");
    expect(waste.initialEmitterCompanyCity).toBe("Nantes");
    expect(waste.initialEmitterCompanyCountry).toBe("FR");
    expect(waste.initialEmitterCompanyName).toBe("Acme Inc.");
    expect(waste.initialEmitterCompanySiret).toBe(emitter.siret);
  });
});

describe("toTransportedWaste", () => {
  afterAll(resetDatabase);

  it("should contain transporters info including plates", async () => {
    // Given
    const data = await createBsdaWith5Transporters();

    // When
    const waste = toTransportedWaste(data.bsda);

    // Then
    expect(waste.transporterCompanySiret).toBe(data.transporter1.siret);
    expect(waste.transporterNumberPlates).toStrictEqual([
      "TRANSPORTER1-NBR-PLATES"
    ]);

    expect(waste.transporter2CompanySiret).toBe(data.transporter2.siret);
    expect(waste.transporter2NumberPlates).toStrictEqual([
      "TRANSPORTER2-NBR-PLATES"
    ]);

    expect(waste.transporter3CompanySiret).toBe(data.transporter3.siret);
    expect(waste.transporter3NumberPlates).toStrictEqual([
      "TRANSPORTER3-NBR-PLATES"
    ]);

    expect(waste.transporter4CompanySiret).toBe(data.transporter4.siret);
    expect(waste.transporter4NumberPlates).toStrictEqual([
      "TRANSPORTER4-NBR-PLATES"
    ]);

    expect(waste.transporter5CompanySiret).toBe(data.transporter5.vatNumber);
    expect(waste.transporter5NumberPlates).toStrictEqual([
      "TRANSPORTER5-NBR-PLATES"
    ]);
  });
});

describe("toGenericWaste", () => {
  afterAll(resetDatabase);

  it("should return destinationCompanyEmail & brokerCompanyMail", async () => {
    // Given
    const form = await bsdaFactory({
      opt: {
        destinationCompanyMail: "destination@mail.com",
        brokerCompanyMail: "broker@mail.com"
      }
    });

    // When
    const bsdaForRegistry = await prisma.bsda.findUniqueOrThrow({
      where: { id: form.id },
      include: RegistryBsdaInclude
    });
    const waste = toGenericWaste(bsdaForRegistry);

    // Then
    expect(waste.destinationCompanyMail).toStrictEqual("destination@mail.com");
    expect(waste.brokerCompanyMail).toStrictEqual("broker@mail.com");
  });

  it("should contain destination's splitted address, name & siret", async () => {
    // Given
    const destination = await companyFactory({
      name: "Acme Inc",
      address: "4 Boulevard Pasteur 44100 Nantes"
    });
    const bsda = await bsdaFactory({
      opt: {
        destinationCompanyName: destination.name,
        destinationCompanyAddress: destination.address,
        destinationCompanySiret: destination.siret
      }
    });

    // When
    const bsdaForRegistry = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsda.id },
      include: RegistryBsdaInclude
    });
    const waste = toGenericWaste(bsdaForRegistry);

    // Then
    expect(waste.destinationCompanyAddress).toBe("4 Boulevard Pasteur");
    expect(waste.destinationCompanyPostalCode).toBe("44100");
    expect(waste.destinationCompanyCity).toBe("Nantes");
    expect(waste.destinationCompanyCountry).toBe("FR");

    expect(waste.destinationCompanySiret).toBe(destination.siret);
    expect(waste.destinationCompanyName).toBe(destination.name);
  });
});

describe("getSubType", () => {
  afterAll(resetDatabase);

  it("type is OTHER_COLLECTIONS > should return INITIAL", async () => {
    // Given
    const bsda = await bsdaFactory({ opt: { type: "OTHER_COLLECTIONS" } });

    // When
    const bsdaForRegistry = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsda.id },
      include: RegistryBsdaInclude
    });
    const subType = getSubType(bsdaForRegistry);

    // Then
    expect(subType).toBe("INITIAL");
  });

  it.each([BsdaType.GATHERING, BsdaType.RESHIPMENT, BsdaType.COLLECTION_2710])(
    "type is %p > should return %p",
    async type => {
      // Given
      const bsda = await bsdaFactory({ opt: { type } });

      // When
      const bsdaForRegistry = await prisma.bsda.findUniqueOrThrow({
        where: { id: bsda.id },
        include: RegistryBsdaInclude
      });
      const subType = getSubType(bsdaForRegistry);

      // Then
      expect(subType).toBe(type);
    }
  );
});

describe("getTransportersData", () => {
  afterAll(resetDatabase);

  it("should contain the splitted addresses of all transporters", async () => {
    // Given
    const data = await createBsdaWith5Transporters();

    // When
    const waste = getTransportersData(data.bsda);

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
