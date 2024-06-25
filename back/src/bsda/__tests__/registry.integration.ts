import {
  getSubType,
  toAllWaste,
  toIncomingWaste,
  toManagedWaste,
  toOutgoingWaste
} from "../registry";
import { prisma } from "@td/prisma";
import { RegistryBsdaInclude } from "../../registry/elastic";
import { bsdaFactory } from "./factories";
import { resetDatabase } from "../../../integration-tests/helper";
import { BsdaType } from "@prisma/client";

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
});

describe("toAllWaste", () => {
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
});

describe("toGenericWaste", () => {
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
    const waste = toAllWaste(bsdaForRegistry);

    // Then
    expect(waste.destinationCompanyMail).toStrictEqual("destination@mail.com");
    expect(waste.brokerCompanyMail).toStrictEqual("broker@mail.com");
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
