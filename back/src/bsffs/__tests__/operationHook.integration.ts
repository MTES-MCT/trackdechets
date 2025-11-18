import { Prisma } from "@td/prisma";
import { resetDatabase } from "../../../integration-tests/helper";
import { createBsffAfterOperation } from "./factories";
import {
  UserWithCompany,
  userWithCompanyFactory
} from "../../__tests__/factories";
import { operationHook } from "../operationHook";
import { prisma } from "@td/prisma";

describe("BSFF operationHook job", () => {
  let emitter: UserWithCompany;
  let transporter: UserWithCompany;
  let ttr: UserWithCompany;
  let destination: UserWithCompany;

  beforeAll(async () => {
    emitter = await userWithCompanyFactory("MEMBER");
    transporter = await userWithCompanyFactory("MEMBER");
    ttr = await userWithCompanyFactory("MEMBER");
    destination = await userWithCompanyFactory("MEMBER");
  });

  afterEach(resetDatabase);

  const operationData: Partial<Prisma.BsffPackagingCreateInput> = {
    operationSignatureDate: new Date(),
    acceptationWeight: 100,
    operationCode: "R 1"
  };

  it("should set final operation on a BSFF packaging if operation is final", async () => {
    const bsff = await createBsffAfterOperation(
      {
        emitter,
        transporter,
        destination
      },
      { packagingData: operationData }
    );

    const packaging = bsff.packagings[0];

    await operationHook(packaging, { runSync: true });
    const updatedBsffPackaging = await prisma.bsffPackaging.findUniqueOrThrow({
      where: { id: packaging.id },
      include: { finalOperations: true }
    });
    expect(updatedBsffPackaging.finalOperations).toHaveLength(1);
    const expectedFinalOperation = {
      finalBsffPackagingId: packaging.id,
      operationCode: packaging.operationCode
    };
    expect(updatedBsffPackaging.finalOperations[0]).toMatchObject(
      expectedFinalOperation
    );
    expect(updatedBsffPackaging.finalOperations[0].quantity.toNumber()).toEqual(
      packaging.acceptationWeight!
    );
  });

  it(
    "should set final operation on a BSFF packaging if operation is final " +
      "when running job through the async bull queue",
    async () => {
      const bsff = await createBsffAfterOperation(
        {
          emitter,
          transporter,
          destination
        },
        { packagingData: operationData }
      );

      const packaging = bsff.packagings[0];

      const job = await operationHook(packaging, { runSync: false });
      await job!.finished();
      const updatedBsffPackaging = await prisma.bsffPackaging.findUniqueOrThrow(
        {
          where: { id: packaging.id },
          include: { finalOperations: true }
        }
      );
      expect(updatedBsffPackaging.finalOperations).toHaveLength(1);
      const expectedFinalOperation = {
        finalBsffPackagingId: packaging.id,
        operationCode: packaging.operationCode
      };
      expect(updatedBsffPackaging.finalOperations[0]).toMatchObject(
        expectedFinalOperation
      );
      expect(
        updatedBsffPackaging.finalOperations[0].quantity.toNumber()
      ).toEqual(packaging.acceptationWeight!);
    }
  );

  it(
    "should set final operation on a BSFF packaging if operation is not final " +
      "but notraceability is true",
    async () => {
      const bsff = await createBsffAfterOperation(
        {
          emitter,
          transporter,
          destination
        },
        {
          packagingData: {
            ...operationData,
            operationCode: "D 13",
            operationNoTraceability: true
          }
        }
      );

      const packaging = bsff.packagings[0];

      await operationHook(packaging, { runSync: true });
      const updatedBsffPackaging = await prisma.bsffPackaging.findUniqueOrThrow(
        {
          where: { id: packaging.id },
          include: { finalOperations: true }
        }
      );
      expect(updatedBsffPackaging.finalOperations).toHaveLength(1);
      const expectedFinalOperation = {
        finalBsffPackagingId: packaging.id,
        operationCode: packaging.operationCode,
        noTraceability: true
      };
      expect(updatedBsffPackaging.finalOperations[0]).toMatchObject(
        expectedFinalOperation
      );
      expect(
        updatedBsffPackaging.finalOperations[0].quantity.toNumber()
      ).toEqual(packaging.acceptationWeight!);
    }
  );

  it(
    "should not set final operation on a BSFF packaging if operation code is " +
      "not final and noTraceability is false",
    async () => {
      const bsff = await createBsffAfterOperation(
        {
          emitter,
          transporter,
          destination
        },
        {
          packagingData: {
            ...operationData,
            operationCode: "D 13"
          }
        }
      );

      const packaging = bsff.packagings[0];

      await operationHook(packaging, { runSync: true });
      const updatedBsffPackaging = await prisma.bsffPackaging.findUniqueOrThrow(
        {
          where: { id: packaging.id },
          include: { finalOperations: true }
        }
      );
      expect(updatedBsffPackaging.finalOperations).toHaveLength(0);
    }
  );

  it(
    "should set final operation on initial packaging when a final operation code " +
      "is applied on the packaging after reexpedition",
    async () => {
      const bsff = await createBsffAfterOperation(
        {
          emitter,
          transporter,
          destination: ttr
        },
        {
          packagingData: {
            ...operationData,
            operationCode: "D 15"
          }
        }
      );
      const packaging = bsff.packagings[0];

      const reexpeditionBsff = await createBsffAfterOperation(
        {
          emitter: ttr,
          transporter,
          destination
        },
        {
          data: { type: "REEXPEDITION" },
          packagingData: {
            ...operationData,
            acceptationWeight: 120,
            operationCode: "R 1",
            previousPackagings: { connect: { id: packaging.id } }
          }
        }
      );

      const reexpeditionPackaging = reexpeditionBsff.packagings[0];

      await operationHook(reexpeditionPackaging, { runSync: true });

      const updatedBsffPackaging = await prisma.bsffPackaging.findUniqueOrThrow(
        {
          where: { id: packaging.id },
          include: { finalOperations: true }
        }
      );
      expect(updatedBsffPackaging.finalOperations).toHaveLength(1);
      const expectedFinalOperation = {
        finalBsffPackagingId: reexpeditionPackaging.id,
        operationCode: reexpeditionPackaging.operationCode
      };
      expect(updatedBsffPackaging.finalOperations[0]).toMatchObject(
        expectedFinalOperation
      );
      expect(
        updatedBsffPackaging.finalOperations[0].quantity.toNumber()
      ).toEqual(reexpeditionPackaging.acceptationWeight!);
    }
  );

  it(
    "should set final operation on initial packaging when a final operation code " +
      "is applied on the packaging after groupement",
    async () => {
      const bsff = await createBsffAfterOperation(
        {
          emitter,
          transporter,
          destination: ttr
        },
        {
          packagingData: {
            ...operationData,
            operationCode: "D 15"
          }
        }
      );
      const packaging = bsff.packagings[0];

      const reexpeditionBsff = await createBsffAfterOperation(
        {
          emitter: ttr,
          transporter,
          destination
        },
        {
          data: { type: "GROUPEMENT" },
          packagingData: {
            ...operationData,
            acceptationWeight: 120,
            operationCode: "R 1",
            previousPackagings: { connect: { id: packaging.id } }
          }
        }
      );

      const reexpeditionPackaging = reexpeditionBsff.packagings[0];

      await operationHook(reexpeditionPackaging, { runSync: true });

      const updatedBsffPackaging = await prisma.bsffPackaging.findUniqueOrThrow(
        {
          where: { id: packaging.id },
          include: { finalOperations: true }
        }
      );
      expect(updatedBsffPackaging.finalOperations).toHaveLength(1);
      const expectedFinalOperation = {
        finalBsffPackagingId: reexpeditionPackaging.id,
        operationCode: reexpeditionPackaging.operationCode
      };
      expect(updatedBsffPackaging.finalOperations[0]).toMatchObject(
        expectedFinalOperation
      );
      expect(
        updatedBsffPackaging.finalOperations[0].quantity.toNumber()
      ).toEqual(reexpeditionPackaging.acceptationWeight!);
    }
  );

  it(
    "should set final operation on initial packaging when a final operation code " +
      "is applied on the packaging after groupement",
    async () => {
      const bsff = await createBsffAfterOperation(
        {
          emitter,
          transporter,
          destination: ttr
        },
        {
          packagingData: {
            ...operationData,
            operationCode: "D 15"
          }
        }
      );
      const packaging = bsff.packagings[0];

      const reexpeditionBsff = await createBsffAfterOperation(
        {
          emitter: ttr,
          transporter,
          destination
        },
        {
          data: { type: "RECONDITIONNEMENT" },
          packagingData: {
            ...operationData,
            acceptationWeight: 120,
            operationCode: "R 1",
            previousPackagings: { connect: { id: packaging.id } }
          }
        }
      );

      const reexpeditionPackaging = reexpeditionBsff.packagings[0];

      await operationHook(reexpeditionPackaging, { runSync: true });

      const updatedBsffPackaging = await prisma.bsffPackaging.findUniqueOrThrow(
        {
          where: { id: packaging.id },
          include: { finalOperations: true }
        }
      );
      expect(updatedBsffPackaging.finalOperations).toHaveLength(1);
      const expectedFinalOperation = {
        finalBsffPackagingId: reexpeditionPackaging.id,
        operationCode: reexpeditionPackaging.operationCode
      };
      expect(updatedBsffPackaging.finalOperations[0]).toMatchObject(
        expectedFinalOperation
      );
      expect(
        updatedBsffPackaging.finalOperations[0].quantity.toNumber()
      ).toEqual(packaging.acceptationWeight!);
    }
  );
});
