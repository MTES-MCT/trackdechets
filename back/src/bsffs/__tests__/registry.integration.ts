import { getSubType, toOutgoingWaste } from "../registry";
import { prisma } from "@td/prisma";
import { RegistryBsffInclude } from "../../registry/elastic";
import { createBsff, createBsffAfterOperation } from "./factories";
import { userWithCompanyFactory } from "../../__tests__/factories";
import { resetDatabase } from "../../../integration-tests/helper";
import { BsffType } from "@prisma/client";

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

      const finalBsff = await createBsffAfterOperation({
        emitter: ttr,
        transporter,
        destination
      });

      const finalPackaging = finalBsff.packagings[0];

      const bsff = await createBsffAfterOperation(
        {
          emitter,
          transporter,
          destination
        },
        {
          packagingData: {
            finalOperations: {
              create: {
                finalBsffPackagingId: finalPackaging.id,
                quantity: 1,
                operationCode: "R 1",
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
      expect(waste.destinationFinalOperationWeights).toStrictEqual([1]);
    }
  );
});

describe("toAllWaste", () => {
  it(
    "should compute destinationFinalOperationCodes" +
      " and destinationfinalOperationWeights",
    async () => {
      const emitter = await userWithCompanyFactory("MEMBER");
      const transporter = await userWithCompanyFactory("MEMBER");
      const ttr = await userWithCompanyFactory("MEMBER");
      const destination = await userWithCompanyFactory("MEMBER");

      const finalBsff = await createBsffAfterOperation({
        emitter: ttr,
        transporter,
        destination
      });

      const finalPackaging = finalBsff.packagings[0];

      const bsff = await createBsffAfterOperation(
        {
          emitter,
          transporter,
          destination: ttr
        },
        {
          packagingData: {
            finalOperations: {
              create: {
                finalBsffPackagingId: finalPackaging.id,
                quantity: 1,
                operationCode: "R 1",
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
      expect(waste.destinationFinalOperationWeights).toStrictEqual([1]);
    }
  );
});

describe("toGenericWaste", () => {
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
    const waste = toOutgoingWaste(bsffForRegistry);

    // Then
    expect(waste.destinationCompanyMail).toBe("destination@mail.com");
  });
});

describe("getSubType", () => {
  afterAll(resetDatabase);

  it.each([
    [BsffType.COLLECTE_PETITES_QUANTITES, "INITIAL"],
    [BsffType.TRACER_FLUIDE, "INITIAL"],
    [BsffType.GROUPEMENT, "GROUPEMENT"],
    [BsffType.RECONDITIONNEMENT, "RECONDITIONNEMENT"],
    [BsffType.REEXPEDITION, "RESHIPMENT"]
  ])("type is %p > should return %p", async (type, expectedSubType) => {
    // Given
    const bsff = await createBsff({}, { data: { type } });

    // When
    const bsffForRegistry = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: RegistryBsffInclude
    });
    const subType = getSubType(bsffForRegistry);

    // Then
    expect(subType).toBe(expectedSubType);
  });
});
