import { resetDatabase } from "../../../integration-tests/helper";
import { operationHook } from "../operationHook";
import { Prisma } from "@prisma/client";
import { prisma } from "@td/prisma";
import { bsdaFactory } from "./factories";

describe("BSDA operationHook job", () => {
  afterEach(resetDatabase);

  const operationData: Partial<Prisma.BsdaCreateInput> = {
    destinationOperationSignatureDate: new Date(),
    destinationReceptionWeight: 100,
    destinationOperationCode: "R 5"
  };

  it("should set final operation on a BSDA if operation is final", async () => {
    const bsda = await bsdaFactory({
      opt: operationData
    });
    await operationHook(bsda, { runSync: true });
    const updatedBsda = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsda.id },
      include: { finalOperations: true }
    });
    expect(updatedBsda.finalOperations).toHaveLength(1);
    const expectedFinalOperation = {
      finalBsdaId: bsda.id,
      operationCode: bsda.destinationOperationCode,
      quantity: bsda.destinationReceptionWeight
    };
    expect(updatedBsda.finalOperations[0]).toMatchObject(
      expectedFinalOperation
    );
  });

  it(
    "should set final operation on a BSDA if operation is final" +
      " when runnig job through the async bull queue",
    async () => {
      const bsda = await bsdaFactory({
        opt: operationData
      });
      const job = await operationHook(bsda, { runSync: false });
      await job!.finished();
      const updatedBsda = await prisma.bsda.findUniqueOrThrow({
        where: { id: bsda.id },
        include: { finalOperations: true }
      });
      expect(updatedBsda.finalOperations).toHaveLength(1);
      const expectedFinalOperation = {
        finalBsdaId: bsda.id,
        operationCode: bsda.destinationOperationCode,
        quantity: bsda.destinationReceptionWeight
      };
      expect(updatedBsda.finalOperations[0]).toMatchObject(
        expectedFinalOperation
      );
    }
  );

  it("should not set final operation on a BSDA if operation is not final", async () => {
    const bsda = await bsdaFactory({
      opt: { ...operationData, destinationOperationCode: "R 13" }
    });
    await operationHook(bsda, { runSync: true });
    const updatedBsda = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsda.id },
      include: { finalOperations: true }
    });
    expect(updatedBsda.finalOperations).toHaveLength(0);
  });

  it(
    "should set final operation on an initial BSDA when final operation " +
      "is applied on BSDA after transit (réexpedition)",
    async () => {
      const bsda = await bsdaFactory({
        opt: { ...operationData, destinationOperationCode: "R 13" }
      });
      const reexpeditionBsda = await bsdaFactory({
        opt: {
          ...operationData,
          destinationReceptionWeight: 120,
          forwarding: { connect: { id: bsda.id } }
        }
      });
      await operationHook(reexpeditionBsda, { runSync: true });
      const updatedBsda = await prisma.bsda.findUniqueOrThrow({
        where: { id: bsda.id },
        include: { finalOperations: true }
      });
      expect(updatedBsda.finalOperations).toHaveLength(1);
      const expectedFinalOperation = {
        finalBsdaId: reexpeditionBsda.id,
        operationCode: reexpeditionBsda.destinationOperationCode,
        quantity: reexpeditionBsda.destinationReceptionWeight
      };
      expect(updatedBsda.finalOperations[0]).toMatchObject(
        expectedFinalOperation
      );
    }
  );

  it(
    "should set final operation on an initial BSDA when final operation " +
      "is applied on BSDA after groupement",
    async () => {
      const bsda = await bsdaFactory({
        opt: { ...operationData, destinationOperationCode: "D 15" }
      });
      const groupementBsda = await bsdaFactory({
        opt: {
          ...operationData,
          destinationReceptionWeight: 120,
          grouping: { connect: { id: bsda.id } }
        }
      });
      await operationHook(groupementBsda, { runSync: true });
      const updatedBsda = await prisma.bsda.findUniqueOrThrow({
        where: { id: bsda.id },
        include: { finalOperations: true }
      });
      expect(updatedBsda.finalOperations).toHaveLength(1);
      const expectedFinalOperation = {
        finalBsdaId: groupementBsda.id,
        operationCode: groupementBsda.destinationOperationCode,
        quantity: bsda.destinationReceptionWeight
      };
      expect(updatedBsda.finalOperations[0]).toMatchObject(
        expectedFinalOperation
      );
    }
  );
});
