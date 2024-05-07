import { toAllWaste, toOutgoingWaste } from "../registry";
import { prisma } from "@td/prisma";
import { RegistryBsdasriInclude } from "../../registry/elastic";
import { bsdasriFactory } from "./factories";
import { resetDatabase } from "../../../integration-tests/helper";

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
});
