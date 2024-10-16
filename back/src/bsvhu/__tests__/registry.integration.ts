import { prisma } from "@td/prisma";
import {
  toAllWaste,
  toGenericWaste,
  toIncomingWaste,
  toManagedWaste,
  toOutgoingWaste,
  toTransportedWaste
} from "../registry";
import { bsvhuFactory, toIntermediaryCompany } from "./factories.vhu";
import { resetDatabase } from "../../../integration-tests/helper";
import { companyFactory, ecoOrganismeFactory } from "../../__tests__/factories";
import { RegistryBsvhuInclude } from "../../registry/elastic";

describe("toGenericWaste", () => {
  afterAll(resetDatabase);

  it("should contain destinationCompanyMail", async () => {
    // Given
    const bsvhu = await bsvhuFactory({
      opt: { destinationCompanyMail: "destination@mail.com" }
    });

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id },
      include: RegistryBsvhuInclude
    });
    const waste = toGenericWaste(bsvhuForRegistry);

    // Then
    expect(waste.destinationCompanyMail).toBe("destination@mail.com");
  });

  it("should contain emitter's natively splitted address if available", async () => {
    // Given
    const emitter = await companyFactory({
      name: "Emitter company name",
      address: null
    });
    const bsvhu = await bsvhuFactory({
      opt: {
        emitterCompanySiret: emitter.siret,
        emitterCompanyName: emitter.name,
        emitterCompanyStreet: "17 rue Robert Doisneau",
        emitterCompanyPostalCode: "13370",
        emitterCompanyCity: "Mallemort"
      }
    });

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id },
      include: RegistryBsvhuInclude
    });

    const waste = toGenericWaste(bsvhuForRegistry);

    // Then
    expect(waste.emitterCompanyAddress).toBe("17 rue Robert Doisneau");
    expect(waste.emitterCompanyPostalCode).toBe("13370");
    expect(waste.emitterCompanyCity).toBe("Mallemort");
    expect(waste.emitterCompanyCountry).toBe("FR");
  });

  it("should contain broker and trader emails", async () => {
    // Given
    const bsvhu = await bsvhuFactory({
      opt: {
        brokerCompanyMail: "broker@mail.com",
        traderCompanyMail: "trader@mail.com"
      }
    });

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id },
      include: RegistryBsvhuInclude
    });
    const waste = toGenericWaste(bsvhuForRegistry);

    // Then
    expect(waste.brokerCompanyMail).toBe("broker@mail.com");
    expect(waste.traderCompanyMail).toBe("trader@mail.com");
  });
});

describe("toIncomingWaste", () => {
  afterAll(resetDatabase);

  it("should contain emitted weight and destinationReception weight, acceptedWeight, & refusedWeight", async () => {
    // Given
    const bsvhu = await bsvhuFactory({
      opt: {
        weightValue: 56.5,
        destinationReceptionAcceptationStatus: "PARTIALLY_REFUSED",
        destinationReceptionWeight: 78.9
      }
    });

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id },
      include: RegistryBsvhuInclude
    });
    const wasteRegistry = toIncomingWaste(bsvhuForRegistry);

    // Then
    expect(wasteRegistry.weight).toBe(0.0565);
    expect(wasteRegistry.destinationReceptionWeight).toBe(0.0789);
    expect(wasteRegistry.destinationReceptionAcceptedWeight).toBeNull();
    expect(wasteRegistry.destinationReceptionRefusedWeight).toBeNull();
  });

  it("should contain transporters info except plates", async () => {
    // Given
    const bsvhu = await bsvhuFactory({
      opt: { destinationCompanyMail: "destination@mail.com" }
    });

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id },
      include: RegistryBsvhuInclude
    });
    const waste = toIncomingWaste(bsvhuForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      bsvhuForRegistry.transporterCompanySiret
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
    const bsvhu = await bsvhuFactory({});

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id },
      include: RegistryBsvhuInclude
    });
    const waste = toIncomingWaste(bsvhuForRegistry);

    // Then
    expect(waste.initialEmitterCompanyAddress).toBeNull();
    expect(waste.initialEmitterCompanyPostalCode).toBeNull();
    expect(waste.initialEmitterCompanyCity).toBeNull();
    expect(waste.initialEmitterCompanyCountry).toBeNull();
    expect(waste.initialEmitterCompanyName).toBeNull();
    expect(waste.initialEmitterCompanySiret).toBeNull();
  });

  it("should contain broker and trader information", async () => {
    // Given
    const bsvhu = await bsvhuFactory({});

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id },
      include: RegistryBsvhuInclude
    });
    const waste = toIncomingWaste(bsvhuForRegistry);

    // Then
    expect(waste.brokerCompanySiret).toBe(bsvhuForRegistry.brokerCompanySiret);
    expect(waste.brokerCompanyName).toBe(bsvhuForRegistry.brokerCompanyName);
    expect(waste.brokerRecepisseNumber).toBe(
      bsvhuForRegistry.brokerRecepisseNumber
    );
    expect(waste.traderCompanySiret).toBe(bsvhuForRegistry.traderCompanySiret);
    expect(waste.traderCompanyName).toBe(bsvhuForRegistry.traderCompanyName);
    expect(waste.traderRecepisseNumber).toBe(
      bsvhuForRegistry.traderRecepisseNumber
    );
  });
});

