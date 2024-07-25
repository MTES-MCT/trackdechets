import {
  toAllWaste,
  toIncomingWaste,
  toManagedWaste,
  toOutgoingWaste,
  toTransportedWaste,
  toGenericWaste
} from "../registry";
import { prisma } from "@td/prisma";
import { RegistryBsdasriInclude } from "../../registry/elastic";
import { bsdasriFactory } from "./factories";
import { resetDatabase } from "../../../integration-tests/helper";
import { companyFactory } from "../../__tests__/factories";
import { siretify } from "../../__tests__/factories";

describe("toGenericWaste", () => {
  afterAll(resetDatabase);

  it("should contain destinationCompanyMail", async () => {
    // Given
    const bsdasri = await bsdasriFactory({
      opt: { destinationCompanyMail: "destination@mail.com" }
    });

    // When
    const bsdasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: bsdasri.id },
      include: RegistryBsdasriInclude
    });
    const waste = toGenericWaste(bsdasriForRegistry);

    // Then
    expect(waste.destinationCompanyMail).toBe("destination@mail.com");
  });

  it("should contain destinationCompanyMail", async () => {
    // Given
    const bsdasri = await bsdasriFactory({
      opt: { destinationCompanyMail: "destination@mail.com" }
    });

    // When
    const bsdasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: bsdasri.id },
      include: RegistryBsdasriInclude
    });
    const waste = toGenericWaste(bsdasriForRegistry);

    // Then
    expect(waste.destinationCompanyMail).toBe("destination@mail.com");
  });

  it("should contain destination's splitted address, name & siret", async () => {
    // Given
    const destination = await companyFactory({
      name: "Acme Inc",
      address: "4 Boulevard Pasteur 44100 Nantes"
    });
    const bsdasri = await bsdasriFactory({
      opt: {
        destinationCompanyName: destination.name,
        destinationCompanyAddress: destination.address,
        destinationCompanySiret: destination.siret
      }
    });

    // When
    const bsdasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: bsdasri.id },
      include: RegistryBsdasriInclude
    });
    const waste = toGenericWaste(bsdasriForRegistry);

    // Then
    expect(waste.destinationCompanyAddress).toBe("4 Boulevard Pasteur");
    expect(waste.destinationCompanyPostalCode).toBe("44100");
    expect(waste.destinationCompanyCity).toBe("Nantes");
    expect(waste.destinationCompanyCountry).toBe("FR");

    expect(waste.destinationCompanySiret).toBe(destination.siret);
    expect(waste.destinationCompanyName).toBe(destination.name);
  });

  it("should contain emitterPickupSite's splitted address & name", async () => {
    // Given
    const bsdasri = await bsdasriFactory({
      opt: {
        emitterPickupSiteName: "Site name",
        emitterPickupSiteAddress: "4 Boulevard Pasteur",
        emitterPickupSitePostalCode: "44100",
        emitterPickupSiteCity: "Nantes"
      }
    });

    // When
    const bsdasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: bsdasri.id },
      include: RegistryBsdasriInclude
    });
    const waste = toGenericWaste(bsdasriForRegistry);

    // Then
    expect(waste.emitterPickupsiteName).toBe("Site name");
    expect(waste.emitterPickupsiteAddress).toBe("4 Boulevard Pasteur");
    expect(waste.emitterPickupsitePostalCode).toBe("44100");
    expect(waste.emitterPickupsiteCity).toBe("Nantes");
    expect(waste.emitterPickupsiteCountry).toBe("FR");
  });

  it("should contain emitter's splitted address, name & siret", async () => {
    // Given
    const emitter = await companyFactory({
      name: "Emitter company name",
      address: "4 Boulevard Pasteur 44100 Nantes"
    });
    const bsdasri = await bsdasriFactory({
      opt: {
        emitterCompanySiret: emitter.siret,
        emitterCompanyName: emitter.name,
        emitterCompanyAddress: emitter.address
      }
    });

    // When
    const bsdasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: bsdasri.id },
      include: RegistryBsdasriInclude
    });
    const waste = toGenericWaste(bsdasriForRegistry);

    // Then
    expect(waste.emitterCompanyName).toBe(emitter.name);
    expect(waste.emitterCompanySiret).toBe(emitter.siret);
    expect(waste.emitterCompanyAddress).toBe("4 Boulevard Pasteur");
    expect(waste.emitterCompanyPostalCode).toBe("44100");
    expect(waste.emitterCompanyCity).toBe("Nantes");
    expect(waste.emitterCompanyCountry).toBe("FR");
  });
});

