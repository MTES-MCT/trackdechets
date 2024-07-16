import { prisma } from "@td/prisma";
import { RegistryBspaohInclude } from "../../registry/elastic";
import {
  toAllWaste,
  toGenericWaste,
  toIncomingWaste,
  toManagedWaste,
  toOutgoingWaste,
  toTransportedWaste
} from "../registry";
import { bspaohFactory } from "./factories";
import { resetDatabase } from "../../../integration-tests/helper";
import { companyFactory } from "../../__tests__/factories";

describe("toGenericWaste", () => {
  afterAll(resetDatabase);

  it("should contain destinationCompanyMail", async () => {
    // Given
    const paoh = await bspaohFactory({
      opt: { destinationCompanyMail: "destination@mail.com" }
    });

    // When
    const paohForRegistry = await prisma.bspaoh.findUniqueOrThrow({
      where: { id: paoh.id },
      include: RegistryBspaohInclude
    });
    const waste = toGenericWaste(paohForRegistry);

    // Then
    expect(waste.destinationCompanyMail).toBe("destination@mail.com");
  });
});

describe("toIncomingWaste", () => {
  afterAll(resetDatabase);

  it("should contain emitted weight and destinationReception weight, acceptedWeight, & refusedWeight", async () => {
    // Given
    const bspaoh = await bspaohFactory({
      opt: {
        emitterWasteWeightValue: 56.5,
        destinationReceptionAcceptationStatus: "PARTIALLY_REFUSED",
        destinationReceptionWasteReceivedWeightValue: 78.9
      }
    });

    // When
    const bspaohForRegistry = await prisma.bspaoh.findUniqueOrThrow({
      where: { id: bspaoh.id },
      include: RegistryBspaohInclude
    });
    const wasteRegistry = toIncomingWaste(bspaohForRegistry);

    // Then
    expect(wasteRegistry.weight).toBe(0.0565);
    expect(wasteRegistry.destinationReceptionWeight).toBe(0.0789);
    expect(wasteRegistry.destinationReceptionAcceptedWeight).toBeNull();
    expect(wasteRegistry.destinationReceptionRefusedWeight).toBeNull();
  });

  it("should contain transporters info except plates", async () => {
    // Given
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });
    const bspaoh = await bspaohFactory({
      opt: {
        destinationCompanyMail: "destination@mail.com",
        transporters: {
          create: {
            transporterCompanySiret: transporter.siret,
            transporterTransportPlates: ["TRANSPORTER1-NBR-PLATES"],
            number: 1
          }
        }
      }
    });

    // When
    const paohForRegistry = await prisma.bspaoh.findUniqueOrThrow({
      where: { id: bspaoh.id },
      include: RegistryBspaohInclude
    });
    const waste = toIncomingWaste(paohForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      paohForRegistry.transporters[0].transporterCompanySiret
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

describe("toOutgoingWaste", () => {
  afterAll(resetDatabase);

  it("should contain emitted weight and destinationReception weight, acceptedWeight, & refusedWeight", async () => {
    // Given
    const bspaoh = await bspaohFactory({
      opt: {
        emitterWasteWeightValue: 56.5,
        destinationReceptionAcceptationStatus: "PARTIALLY_REFUSED",
        destinationReceptionWasteReceivedWeightValue: 78.9
      }
    });

    // When
    const bspaohForRegistry = await prisma.bspaoh.findUniqueOrThrow({
      where: { id: bspaoh.id },
      include: RegistryBspaohInclude
    });
    const wasteRegistry = toOutgoingWaste(bspaohForRegistry);

    // Then
    expect(wasteRegistry.weight).toBe(0.0565);
    expect(wasteRegistry.destinationReceptionWeight).toBe(0.0789);
    expect(wasteRegistry.destinationReceptionAcceptedWeight).toBeNull();
    expect(wasteRegistry.destinationReceptionRefusedWeight).toBeNull();
  });

  it("should contain transporters info except plates", async () => {
    // Given
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });
    const bspaoh = await bspaohFactory({
      opt: {
        destinationCompanyMail: "destination@mail.com",
        transporters: {
          create: {
            transporterCompanySiret: transporter.siret,
            transporterTransportPlates: ["TRANSPORTER1-NBR-PLATES"],
            number: 1
          }
        }
      }
    });

    // When
    const paohForRegistry = await prisma.bspaoh.findUniqueOrThrow({
      where: { id: bspaoh.id },
      include: RegistryBspaohInclude
    });
    const waste = toOutgoingWaste(paohForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      paohForRegistry.transporters[0].transporterCompanySiret
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

describe("toTransportedWaste", () => {
  afterAll(resetDatabase);

  it("should contain emitted weight and destinationReception weight", async () => {
    // Given
    const bspaoh = await bspaohFactory({
      opt: {
        emitterWasteWeightValue: 56.5,
        destinationReceptionAcceptationStatus: "PARTIALLY_REFUSED",
        destinationReceptionWasteReceivedWeightValue: 78.9
      }
    });

    // When
    const bspaohForRegistry = await prisma.bspaoh.findUniqueOrThrow({
      where: { id: bspaoh.id },
      include: RegistryBspaohInclude
    });
    const wasteRegistry = toTransportedWaste(bspaohForRegistry);

    // Then
    expect(wasteRegistry.weight).toBe(0.0565);
    expect(wasteRegistry.destinationReceptionWeight).toBe(0.0789);
  });

  it("should contain transporters info including plates", async () => {
    // Given
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });
    const bspaoh = await bspaohFactory({
      opt: {
        destinationCompanyMail: "destination@mail.com",
        transporters: {
          create: {
            transporterCompanySiret: transporter.siret,
            transporterTransportPlates: ["TRANSPORTER1-NBR-PLATES"],
            number: 1
          }
        }
      }
    });

    // When
    const paohForRegistry = await prisma.bspaoh.findUniqueOrThrow({
      where: { id: bspaoh.id },
      include: RegistryBspaohInclude
    });
    const waste = toTransportedWaste(paohForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      paohForRegistry.transporters[0].transporterCompanySiret
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
});

describe("toManagedWaste", () => {
  afterAll(resetDatabase);

  it("should contain transporters info except plates", async () => {
    // Given
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });
    const bspaoh = await bspaohFactory({
      opt: {
        destinationCompanyMail: "destination@mail.com",
        transporters: {
          create: {
            transporterCompanySiret: transporter.siret,
            transporterTransportPlates: ["TRANSPORTER1-NBR-PLATES"],
            number: 1
          }
        }
      }
    });

    // When
    const paohForRegistry = await prisma.bspaoh.findUniqueOrThrow({
      where: { id: bspaoh.id },
      include: RegistryBspaohInclude
    });
    const waste = toManagedWaste(paohForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      paohForRegistry.transporters[0].transporterCompanySiret
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

  it("should contain emitted weight and destinationReception weight, acceptedWeight, & refusedWeight", async () => {
    // Given
    const bspaoh = await bspaohFactory({
      opt: {
        emitterWasteWeightValue: 56.5,
        destinationReceptionAcceptationStatus: "PARTIALLY_REFUSED",
        destinationReceptionWasteReceivedWeightValue: 78.9
      }
    });

    // When
    const bspaohForRegistry = await prisma.bspaoh.findUniqueOrThrow({
      where: { id: bspaoh.id },
      include: RegistryBspaohInclude
    });
    const wasteRegistry = toManagedWaste(bspaohForRegistry);

    // Then
    expect(wasteRegistry.weight).toBe(0.0565);
    expect(wasteRegistry.destinationReceptionWeight).toBe(0.0789);
    expect(wasteRegistry.destinationReceptionAcceptedWeight).toBeNull();
    expect(wasteRegistry.destinationReceptionRefusedWeight).toBeNull();
  });
});

describe("toAllWaste", () => {
  afterAll(resetDatabase);

  it("should contain transporters info including plates", async () => {
    // Given
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });
    const bspaoh = await bspaohFactory({
      opt: {
        destinationCompanyMail: "destination@mail.com",
        transporters: {
          create: {
            transporterCompanySiret: transporter.siret,
            transporterTransportPlates: ["TRANSPORTER1-NBR-PLATES"],
            number: 1
          }
        }
      }
    });

    // When
    const paohForRegistry = await prisma.bspaoh.findUniqueOrThrow({
      where: { id: bspaoh.id },
      include: RegistryBspaohInclude
    });
    const waste = toAllWaste(paohForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      paohForRegistry.transporters[0].transporterCompanySiret
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

  it("should contain emitted weight and destinationReception weight, acceptedWeight, & refusedWeight", async () => {
    // Given
    const bspaoh = await bspaohFactory({
      opt: {
        emitterWasteWeightValue: 56.5,
        destinationReceptionAcceptationStatus: "PARTIALLY_REFUSED",
        destinationReceptionWasteReceivedWeightValue: 78.9
      }
    });

    // When
    const bspaohForRegistry = await prisma.bspaoh.findUniqueOrThrow({
      where: { id: bspaoh.id },
      include: RegistryBspaohInclude
    });
    const wasteRegistry = toAllWaste(bspaohForRegistry);

    // Then
    expect(wasteRegistry.weight).toBe(0.0565);
    expect(wasteRegistry.destinationReceptionWeight).toBe(0.0789);
    expect(wasteRegistry.destinationReceptionAcceptedWeight).toBeNull();
    expect(wasteRegistry.destinationReceptionRefusedWeight).toBeNull();
  });
});