describe("toOutgoingWaste", () => {
  afterAll(resetDatabase);

  it("should contain emitted weight and destinationReception weight, acceptedWeight, & refusedWeight", async () => {
    // Given
    const bsvhu = await bsvhuFactory({
      opt: {
        weightValue: 56.5,
        destinationReceptionAcceptationStatus: "PARTIALLY_REFUSED",
        destinationReceptionWeight: 78.9
      }
    });

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id },
      include: RegistryBsvhuInclude
    });
    const wasteRegistry = toOutgoingWaste(bsvhuForRegistry);

    // Then
    expect(wasteRegistry.weight).toBe(0.0565);
    expect(wasteRegistry.destinationReceptionWeight).toBe(0.0789);
    expect(wasteRegistry.destinationReceptionAcceptedWeight).toBeNull();
    expect(wasteRegistry.destinationReceptionRefusedWeight).toBeNull();
  });

  it("should contain null initialEmitter data", async () => {
    // Given
    const bsvhu = await bsvhuFactory({});

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id },
      include: RegistryBsvhuInclude
    });
    const waste = toOutgoingWaste(bsvhuForRegistry);

    // Then
    expect(waste.initialEmitterCompanyAddress).toBeNull();
    expect(waste.initialEmitterCompanyPostalCode).toBeNull();
    expect(waste.initialEmitterCompanyCity).toBeNull();
    expect(waste.initialEmitterCompanyCountry).toBeNull();
    expect(waste.initialEmitterCompanyName).toBeNull();
    expect(waste.initialEmitterCompanySiret).toBeNull();
  });
  it("should contain broker and trader information", async () => {
    // Given
    const bsvhu = await bsvhuFactory({});

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id },
      include: RegistryBsvhuInclude
    });
    const waste = toOutgoingWaste(bsvhuForRegistry);

    // Then
    expect(waste.brokerCompanySiret).toBe(bsvhuForRegistry.brokerCompanySiret);
    expect(waste.brokerCompanyName).toBe(bsvhuForRegistry.brokerCompanyName);
    expect(waste.brokerRecepisseNumber).toBe(
      bsvhuForRegistry.brokerRecepisseNumber
    );
    expect(waste.traderCompanySiret).toBe(bsvhuForRegistry.traderCompanySiret);
    expect(waste.traderCompanyName).toBe(bsvhuForRegistry.traderCompanyName);
    expect(waste.traderRecepisseNumber).toBe(
      bsvhuForRegistry.traderRecepisseNumber
    );
  });
});