describe("toIncomingWaste", () => {
  afterAll(resetDatabase);

  it("should contain transporters info except plates", async () => {
    // Given
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });
    const dasri = await bsdasriFactory({
      opt: {
        destinationCompanyMail: "destination@mail.com",
        transporterCompanySiret: transporter.siret,
        transporterTransportPlates: ["TRANSPORTER-NBR-PLATES"]
      }
    });

    // When
    const dasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id },
      include: RegistryBsdasriInclude
    });
    const waste = toIncomingWaste(dasriForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      dasriForRegistry.transporterCompanySiret
    );
    expect(waste["transporterNumberPlates"]).toBeUndefined();

    expect(waste.transporter2CompanySiret).toBeNull();
    expect(waste["transporter2NumberPlates"]).toBeUndefined();

    expect(waste.transporter3CompanySiret).toBeNull();
    expect(waste["transporter3NumberPlates"]).toBeUndefined();

    expect(waste.transporter4CompanySiret).toBeNull();
    expect(waste["transporter4NumberPlates"]).toBeUndefined();

    expect(waste.transporter5CompanySiret).toBeNull();
    expect(waste["transporter5NumberPlates"]).toBeUndefined();
  });

  it("should contain null initialEmitter data", async () => {
    // Given
    const dasri = await bsdasriFactory({});

    // When
    const dasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id },
      include: RegistryBsdasriInclude
    });
    const waste = toIncomingWaste(dasriForRegistry);

    // Then
    expect(waste.initialEmitterCompanyAddress).toBeNull();
    expect(waste.initialEmitterCompanyPostalCode).toBeNull();
    expect(waste.initialEmitterCompanyCity).toBeNull();
    expect(waste.initialEmitterCompanyCountry).toBeNull();
    expect(waste.initialEmitterCompanyName).toBeNull();
    expect(waste.initialEmitterCompanySiret).toBeNull();
  });

  it("should contain emitted weight and destinationReception weight, acceptedWeight, & refusedWeight", async () => {
    // Given
    const bsdasri = await bsdasriFactory({
      opt: {
        emitterWasteWeightValue: 56.5,
        destinationReceptionAcceptationStatus: "PARTIALLY_REFUSED",
        destinationReceptionWasteWeightValue: 78.9
      }
    });

    // When
    const bsdasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: bsdasri.id },
      include: RegistryBsdasriInclude
    });
    const wasteRegistry = toIncomingWaste(bsdasriForRegistry);

    // Then
    expect(wasteRegistry.weight).toBe(0.0565);
    expect(wasteRegistry.destinationReceptionWeight).toBe(0.0789);
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
      const finalBsdasri1 = await bsdasriFactory({
        opt: {
          destinationOperationCode: "R 5",
          destinationOperationSignatureDate: new Date(),
          destinationReceptionWasteWeightValue: 1,
          destinationCompanySiret: siretify()
        }
      });
      const finalBsdasri2 = await bsdasriFactory({
        opt: {
          destinationOperationCode: "D 5",
          destinationOperationSignatureDate: new Date(),
          destinationReceptionWasteWeightValue: 2,
          destinationCompanySiret: siretify()
        }
      });

      const bsdasri = await bsdasriFactory({
        opt: {
          destinationOperationCode: "D 13",
          destinationOperationSignatureDate: new Date(),
          finalOperations: {
            createMany: {
              data: [
                {
                  finalBsdasriId: finalBsdasri1.id,
                  operationCode: finalBsdasri1.destinationOperationCode!,
                  quantity: finalBsdasri1.destinationReceptionWasteWeightValue!
                },
                {
                  finalBsdasriId: finalBsdasri2.id,
                  operationCode: finalBsdasri2.destinationOperationCode!,
                  quantity: finalBsdasri2.destinationReceptionWasteWeightValue!
                }
              ]
            }
          }
        }
      });
      const bsdasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
        where: { id: bsdasri.id },
        include: RegistryBsdasriInclude
      });
      const waste = toOutgoingWaste(bsdasriForRegistry);
      expect(waste.destinationFinalOperationCodes).toStrictEqual([
        finalBsdasri1.destinationOperationCode,
        finalBsdasri2.destinationOperationCode
      ]);
      expect(waste.destinationFinalOperationWeights).toStrictEqual([
        finalBsdasri1.destinationReceptionWasteWeightValue
          ?.dividedBy(1000)
          .toNumber(),
        finalBsdasri2.destinationReceptionWasteWeightValue
          ?.dividedBy(1000)
          .toNumber()
      ]);
      expect(waste.destinationFinalOperationCompanySirets).toStrictEqual([
        finalBsdasri1.destinationCompanySiret,
        finalBsdasri2.destinationCompanySiret
      ]);
    }
  );

  test(
    "destinationFinalOperationCodes and destinationfinalOperationWeights should be empty" +
      " when bsdasri has a final operation",
    async () => {
      const bsdasri = await bsdasriFactory({
        opt: {
          destinationOperationCode: "R 1",
          destinationOperationSignatureDate: new Date(),
          destinationReceptionWasteWeightValue: 1
        }
      });

      await prisma.bsdasri.update({
        where: { id: bsdasri.id },
        data: {
          finalOperations: {
            createMany: {
              data: [
                {
                  finalBsdasriId: bsdasri.id,
                  operationCode: bsdasri.destinationOperationCode!,
                  quantity: bsdasri.destinationReceptionWasteWeightValue!
                }
              ]
            }
          }
        }
      });

      const bsdasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
        where: { id: bsdasri.id },
        include: RegistryBsdasriInclude
      });
      const waste = toOutgoingWaste(bsdasriForRegistry);
      expect(waste.destinationFinalOperationCodes).toStrictEqual([]);
      expect(waste.destinationFinalOperationWeights).toStrictEqual([]);
      expect(waste.destinationFinalOperationCompanySirets).toStrictEqual([]);
    }
  );

  it("should contain emitted weight and destinationReception weight, acceptedWeight, & refusedWeight", async () => {
    // Given
    const bsdasri = await bsdasriFactory({
      opt: {
        emitterWasteWeightValue: 56.5,
        destinationReceptionAcceptationStatus: "PARTIALLY_REFUSED",
        destinationReceptionWasteWeightValue: 78.9
      }
    });

    // When
    const bsdasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: bsdasri.id },
      include: RegistryBsdasriInclude
    });
    const wasteRegistry = toOutgoingWaste(bsdasriForRegistry);

    // Then
    expect(wasteRegistry.weight).toBe(0.0565);
    expect(wasteRegistry.destinationReceptionWeight).toBe(0.0789);
    expect(wasteRegistry.destinationReceptionAcceptedWeight).toBeNull();
    expect(wasteRegistry.destinationReceptionRefusedWeight).toBeNull();
  });

  it("should contain transporters info except plates", async () => {
    // Given
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });
    const dasri = await bsdasriFactory({
      opt: {
        destinationCompanyMail: "destination@mail.com",
        transporterCompanySiret: transporter.siret,
        transporterTransportPlates: ["TRANSPORTER-NBR-PLATES"]
      }
    });

    // When
    const dasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id },
      include: RegistryBsdasriInclude
    });
    const waste = toOutgoingWaste(dasriForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      dasriForRegistry.transporterCompanySiret
    );
    expect(waste["transporterNumberPlates"]).toBeUndefined();

    expect(waste.transporter2CompanySiret).toBeNull();
    expect(waste["transporter2NumberPlates"]).toBeUndefined();

    expect(waste.transporter3CompanySiret).toBeNull();
    expect(waste["transporter3NumberPlates"]).toBeUndefined();

    expect(waste.transporter4CompanySiret).toBeNull();
    expect(waste["transporter4NumberPlates"]).toBeUndefined();

    expect(waste.transporter5CompanySiret).toBeNull();
    expect(waste["transporter5NumberPlates"]).toBeUndefined();
  });

  it("should contain null initialEmitter data", async () => {
    // Given
    const dasri = await bsdasriFactory({});

    // When
    const dasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id },
      include: RegistryBsdasriInclude
    });
    const waste = toOutgoingWaste(dasriForRegistry);

    // Then
    expect(waste.initialEmitterCompanyAddress).toBeNull();
    expect(waste.initialEmitterCompanyPostalCode).toBeNull();
    expect(waste.initialEmitterCompanyCity).toBeNull();
    expect(waste.initialEmitterCompanyCountry).toBeNull();
    expect(waste.initialEmitterCompanyName).toBeNull();
    expect(waste.initialEmitterCompanySiret).toBeNull();
  });
});

