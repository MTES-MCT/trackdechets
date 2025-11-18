import { Prisma } from "@td/prisma";
import { resetDatabase } from "../../../integration-tests/helper";
import { bsdasriFactory } from "./factories";
import { operationHook } from "../operationHook";
import { prisma } from "@td/prisma";

describe("BSDASRI operationHook job", () => {
  afterEach(resetDatabase);

  const operationData: Partial<Prisma.BsdasriCreateInput> = {
    destinationOperationSignatureDate: new Date(),
    destinationReceptionWasteWeightValue: 100,
    destinationOperationCode: "R 1"
  };

  it("should set final operation on a BSDASRI if operation is final", async () => {
    const bsdasri = await bsdasriFactory({
      opt: operationData
    });
    await operationHook(bsdasri, { runSync: true });
    const updatedBsdasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: bsdasri.id },
      include: { finalOperations: true }
    });
    expect(updatedBsdasri.finalOperations).toHaveLength(1);
    const expectedFinalOperation = {
      finalBsdasriId: bsdasri.id,
      operationCode: bsdasri.destinationOperationCode,
      quantity: bsdasri.destinationReceptionWasteWeightValue
    };
    expect(updatedBsdasri.finalOperations[0]).toMatchObject(
      expectedFinalOperation
    );
  });

  it(
    "should set final operation on a BSDASRI if operation is final" +
      " when runnig job through the async bull queue",
    async () => {
      const bsdasri = await bsdasriFactory({
        opt: operationData
      });
      const job = await operationHook(bsdasri, { runSync: false });
      await job!.finished();
      const updatedBsdasri = await prisma.bsdasri.findUniqueOrThrow({
        where: { id: bsdasri.id },
        include: { finalOperations: true }
      });
      expect(updatedBsdasri.finalOperations).toHaveLength(1);
      const expectedFinalOperation = {
        finalBsdasriId: bsdasri.id,
        operationCode: bsdasri.destinationOperationCode,
        quantity: bsdasri.destinationReceptionWasteWeightValue
      };
      expect(updatedBsdasri.finalOperations[0]).toMatchObject(
        expectedFinalOperation
      );
    }
  );

  it("should not set final operation on a BSDASRI if operation is not final", async () => {
    const bsdasri = await bsdasriFactory({
      opt: { ...operationData, destinationOperationCode: "R 13" }
    });
    await operationHook(bsdasri, { runSync: true });
    const updatedBsdasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: bsdasri.id },
      include: { finalOperations: true }
    });
    expect(updatedBsdasri.finalOperations).toHaveLength(0);
  });

  it(
    "should set final operation on an innitial BSDASRI when the final operation " +
      "is applied on a BSDASRI after groupement",
    async () => {
      const bsdasri = await bsdasriFactory({
        opt: { ...operationData, destinationOperationCode: "R 13" }
      });
      const groupementBsdasri = await bsdasriFactory({
        opt: {
          ...operationData,
          destinationReceptionWasteWeightValue: 120,
          grouping: { connect: { id: bsdasri.id } }
        }
      });
      await operationHook(groupementBsdasri, { runSync: true });
      const updatedBsdasri = await prisma.bsdasri.findUniqueOrThrow({
        where: { id: bsdasri.id },
        include: { finalOperations: true }
      });
      expect(updatedBsdasri.finalOperations).toHaveLength(1);
      const expectedFinalOperation = {
        finalBsdasriId: groupementBsdasri.id,
        operationCode: groupementBsdasri.destinationOperationCode,
        quantity: bsdasri.destinationReceptionWasteWeightValue
      };
      expect(updatedBsdasri.finalOperations[0]).toMatchObject(
        expectedFinalOperation
      );
    }
  );

  it(
    "should set final operation on an initial BSDASRI when the final operation " +
      "is applied on a BSDASRI after synthesizing",
    async () => {
      const bsdasri = await bsdasriFactory({
        opt: { ...operationData, destinationOperationCode: "R 13" }
      });
      const synthesizingBsdasri = await bsdasriFactory({
        opt: {
          ...operationData,
          destinationReceptionWasteWeightValue: 120,
          synthesizing: { connect: { id: bsdasri.id } }
        }
      });
      await operationHook(synthesizingBsdasri, { runSync: true });
      const updatedBsdasri = await prisma.bsdasri.findUniqueOrThrow({
        where: { id: bsdasri.id },
        include: { finalOperations: true }
      });
      expect(updatedBsdasri.finalOperations).toHaveLength(1);
      const expectedFinalOperation = {
        finalBsdasriId: synthesizingBsdasri.id,
        operationCode: synthesizingBsdasri.destinationOperationCode,
        quantity: bsdasri.destinationReceptionWasteWeightValue
      };
      expect(updatedBsdasri.finalOperations[0]).toMatchObject(
        expectedFinalOperation
      );
    }
  );
});