describe("toTransportedWaste", () => {
  afterAll(resetDatabase);

  it("should contain emitted weight and destinationReception weight", async () => {
    // Given
    const bsvhu = await bsvhuFactory({
      opt: {
        weightValue: 56.5,
        destinationReceptionAcceptationStatus: "PARTIALLY_REFUSED",
        destinationReceptionWeight: 78.9
      }
    });

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id },
      include: RegistryBsvhuInclude
    });
    const wasteRegistry = toTransportedWaste(bsvhuForRegistry);

    // Then
    expect(wasteRegistry.weight).toBe(0.0565);
    expect(wasteRegistry.destinationReceptionWeight).toBe(0.0789);
  });

  it("should contain transporters info including plates", async () => {
    // Given
    const bsvhu = await bsvhuFactory({
      opt: {
        destinationCompanyMail: "destination@mail.com",
        transporterTransportPlates: ["TRANSPORTER1-NBR-PLATES"]
      }
    });

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id },
      include: RegistryBsvhuInclude
    });
    const waste = toTransportedWaste(bsvhuForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      bsvhuForRegistry.transporterCompanySiret
    );
    expect(waste.transporterNumberPlates).toStrictEqual([
      "TRANSPORTER1-NBR-PLATES"
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
  it("should contain broker and trader information", async () => {
    // Given
    const bsvhu = await bsvhuFactory({});

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id },
      include: RegistryBsvhuInclude
    });
    const waste = toTransportedWaste(bsvhuForRegistry);

    // Then
    expect(waste.brokerCompanySiret).toBe(bsvhuForRegistry.brokerCompanySiret);
    expect(waste.brokerCompanyName).toBe(bsvhuForRegistry.brokerCompanyName);
    expect(waste.brokerRecepisseNumber).toBe(
      bsvhuForRegistry.brokerRecepisseNumber
    );
    expect(waste.traderCompanySiret).toBe(bsvhuForRegistry.traderCompanySiret);
    expect(waste.traderCompanyName).toBe(bsvhuForRegistry.traderCompanyName);
    expect(waste.traderRecepisseNumber).toBe(
      bsvhuForRegistry.traderRecepisseNumber
    );
  });
});

describe("toManagedWaste", () => {
  afterAll(resetDatabase);

  it("should contain emitted weight and destinationReception weight, acceptedWeight, & refusedWeight", async () => {
    // Given
    const bsvhu = await bsvhuFactory({
      opt: {
        weightValue: 56.5,
        destinationReceptionAcceptationStatus: "PARTIALLY_REFUSED",
        destinationReceptionWeight: 78.9
      }
    });

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id },
      include: RegistryBsvhuInclude
    });
    const wasteRegistry = toManagedWaste(bsvhuForRegistry);

    // Then
    expect(wasteRegistry.weight).toBe(0.0565);
    expect(wasteRegistry.destinationReceptionWeight).toBe(0.0789);
    expect(wasteRegistry.destinationReceptionAcceptedWeight).toBeNull();
    expect(wasteRegistry.destinationReceptionRefusedWeight).toBeNull();
  });

  it("should contain transporters info except plates", async () => {
    // Given
    const bsvhu = await bsvhuFactory({
      opt: { destinationCompanyMail: "destination@mail.com" }
    });

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id },
      include: RegistryBsvhuInclude
    });
    const waste = toManagedWaste(bsvhuForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      bsvhuForRegistry.transporterCompanySiret
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
  it("should contain broker and trader information", async () => {
    // Given
    const bsvhu = await bsvhuFactory({});

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id },
      include: RegistryBsvhuInclude
    });
    const waste = toManagedWaste(bsvhuForRegistry);

    // Then
    expect(waste.brokerCompanySiret).toBe(bsvhuForRegistry.brokerCompanySiret);
    expect(waste.brokerCompanyName).toBe(bsvhuForRegistry.brokerCompanyName);
    expect(waste.traderCompanySiret).toBe(bsvhuForRegistry.traderCompanySiret);
    expect(waste.traderCompanyName).toBe(bsvhuForRegistry.traderCompanyName);
  });
});