describe("toTransportedWaste", () => {
  afterAll(resetDatabase);

  it("should contain emitted weight and destinationReception weight, acceptedWeight, & refusedWeight", async () => {
    // Given
    const bsdasri = await bsdasriFactory({
      opt: {
        emitterWasteWeightValue: 56.5,
        destinationReceptionAcceptationStatus: "PARTIALLY_REFUSED",
        destinationReceptionWasteWeightValue: 78.9
      }
    });

    // When
    const bsdasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: bsdasri.id },
      include: RegistryBsdasriInclude
    });
    const wasteRegistry = toTransportedWaste(bsdasriForRegistry);

    // Then
    expect(wasteRegistry.weight).toBe(0.0565);
    expect(wasteRegistry.destinationReceptionWeight).toBe(0.0789);
  });

  it("should contain transporters info including plates", async () => {
    // Given
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });
    const dasri = await bsdasriFactory({
      opt: {
        destinationCompanyMail: "destination@mail.com",
        transporterCompanySiret: transporter.siret,
        transporterTransportPlates: ["TRANSPORTER-NBR-PLATES"]
      }
    });

    // When
    const dasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id },
      include: RegistryBsdasriInclude
    });
    const waste = toTransportedWaste(dasriForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      dasriForRegistry.transporterCompanySiret
    );
    expect(waste.transporterNumberPlates).toStrictEqual([
      "TRANSPORTER-NBR-PLATES"
    ]);

    expect(waste.transporter2CompanySiret).toBeNull();
    expect(waste.transporter2NumberPlates).toBeNull();

    expect(waste.transporter3CompanySiret).toBeNull();
    expect(waste.transporter3NumberPlates).toBeNull();

    expect(waste.transporter4CompanySiret).toBeNull();
    expect(waste.transporter4NumberPlates).toBeNull();

    expect(waste.transporter5CompanySiret).toBeNull();
    expect(waste.transporter5NumberPlates).toBeNull();
  });
});

