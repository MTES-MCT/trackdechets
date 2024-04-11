import { toAllWaste, toOutgoingWaste } from "../registry";
import { prisma } from "@td/prisma";
import { RegistryBsdaInclude } from "../../registry/elastic";
import { bsdaFactory } from "./factories";
import { resetDatabase } from "../../../integration-tests/helper";

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
});