describe("toAllWaste", () => {
  afterAll(resetDatabase);

  it("should contain null initialEmitter data", async () => {
    // Given
    const bsvhu = await bsvhuFactory({});

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id },
      include: RegistryBsvhuInclude
    });
    const waste = toAllWaste(bsvhuForRegistry);

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
    const bsvhu = await bsvhuFactory({
      opt: {
        weightValue: 56.5,
        destinationReceptionAcceptationStatus: "PARTIALLY_REFUSED",
        destinationReceptionWeight: 78.9
      }
    });

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id },
      include: RegistryBsvhuInclude
    });
    const wasteRegistry = toAllWaste(bsvhuForRegistry);

    // Then
    expect(wasteRegistry.weight).toBe(0.0565);
    expect(wasteRegistry.destinationReceptionWeight).toBe(0.0789);
    expect(wasteRegistry.destinationReceptionAcceptedWeight).toBeNull();
    expect(wasteRegistry.destinationReceptionRefusedWeight).toBeNull();
  });

  it("should contain transporters info including plates", async () => {
    // Given
    const bsvhu = await bsvhuFactory({
      opt: {
        destinationCompanyMail: "destination@mail.com",
        transporterTransportPlates: ["TRANSPORTER1-NBR-PLATES"]
      }
    });

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id },
      include: RegistryBsvhuInclude
    });
    const waste = toAllWaste(bsvhuForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      bsvhuForRegistry.transporterCompanySiret
    );
    expect(waste.transporterNumberPlates).toStrictEqual([
      "TRANSPORTER1-NBR-PLATES"
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

  it("should contain destination's splitted address, name & siret", async () => {
    // Given
    const destination = await companyFactory({
      name: "Acme Inc",
      address: "4 Boulevard Pasteur 44100 Nantes"
    });
    const bsvhu = await bsvhuFactory({
      opt: {
        destinationCompanyName: destination.name,
        destinationCompanyAddress: destination.address,
        destinationCompanySiret: destination.siret
      }
    });

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id },
      include: RegistryBsvhuInclude
    });
    const waste = toAllWaste(bsvhuForRegistry);

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
    const bsvhu = await bsvhuFactory({
      opt: {
        emitterCompanySiret: emitter.siret,
        emitterCompanyName: emitter.name,
        emitterCompanyAddress: emitter.address
      }
    });

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id },
      include: RegistryBsvhuInclude
    });
    const waste = toAllWaste(bsvhuForRegistry);

    // Then
    expect(waste.emitterCompanyName).toBe(emitter.name);
    expect(waste.emitterCompanySiret).toBe(emitter.siret);
    expect(waste.emitterCompanyAddress).toBe("4 Boulevard Pasteur");
    expect(waste.emitterCompanyPostalCode).toBe("44100");
    expect(waste.emitterCompanyCity).toBe("Nantes");
    expect(waste.emitterCompanyCountry).toBe("FR");
  });
  it("should contain all 3 intermediaries", async () => {
    // Given
    const intermediary1 = await companyFactory({});
    const intermediary2 = await companyFactory({});
    const intermediary3 = await companyFactory({});
    const bsvhu = await bsvhuFactory({
      opt: {
        intermediaries: {
          createMany: {
            data: [
              toIntermediaryCompany(intermediary1),
              toIntermediaryCompany(intermediary2),
              toIntermediaryCompany(intermediary3)
            ]
          }
        }
      }
    });

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id },
      include: RegistryBsvhuInclude
    });

    const waste = toAllWaste(bsvhuForRegistry);

    // Then
    expect(waste).not.toBeUndefined();
    expect(waste.intermediary1CompanyName).toBe(intermediary1.name);
    expect(waste.intermediary1CompanySiret).toBe(intermediary1.siret);
    expect(waste.intermediary2CompanyName).toBe(intermediary2.name);
    expect(waste.intermediary2CompanySiret).toBe(intermediary2.siret);
    expect(waste.intermediary3CompanyName).toBe(intermediary3.name);
    expect(waste.intermediary3CompanySiret).toBe(intermediary3.siret);
  });
  it("should work with 1 intermediary", async () => {
    // Given
    const intermediary1 = await companyFactory({});

    const bsvhu = await bsvhuFactory({
      opt: {
        intermediaries: {
          createMany: {
            data: [toIntermediaryCompany(intermediary1)]
          }
        }
      }
    });

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id },
      include: RegistryBsvhuInclude
    });
    const waste = toAllWaste(bsvhuForRegistry);

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

    const bsvhu = await bsvhuFactory({
      opt: {
        intermediaries: {
          createMany: {
            data: [
              toIntermediaryCompany(intermediary1),
              toIntermediaryCompany(intermediary2)
            ]
          }
        }
      }
    });

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id },
      include: RegistryBsvhuInclude
    });
    const waste = toAllWaste(bsvhuForRegistry);

    // Then
    expect(waste).not.toBeUndefined();
    expect(waste.intermediary1CompanyName).toBe(intermediary1.name);
    expect(waste.intermediary1CompanySiret).toBe(intermediary1.siret);
    expect(waste.intermediary2CompanyName).toBe(intermediary2.name);
    expect(waste.intermediary2CompanySiret).toBe(intermediary2.siret);
    expect(waste.intermediary3CompanyName).toBe(null);
    expect(waste.intermediary3CompanySiret).toBe(null);
  });

  it("should contain ecoOrganisme infos", async () => {
    // Given
    const ecoOrganisme = await ecoOrganismeFactory({
      handle: { handleBsvhu: true }
    });

    const bsvhu = await bsvhuFactory({
      opt: {
        ecoOrganismeSiret: ecoOrganisme.siret,
        ecoOrganismeName: ecoOrganisme.name
      }
    });

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id },
      include: RegistryBsvhuInclude
    });
    const waste = toAllWaste(bsvhuForRegistry);

    // Then
    expect(waste).not.toBeUndefined();
    expect(waste.ecoOrganismeSiren).toBe(ecoOrganisme.siret.substring(0, 9));
    expect(waste.ecoOrganismeName).toBe(ecoOrganisme.name);
  });
  it("should contain broker and trader information", async () => {
    // Given
    const bsvhu = await bsvhuFactory({});

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id },
      include: RegistryBsvhuInclude
    });
    const waste = toAllWaste(bsvhuForRegistry);

    // Then
    expect(waste.brokerCompanySiret).toBe(bsvhuForRegistry.brokerCompanySiret);
    expect(waste.brokerCompanyName).toBe(bsvhuForRegistry.brokerCompanyName);
    expect(waste.brokerRecepisseNumber).toBe(
      bsvhuForRegistry.brokerRecepisseNumber
    );
    expect(waste.traderCompanySiret).toBe(bsvhuForRegistry.traderCompanySiret);
    expect(waste.traderCompanyName).toBe(bsvhuForRegistry.traderCompanyName);
    expect(waste.traderRecepisseNumber).toBe(
      bsvhuForRegistry.traderRecepisseNumber
    );
  });
});

describe("getTransportersData", () => {
  afterAll(resetDatabase);

  it("should contain the splitted addresses of all transporters", async () => {
    // Given
    const bsvhu = await bsvhuFactory({
      opt: {
        destinationCompanyMail: "destination@mail.com",
        transporterCompanyAddress: "4 Boulevard Pasteur 44100 Nantes"
      }
    });

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id },
      include: RegistryBsvhuInclude
    });
    const waste = toTransportedWaste(bsvhuForRegistry);

    // Then
    expect(waste.transporterCompanyAddress).toBe("4 Boulevard Pasteur");
    expect(waste.transporterCompanyPostalCode).toBe("44100");
    expect(waste.transporterCompanyCity).toBe("Nantes");
    expect(waste.transporterCompanyCountry).toBe("FR");
  });
});
