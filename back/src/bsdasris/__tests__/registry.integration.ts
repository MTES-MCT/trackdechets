import {
  getSubType,
  toAllWaste,
  toGenericWaste,
  toIncomingWaste,
  toManagedWaste,
  toOutgoingWaste,
  toTransportedWaste
} from "../registry";
import { prisma } from "@td/prisma";
import { RegistryBsdasriInclude } from "../../registry/elastic";
import { bsdasriFactory } from "./factories";
import { resetDatabase } from "../../../integration-tests/helper";
import { BsdasriType } from "@prisma/client";

describe("toOutgoingWaste", () => {
  afterAll(resetDatabase);

  it(
    "should compute destinationFinalOperationCodes" +
      " and destinationfinalOperationWeights",
    async () => {
      const finalBsdasri1 = await bsdasriFactory({});
      const finalBsdasri2 = await bsdasriFactory({});

      const form = await bsdasriFactory({
        opt: {
          finalOperations: {
            createMany: {
              data: [
                {
                  finalBsdasriId: finalBsdasri1.id,
                  operationCode: "R 5",
                  quantity: 1
                },
                {
                  finalBsdasriId: finalBsdasri2.id,
                  operationCode: "D 5",
                  quantity: 2
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
      const waste = toOutgoingWaste(bsdasriForRegistry);
      expect(waste.destinationFinalOperationCodes).toStrictEqual([
        "R 5",
        "D 5"
      ]);
      expect(waste.destinationFinalOperationWeights).toStrictEqual([1, 2]);
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
});

describe("toIncomingWaste", () => {
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
    const wasteRegistry = toIncomingWaste(bsdasriForRegistry);

    // Then
    expect(wasteRegistry.weight).toBe(0.0565);
    expect(wasteRegistry.destinationReceptionWeight).toBe(0.0789);
    expect(wasteRegistry.destinationReceptionAcceptedWeight).toBeNull();
    expect(wasteRegistry.destinationReceptionRefusedWeight).toBeNull();
  });
});

describe("toAllWaste", () => {
  it(
    "should compute destinationFinalOperationCodes" +
      " and destinationfinalOperationWeights",
    async () => {
      const finalBsdasri1 = await bsdasriFactory({});
      const finalBsdasri2 = await bsdasriFactory({});

      const form = await bsdasriFactory({
        opt: {
          finalOperations: {
            createMany: {
              data: [
                {
                  finalBsdasriId: finalBsdasri1.id,
                  operationCode: "R 5",
                  quantity: 1
                },
                {
                  finalBsdasriId: finalBsdasri2.id,
                  operationCode: "D 5",
                  quantity: 2
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
        "R 5",
        "D 5"
      ]);
      expect(waste.destinationFinalOperationWeights).toStrictEqual([1, 2]);
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
    const wasteRegistry = toAllWaste(bsdasriForRegistry);

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
});

describe("toGenericWaste", () => {
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
});

describe("getSubType", () => {
  afterAll(resetDatabase);

  it.each([
    [BsdasriType.SIMPLE, "INITIAL"],
    [BsdasriType.SYNTHESIS, "SYNTHESIS"],
    [BsdasriType.GROUPING, "GATHERING"]
  ])("type is %p > should return %p", async (type, expectedSubType) => {
    // Given
    const bsdasri = await bsdasriFactory({ opt: { type } });

    // When
    const bsdasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: bsdasri.id },
      include: RegistryBsdasriInclude
    });
    const subType = getSubType(bsdasriForRegistry);

    // Then
    expect(subType).toBe(expectedSubType);
  });
});