describe("toManagedWaste", () => {
  afterAll(resetDatabase);

  it("should contain emitted weight and destinationReception weight, acceptedWeight, & refusedWeight", async () => {
    // Given
    const bsdasri = await bsdasriFactory({
      opt: {
        emitterWasteWeightValue: 56.5,
        destinationReceptionAcceptationStatus: "PARTIALLY_REFUSED",
        destinationReceptionWasteWeightValue: 78.9
      }
    });

    // When
    const bsdasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: bsdasri.id },
      include: RegistryBsdasriInclude
    });
    const wasteRegistry = toManagedWaste(bsdasriForRegistry);

    // Then
    expect(wasteRegistry.weight).toBe(0.0565);
    expect(wasteRegistry.destinationReceptionWeight).toBe(0.0789);
    expect(wasteRegistry.destinationReceptionAcceptedWeight).toBeNull();
    expect(wasteRegistry.destinationReceptionRefusedWeight).toBeNull();
  });

  it("should contain transporters info except plates", async () => {
    // Given
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });
    const dasri = await bsdasriFactory({
      opt: {
        destinationCompanyMail: "destination@mail.com",
        transporterCompanySiret: transporter.siret,
        transporterTransportPlates: ["TRANSPORTER-NBR-PLATES"]
      }
    });

    // When
    const dasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id },
      include: RegistryBsdasriInclude
    });
    const waste = toManagedWaste(dasriForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      dasriForRegistry.transporterCompanySiret
    );
    expect(waste["transporterNumberPlates"]).toBeUndefined();

    expect(waste.transporter2CompanySiret).toBeNull();
    expect(waste["transporter2NumberPlates"]).toBeUndefined();

    expect(waste.transporter3CompanySiret).toBeNull();
    expect(waste["transporter3NumberPlates"]).toBeUndefined();

    expect(waste.transporter4CompanySiret).toBeNull();
    expect(waste["transporter4NumberPlates"]).toBeUndefined();

    expect(waste.transporter5CompanySiret).toBeNull();
    expect(waste["transporter5NumberPlates"]).toBeUndefined();
  });
});

