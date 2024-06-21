import { prisma } from "@td/prisma";
import { resetDatabase } from "../../../integration-tests/helper";
import {
  toAllWaste,
  toIncomingWaste,
  toManagedWaste,
  toOutgoingWaste,
  toTransportedWaste
} from "../registry";
import { bsvhuFactory } from "./factories.vhu";

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
});

describe("toGenericWaste", () => {
  it("should contain destinationCompanyMail", async () => {
    // Given
    const bsvhu = await bsvhuFactory({
      opt: { destinationCompanyMail: "destination@mail.com" }
    });

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id }
    });
    const waste = toOutgoingWaste(bsvhuForRegistry);

    // Then
    expect(waste.destinationCompanyMail).toBe("destination@mail.com");
  });
});
