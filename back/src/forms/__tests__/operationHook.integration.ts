import { resetDatabase } from "../../../integration-tests/helper";
import { operationHook } from "../operationHook";
import { Status } from "@prisma/client";
import { prisma } from "@td/prisma";
import {
  formWithTempStorageFactory,
  formFactory,
  userFactory
} from "../../__tests__/factories";

describe("BSDD operationHook job", () => {
  afterEach(resetDatabase);

  const operationData = {
    processedAt: new Date(),
    quantityReceived: 100,
    processingOperationDone: "R 1",
    noTraceability: false
  };

  it("should set final operation on a BSDD if operation is final", async () => {
    const user = await userFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: operationData
    });
    await operationHook(form, { runSync: true });
    const updatedForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: { finalOperations: true }
    });
    expect(updatedForm.finalOperations).toHaveLength(1);
    const expectedFinalOperation = {
      finalFormId: form.id,
      operationCode: form.processingOperationDone,
      noTraceability: false,
      quantity: form.quantityReceived
    };
    expect(updatedForm.finalOperations[0]).toMatchObject(
      expectedFinalOperation
    );
  });

  it(
    "should set final operation on a BSDD if operation is final" +
      " when running job through the async bull queue",
    async () => {
      const user = await userFactory();
      const form = await formFactory({
        ownerId: user.id,
        opt: operationData
      });
      const job = await operationHook(form, { runSync: false });
      await job!.finished();
      const updatedForm = await prisma.form.findUniqueOrThrow({
        where: { id: form.id },
        include: { finalOperations: true }
      });
      expect(updatedForm.finalOperations).toHaveLength(1);
      const expectedFinalOperation = {
        finalFormId: form.id,
        operationCode: form.processingOperationDone,
        noTraceability: false,
        quantity: form.quantityReceived
      };
      expect(updatedForm.finalOperations[0]).toMatchObject(
        expectedFinalOperation
      );
    }
  );

  it(
    "should not set final operation on a BSDD if operation code is " +
      "not final and noTraceability is false",
    async () => {
      const user = await userFactory();
      const form = await formFactory({
        ownerId: user.id,
        opt: {
          ...operationData,
          processingOperationDone: "D 13"
        }
      });
      await operationHook(form, { runSync: true });
      const updatedForm = await prisma.form.findUniqueOrThrow({
        where: { id: form.id },
        include: { finalOperations: true }
      });
      expect(updatedForm.finalOperations).toHaveLength(0);
    }
  );

  it(
    "should set final operation on a BSDD if operation code is " +
      "not final but noTraceability is true",
    async () => {
      const user = await userFactory();
      const form = await formFactory({
        ownerId: user.id,
        opt: {
          ...operationData,
          processingOperationDone: "D 13",
          noTraceability: true
        }
      });
      await operationHook(form, { runSync: true });
      const updatedForm = await prisma.form.findUniqueOrThrow({
        where: { id: form.id },
        include: { finalOperations: true }
      });
      expect(updatedForm.finalOperations).toHaveLength(1);
      const expectedFinalOperation = {
        finalFormId: form.id,
        operationCode: form.processingOperationDone,
        noTraceability: true,
        quantity: form.quantityReceived
      };
      expect(updatedForm.finalOperations[0]).toMatchObject(
        expectedFinalOperation
      );
    }
  );

  it(
    "should set final operation on initial BSDD when final operation" +
      "is applied on the BSDD suite (BSDD avec entreposage provisoire)",
    async () => {
      const user = await userFactory();
      // Bordereau avec entreposage provisoire
      const { forwardedIn: bsdSuite, ...form } =
        await formWithTempStorageFactory({
          ownerId: user.id,
          opt: {
            wasteDetailsCode: "05 01 02*",
            status: Status.TEMP_STORER_ACCEPTED,
            quantityReceived: 100,
            createdAt: new Date("2021-04-01"),
            sentAt: new Date("2021-04-01"),
            receivedAt: new Date("2021-04-01"),
            processedAt: new Date("2021-04-01"),
            processingOperationDone: "R 13"
          },
          forwardedInOpts: {
            quantityReceived: 110,
            receivedAt: new Date(),
            processedAt: new Date(),
            processingOperationDone: "R 1",
            noTraceability: false
          }
        });

      await operationHook(bsdSuite!, { runSync: true });

      const expectedFinalOperation = {
        finalFormId: bsdSuite?.id,
        operationCode: bsdSuite!.processingOperationDone!,
        noTraceability: false,
        quantity: bsdSuite!.quantityReceived
      };

      // Vérifie que les informations du traitement final sont ajoutés
      // au BSD suite
      const updatedBsdSuite = await prisma.form.findUniqueOrThrow({
        where: { id: form.forwardedInId! },
        include: { finalOperations: true }
      });
      expect(updatedBsdSuite.finalOperations.length).toEqual(1);
      expect(updatedBsdSuite.finalOperations[0]).toMatchObject(
        expectedFinalOperation
      );

      // Vérifie que les informations du traitement final sont ajoutés
      // au BSD initial
      const updatedForm = await prisma.form.findUniqueOrThrow({
        where: { id: form.id },
        include: { finalOperations: true }
      });
      expect(updatedForm.finalOperations.length).toEqual(1);
      expect(updatedForm.finalOperations[0]).toMatchObject(
        expectedFinalOperation
      );
    }
  );

  it("should set final operation on initial BSDD's when final operation is applied on groupement BSDD", async () => {
    const user = await userFactory();
    const initialForm1 = await formFactory({
      ownerId: user.id,
      opt: {
        ...operationData,
        processingOperationDone: "D 13",
        quantityReceived: 10
      }
    });
    const initialForm2 = await formFactory({
      ownerId: user.id,
      opt: {
        ...operationData,
        processingOperationDone: "D 13",
        quantityReceived: 90
      }
    });
    const groupementForm = await formFactory({
      ownerId: user.id,
      opt: {
        grouping: {
          create: [
            {
              initialFormId: initialForm1.id,
              quantity: initialForm1.quantityReceived!.toNumber()
            },
            {
              initialFormId: initialForm2.id,
              quantity: initialForm2.quantityReceived!.toNumber()
            }
          ]
        },
        ...operationData,
        quantityReceived: initialForm1.quantityReceived!.add(
          initialForm2.quantityReceived!
        )
      }
    });
    await operationHook(groupementForm, { runSync: true });

    const expectedFinalOperation = {
      finalFormId: groupementForm.id,
      operationCode: groupementForm.processingOperationDone,
      noTraceability: false
    };

    const updatedInitialForm1 = await prisma.form.findUniqueOrThrow({
      where: { id: initialForm1.id },
      include: { finalOperations: true }
    });
    expect(updatedInitialForm1.finalOperations).toHaveLength(1);
    expect(updatedInitialForm1.finalOperations[0]).toMatchObject({
      ...expectedFinalOperation,
      quantity: initialForm1.quantityReceived
    });

    const updatedInitialForm2 = await prisma.form.findUniqueOrThrow({
      where: { id: initialForm2.id },
      include: { finalOperations: true }
    });
    expect(updatedInitialForm2.finalOperations).toHaveLength(1);
    expect(updatedInitialForm2.finalOperations[0]).toMatchObject({
      ...expectedFinalOperation,
      quantity: initialForm2.quantityReceived
    });
  });

  it(
    "should set final operation on an initial BSDD when it has been grouped " +
      "in several groupement BSDDs",
    async () => {
      const user = await userFactory();
      const initialForm = await formFactory({
        ownerId: user.id,
        opt: {
          ...operationData,
          processingOperationDone: "D 13",
          quantityReceived: 10
        }
      });
      // ventile 1 tiers de la quantité sur le BSDD de groupement 1
      const quantity1 = initialForm.quantityReceived!.times(1 / 3);
      const groupementForm1 = await formFactory({
        ownerId: user.id,
        opt: {
          grouping: {
            create: {
              initialFormId: initialForm.id,
              quantity: quantity1.toNumber()
            }
          },
          ...operationData,
          quantityReceived: quantity1
        }
      });
      // ventile 2 tiers de la quantité sur le BSDD de groupement 2
      const quantity2 = initialForm.quantityReceived!.minus(quantity1);
      const groupementForm2 = await formFactory({
        ownerId: user.id,
        opt: {
          grouping: {
            create: {
              initialFormId: initialForm.id,
              quantity: quantity2.toNumber()
            }
          },
          ...operationData,
          quantityReceived: quantity2
        }
      });

      await operationHook(groupementForm1, { runSync: true });
      await operationHook(groupementForm2, { runSync: true });

      const updatedInitialForm = await prisma.form.findUniqueOrThrow({
        where: { id: initialForm.id },
        include: { finalOperations: true }
      });

      expect(updatedInitialForm.finalOperations).toHaveLength(2);

      const expectedFinalOperation1 = {
        finalFormId: groupementForm1.id,
        operationCode: groupementForm1.processingOperationDone,
        noTraceability: false,
        quantity: quantity1
      };
      expect(updatedInitialForm.finalOperations[0]).toMatchObject(
        expectedFinalOperation1
      );
      const expectedFinalOperation2 = {
        finalFormId: groupementForm2.id,
        operationCode: groupementForm2.processingOperationDone,
        noTraceability: false,
        quantity: quantity2
      };
      expect(updatedInitialForm.finalOperations[1]).toMatchObject(
        expectedFinalOperation2
      );
    }
  );

  it(
    "should set final operation on an initial BSDD when it has been grouped " +
      "in several groupement BSDDs and those BSDDs has been grouped in another one (the same)",
    async () => {
      // cas tordu qui est normalement impossible d'un point de vue métier mais quand même possible
      // de part le schéma des données

      const user = await userFactory();
      const initialForm = await formFactory({
        ownerId: user.id,
        opt: {
          ...operationData,
          processingOperationDone: "D 13",
          quantityReceived: 10
        }
      });
      // ventile 1 tiers de la quantité sur le BSDD de groupement 1
      const quantity1 = initialForm.quantityReceived!.times(1 / 3).toNumber();
      const groupementForm1 = await formFactory({
        ownerId: user.id,
        opt: {
          grouping: {
            create: {
              initialFormId: initialForm.id,
              quantity: quantity1
            }
          },
          ...operationData,
          processingOperationDone: "D 13",
          quantityReceived: quantity1
        }
      });
      // ventile 2 tiers de la quantité sur le BSDD de groupement 2
      const quantity2 = initialForm
        .quantityReceived!.minus(quantity1)
        .toNumber();
      const groupementForm2 = await formFactory({
        ownerId: user.id,
        opt: {
          grouping: {
            create: {
              initialFormId: initialForm.id,
              quantity: quantity2
            }
          },
          ...operationData,
          processingOperationDone: "D 13",
          quantityReceived: quantity2
        }
      });

      // Les deux bordereaux de groupements sont regroupés dans un nouveau BSDD
      // de groupement créant ainsi une traçabilité en "losange" avec deux chemins
      // possible entre le BSDD de groupement 3 et le BSDD initial
      const groupementForm3 = await formFactory({
        ownerId: user.id,
        opt: {
          grouping: {
            createMany: {
              data: [
                { initialFormId: groupementForm1.id, quantity: quantity1 },
                { initialFormId: groupementForm2.id, quantity: quantity2 }
              ]
            }
          },
          ...operationData,
          quantityReceived: quantity1 + quantity2
        }
      });
      await operationHook(groupementForm3, { runSync: true });

      const updatedInitialForm = await prisma.form.findUniqueOrThrow({
        where: { id: initialForm.id },
        include: { finalOperations: true }
      });

      expect(updatedInitialForm.finalOperations).toHaveLength(1);

      const expectedFinalOperation = {
        finalFormId: groupementForm3.id,
        operationCode: groupementForm3.processingOperationDone,
        noTraceability: false,
        quantity: initialForm.quantityReceived
      };

      expect(updatedInitialForm.finalOperations[0]).toMatchObject(
        expectedFinalOperation
      );
    }
  );

  it(
    "should ponderate final operation based on the fraction grouped that led to this operation >\n" +
      "BSDD1 => groupé en totalité => BSDD2 => groupé partiellement dans BSDD3 et BSDD4 avec traitement final",
    async () => {
      const user = await userFactory();

      const bsdd1 = await formFactory({
        ownerId: user.id,
        opt: {
          ...operationData,
          processingOperationDone: "D 13",
          quantityReceived: 10
        }
      });

      // Le bordereau bsdd1 est regroupé en totalité dans bsdd3
      const bsdd2 = await formFactory({
        ownerId: user.id,
        opt: {
          grouping: {
            createMany: {
              data: [
                {
                  initialFormId: bsdd1.id,
                  quantity: bsdd1.quantityReceived!.toNumber()
                }
              ]
            }
          },
          ...operationData,
          processingOperationDone: "D 13",
          quantityReceived: bsdd1.quantityReceived!
        }
      });

      // bsdd3 est regroupé dans deux bordereaux bsdd4 et bsdd5 avec ventilation des quantités

      // ventile 1/3 de la quantité sur bsdd4
      const quantity3 = bsdd2.quantityReceived!.times(1 / 3);
      const bsdd3 = await formFactory({
        ownerId: user.id,
        opt: {
          grouping: {
            createMany: {
              data: [
                {
                  initialFormId: bsdd2.id,
                  quantity: quantity3.toNumber()
                }
              ]
            }
          },
          ...operationData,
          processingOperationDone: "R 1",
          quantityReceived: quantity3
        }
      });

      // ventile 2/3 de la quantité sur bsdd5
      const quantity4 = bsdd2.quantityReceived!.minus(quantity3);
      const bsdd4 = await formFactory({
        ownerId: user.id,
        opt: {
          grouping: {
            createMany: {
              data: [
                {
                  initialFormId: bsdd2.id,
                  quantity: quantity4.toNumber()
                }
              ]
            }
          },
          ...operationData,
          processingOperationDone: "R 2",
          quantityReceived: quantity4
        }
      });

      await operationHook(bsdd3, { runSync: true });
      await operationHook(bsdd4, { runSync: true });

      const updatedBsdd1 = await prisma.form.findUniqueOrThrow({
        where: { id: bsdd1.id },
        include: { finalOperations: { orderBy: { createdAt: "asc" } } }
      });

      expect(updatedBsdd1.finalOperations).toHaveLength(2);

      const expectedFinalOperation1 = {
        finalFormId: bsdd3.id,
        operationCode: bsdd3.processingOperationDone,
        noTraceability: false
      };

      expect(updatedBsdd1.finalOperations[0]).toMatchObject(
        expectedFinalOperation1
      );
      expect(updatedBsdd1.finalOperations[0].quantity.toFixed(5)).toEqual(
        // il faudrait convertir FormGroupement.quantity en Decimal pour pouvoir
        // comparer ces deux données sans avoir besoin d'arrondir
        bsdd1.quantityReceived!.times(1 / 3).toFixed(5)
      );

      const expectedFinalOperation2 = {
        finalFormId: bsdd4.id,
        operationCode: bsdd4.processingOperationDone,
        noTraceability: false
      };
      expect(updatedBsdd1.finalOperations[1]).toMatchObject(
        expectedFinalOperation2
      );
      expect(updatedBsdd1.finalOperations[1].quantity.toFixed(5)).toEqual(
        // il faudrait convertir FormGroupement.quantity en Decimal pour pouvoir
        // comparer ces deux données sans avoir besoin d'arrondir
        bsdd1.quantityReceived!.times(2 / 3).toFixed(5)
      );
    }
  );
});