describe("toAllWaste", () => {
  afterAll(resetDatabase);

  it(
    "should compute destinationFinalOperationCodes" +
      " and destinationfinalOperationWeights",
    async () => {
      const finalBsdasri1 = await bsdasriFactory({
        opt: {
          destinationOperationCode: "R 5",
          destinationOperationSignatureDate: new Date(),
          destinationReceptionWasteWeightValue: 1,
          destinationCompanySiret: siretify()
        }
      });
      const finalBsdasri2 = await bsdasriFactory({
        opt: {
          destinationOperationCode: "D 5",
          destinationOperationSignatureDate: new Date(),
          destinationReceptionWasteWeightValue: 2,
          destinationCompanySiret: siretify()
        }
      });

      const form = await bsdasriFactory({
        opt: {
          destinationOperationCode: "D 13",
          destinationOperationSignatureDate: new Date(),
          finalOperations: {
            createMany: {
              data: [
                {
                  finalBsdasriId: finalBsdasri1.id,
                  operationCode: finalBsdasri1.destinationOperationCode!,
                  quantity: finalBsdasri1.destinationReceptionWasteWeightValue!
                },
                {
                  finalBsdasriId: finalBsdasri2.id,
                  operationCode: finalBsdasri2.destinationOperationCode!,
                  quantity: finalBsdasri2.destinationReceptionWasteWeightValue!
                }
              ]
            }
          }
        }
      });
      const bsdasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
        where: { id: form.id },
        include: RegistryBsdasriInclude
      });
      const waste = toAllWaste(bsdasriForRegistry);
      expect(waste.destinationFinalOperationCodes).toStrictEqual([
        finalBsdasri1.destinationOperationCode,
        finalBsdasri2.destinationOperationCode
      ]);
      expect(waste.destinationFinalOperationWeights).toStrictEqual([
        finalBsdasri1.destinationReceptionWasteWeightValue
          ?.dividedBy(1000)
          .toNumber(),
        finalBsdasri2.destinationReceptionWasteWeightValue
          ?.dividedBy(1000)
          .toNumber()
      ]);
      expect(waste.destinationFinalOperationCompanySirets).toStrictEqual([
        finalBsdasri1.destinationCompanySiret,
        finalBsdasri2.destinationCompanySiret
      ]);
    }
  );

  test(
    "destinationFinalOperationCodes and destinationfinalOperationWeights should be empty" +
      " when bsdasri has a final operation",
    async () => {
      const bsdasri = await bsdasriFactory({
        opt: {
          destinationOperationCode: "R 1",
          destinationOperationSignatureDate: new Date(),
          destinationReceptionWasteWeightValue: 1
        }
      });

      await prisma.bsdasri.update({
        where: { id: bsdasri.id },
        data: {
          finalOperations: {
            createMany: {
              data: [
                {
                  finalBsdasriId: bsdasri.id,
                  operationCode: bsdasri.destinationOperationCode!,
                  quantity: bsdasri.destinationReceptionWasteWeightValue!
                }
              ]
            }
          }
        }
      });

      const bsdasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
        where: { id: bsdasri.id },
        include: RegistryBsdasriInclude
      });
      const waste = toAllWaste(bsdasriForRegistry);
      expect(waste.destinationFinalOperationCodes).toStrictEqual([]);
      expect(waste.destinationFinalOperationWeights).toStrictEqual([]);
      expect(waste.destinationFinalOperationCompanySirets).toStrictEqual([]);
    }
  );

  it("should contain emitted weight and destinationReception weight, acceptedWeight, & refusedWeight", async () => {
    // Given
    const bsdasri = await bsdasriFactory({
      opt: {
        emitterWasteWeightValue: 56.5,
        destinationReceptionAcceptationStatus: "PARTIALLY_REFUSED",
        destinationReceptionWasteWeightValue: 78.9
      }
    });

    // Given
    const bsdasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: bsdasri.id },
      include: RegistryBsdasriInclude
    });
    const wasteRegistry = toAllWaste(bsdasriForRegistry);

    // Then
    expect(wasteRegistry.weight).toBe(0.0565);
    expect(wasteRegistry.destinationReceptionWeight).toBe(0.0789);
    expect(wasteRegistry.destinationReceptionAcceptedWeight).toBeNull();
    expect(wasteRegistry.destinationReceptionRefusedWeight).toBeNull();
  });

  it("should contain transporters info including plates", async () => {
    // Given
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });
    const dasri = await bsdasriFactory({
      opt: {
        destinationCompanyMail: "destination@mail.com",
        transporterCompanySiret: transporter.siret,
        transporterTransportPlates: ["TRANSPORTER-NBR-PLATES"]
      }
    });

    // When
    const dasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id },
      include: RegistryBsdasriInclude
    });
    const waste = toAllWaste(dasriForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      dasriForRegistry.transporterCompanySiret
    );
    expect(waste.transporterNumberPlates).toStrictEqual([
      "TRANSPORTER-NBR-PLATES"
    ]);

    expect(waste.transporter2CompanySiret).toBeNull();
    expect(waste.transporter2NumberPlates).toBeNull();

    expect(waste.transporter3CompanySiret).toBeNull();
    expect(waste.transporter3NumberPlates).toBeNull();

    expect(waste.transporter4CompanySiret).toBeNull();
    expect(waste.transporter4NumberPlates).toBeNull();

    expect(waste.transporter5CompanySiret).toBeNull();
    expect(waste.transporter5NumberPlates).toBeNull();
  });

  it("should contain null initialEmitter data", async () => {
    // Given
    const dasri = await bsdasriFactory({});

    // When
    const dasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id },
      include: RegistryBsdasriInclude
    });
    const waste = toAllWaste(dasriForRegistry);

    // Then
    expect(waste.initialEmitterCompanyAddress).toBeNull();
    expect(waste.initialEmitterCompanyPostalCode).toBeNull();
    expect(waste.initialEmitterCompanyCity).toBeNull();
    expect(waste.initialEmitterCompanyCountry).toBeNull();
    expect(waste.initialEmitterCompanyName).toBeNull();
    expect(waste.initialEmitterCompanySiret).toBeNull();
  });
});

describe("getTransporterData", () => {
  afterAll(resetDatabase);

  it("should contain the splitted addresses of all transporters", async () => {
    // Given
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });
    const dasri = await bsdasriFactory({
      opt: {
        transporterCompanySiret: transporter.siret,
        transporterCompanyAddress: "4 Boulevard Pasteur 44100 Nantes"
      }
    });

    // When
    const dasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id },
      include: RegistryBsdasriInclude
    });
    const waste = toAllWaste(dasriForRegistry);

    // Then
    expect(waste.transporterCompanyAddress).toBe("4 Boulevard Pasteur");
    expect(waste.transporterCompanyPostalCode).toBe("44100");
    expect(waste.transporterCompanyCity).toBe("Nantes");
    expect(waste.transporterCompanyCountry).toBe("FR");
  });
});
