import { prisma } from "../../../../libs/back/prisma/src";
import { resetDatabase } from "../../../integration-tests/helper";
import { RegistryBspaohInclude } from "../../registry/elastic";
import {
  toAllWaste,
  toIncomingWaste,
  toManagedWaste,
  toOutgoingWaste,
  toTransportedWaste
} from "../registry";
import { bspaohFactory } from "./factories";

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
});

describe("toManagedWaste", () => {
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
});
