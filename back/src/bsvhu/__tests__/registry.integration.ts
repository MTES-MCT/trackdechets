import { prisma } from "@td/prisma";
import {
  toAllWaste,
  toGenericWaste,
  toIncomingWaste,
  toManagedWaste,
  toOutgoingWaste,
  toTransportedWaste
} from "../registry";
import { bsvhuFactory } from "./factories.vhu";
import { resetDatabase } from "../../../integration-tests/helper";

describe("toGenericWaste", () => {
  afterAll(resetDatabase);

  it("should contain destinationCompanyMail", async () => {
    // Given
    const bsvhu = await bsvhuFactory({
      opt: { destinationCompanyMail: "destination@mail.com" }
    });

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id }
    });
    const waste = toGenericWaste(bsvhuForRegistry);

    // Then
    expect(waste.destinationCompanyMail).toBe("destination@mail.com");
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
      where: { id: bsvhu.id }
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
      where: { id: bsvhu.id }
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
      where: { id: bsvhu.id }
    });
    const wasteRegistry = toOutgoingWaste(bsvhuForRegistry);

    // Then
    expect(wasteRegistry.weight).toBe(0.0565);
    expect(wasteRegistry.destinationReceptionWeight).toBe(0.0789);
    expect(wasteRegistry.destinationReceptionAcceptedWeight).toBeNull();
    expect(wasteRegistry.destinationReceptionRefusedWeight).toBeNull();
  });

  it("should contain transporters info except plates", async () => {
    // Given
    const bsvhu = await bsvhuFactory({
      opt: {
        destinationCompanyMail: "destination@mail.com",
        transporterTransportPlates: ["TRANSPORTER1-NBR-PLATES"]
      }
    });

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id }
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
      where: { id: bsvhu.id }
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
      where: { id: bsvhu.id }
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
      where: { id: bsvhu.id }
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
      where: { id: bsvhu.id }
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
});

describe("toAllWaste", () => {
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
      where: { id: bsvhu.id }
    });
    const wasteRegistry = toAllWaste(bsvhuForRegistry);

    // Then
    expect(wasteRegistry.weight).toBe(0.0565);
    expect(wasteRegistry.destinationReceptionWeight).toBe(0.0789);
    expect(wasteRegistry.destinationReceptionAcceptedWeight).toBeNull();
    expect(wasteRegistry.destinationReceptionRefusedWeight).toBeNull();
  });

  it("should contain transporters including except plates", async () => {
    // Given
    const bsvhu = await bsvhuFactory({
      opt: {
        destinationCompanyMail: "destination@mail.com",
        transporterTransportPlates: ["TRANSPORTER1-NBR-PLATES"]
      }
    });

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id }
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
});
