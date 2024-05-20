import {
  companyFactory,
  formFactory,
  formWithTempStorageFactory,
  userFactory,
  userWithCompanyFactory
} from "../../__tests__/factories";
import { formToBsdd } from "../compat";
import { toAllWaste, toIncomingWaste, toOutgoingWaste } from "../registry";
import { prisma } from "@td/prisma";
import { RegistryFormInclude } from "../../registry/elastic";
import {
  refreshElasticSearch,
  resetDatabase
} from "../../../integration-tests/helper";
import { CompanyType, Status, UserRole } from "@prisma/client";
import makeClient from "../../__tests__/testClient";
import { indexForm, getFormForElastic } from "../elastic";

const createTmpStorageBsdd = async () => {
  const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
    companyTypes: {
      set: ["PRODUCER"]
    }
  });

  const transporter = await userWithCompanyFactory(UserRole.ADMIN, {
    companyTypes: {
      set: ["TRANSPORTER"]
    }
  });

  const transporter2 = await userWithCompanyFactory(UserRole.ADMIN, {
    companyTypes: {
      set: ["TRANSPORTER"]
    }
  });

  const destination = await userWithCompanyFactory(UserRole.ADMIN, {
    companyTypes: {
      set: ["WASTEPROCESSOR"]
    }
  });

  const ttr = await userWithCompanyFactory(UserRole.ADMIN, {
    companyTypes: {
      set: ["WASTEPROCESSOR"]
    }
  });
  const bsdd = await formWithTempStorageFactory({
    ownerId: emitter.user.id,
    opt: {
      status: "PROCESSED",
      emittedAt: new Date(),
      sentAt: new Date(),
      takenOverAt: new Date(),
      receivedAt: new Date(),
      processedAt: new Date(),
      emitterCompanySiret: emitter.company.siret,
      transporters: {
        create: {
          transporterCompanySiret: transporter.company.siret,
          takenOverAt: new Date(),
          number: 1
        }
      },
      recipientCompanySiret: ttr.company.siret
    },
    forwardedInOpts: {
      status: "PROCESSED",
      emittedAt: new Date(),
      sentAt: new Date(),
      takenOverAt: new Date(),
      receivedAt: new Date(),
      processedAt: new Date(),
      emitterCompanySiret: ttr.company.siret,
      transporters: {
        create: {
          transporterCompanySiret: transporter2.company.siret,
          takenOverAt: new Date(),
          number: 1
        }
      },
      recipientCompanySiret: destination.company.siret
    }
  });

  await indexForm(await getFormForElastic(bsdd));
  await refreshElasticSearch();

  return bsdd;
};

describe("toIncomingWaste", () => {
  afterAll(resetDatabase);

  it("initial producer should be filled when forwarded BSD", async () => {
    // Given
    const bdd = await createTmpStorageBsdd();

    // When
    const formForRegistry = await prisma.form.findUniqueOrThrow({
      where: { readableId: `${bdd.readableId}-suite` },
      include: RegistryFormInclude
    });
    const wasteRegistry = toIncomingWaste(formToBsdd(formForRegistry));

    // Then
    expect(wasteRegistry.initialEmitterCompanyAddress).toBe(
      bdd.emitterCompanyAddress
    );
    expect(wasteRegistry.initialEmitterCompanyName).toBe(
      bdd.emitterCompanyName
    );
    expect(wasteRegistry.initialEmitterCompanySiret).toBe(
      bdd.emitterCompanySiret
    );
  });
});

describe("toOutgoingWaste", () => {
  afterAll(resetDatabase);

  it(
    "should compute destinationFinalOperationCodes" +
      " and destinationfinalOperationWeights",
    async () => {
      const user = await userFactory();
      const finalForm1 = await formFactory({ ownerId: user.id });
      const finalForm2 = await formFactory({ ownerId: user.id });
      const finalForm3 = await formFactory({ ownerId: user.id });

      const form = await formFactory({
        ownerId: user.id,
        opt: {
          finalOperations: {
            createMany: {
              data: [
                {
                  finalFormId: finalForm1.id,
                  operationCode: "R 1",
                  noTraceability: false,
                  quantity: 1
                },
                {
                  finalFormId: finalForm2.id,
                  operationCode: "R 2",
                  noTraceability: false,
                  quantity: 2
                },
                {
                  finalFormId: finalForm3.id,
                  operationCode: "D 13",
                  noTraceability: true,
                  quantity: 3
                }
              ]
            }
          }
        }
      });
      const formForRegistry = await prisma.form.findUniqueOrThrow({
        where: { id: form.id },
        include: RegistryFormInclude
      });
      const waste = toOutgoingWaste(formToBsdd(formForRegistry));
      expect(waste.destinationFinalOperationCodes).toStrictEqual([
        "R 1",
        "R 2",
        "D 13"
      ]);
      expect(waste.destinationFinalOperationWeights).toStrictEqual([1, 2, 3]);
    }
  );

  it("initial producer should be filled when forwarded BSD", async () => {
    // Given
    const bdd = await createTmpStorageBsdd();

    // When
    const formForRegistry = await prisma.form.findUniqueOrThrow({
      where: { readableId: `${bdd.readableId}-suite` },
      include: RegistryFormInclude
    });
    const wasteRegistry = toOutgoingWaste(formToBsdd(formForRegistry));

    // Then
    expect(wasteRegistry.initialEmitterCompanyAddress).toBe(
      bdd.emitterCompanyAddress
    );
    expect(wasteRegistry.initialEmitterCompanyName).toBe(
      bdd.emitterCompanyName
    );
    expect(wasteRegistry.initialEmitterCompanySiret).toBe(
      bdd.emitterCompanySiret
    );
  });
});

describe("toAllWaste", () => {
  it(
    "should compute destinationFinalOperationCodes" +
      " and destinationfinalOperationWeights",
    async () => {
      const user = await userFactory();
      const finalForm1 = await formFactory({ ownerId: user.id });
      const finalForm2 = await formFactory({ ownerId: user.id });
      const finalForm3 = await formFactory({ ownerId: user.id });

      const form = await formFactory({
        ownerId: user.id,
        opt: {
          finalOperations: {
            createMany: {
              data: [
                {
                  finalFormId: finalForm1.id,
                  operationCode: "R 1",
                  noTraceability: false,
                  quantity: 1
                },
                {
                  finalFormId: finalForm2.id,
                  operationCode: "R 2",
                  noTraceability: false,
                  quantity: 2
                },
                {
                  finalFormId: finalForm3.id,
                  operationCode: "D 13",
                  noTraceability: true,
                  quantity: 3
                }
              ]
            }
          }
        }
      });
      const formForRegistry = await prisma.form.findUniqueOrThrow({
        where: { id: form.id },
        include: RegistryFormInclude
      });
      const waste = toAllWaste(formToBsdd(formForRegistry));
      expect(waste.destinationFinalOperationCodes).toStrictEqual([
        "R 1",
        "R 2",
        "D 13"
      ]);
      expect(waste.destinationFinalOperationWeights).toStrictEqual([1, 2, 3]);
    }
  );

  it("initial producer should be filled when forwarded BSD", async () => {
    // Given
    const bdd = await createTmpStorageBsdd();

    // When
    const formForRegistry = await prisma.form.findUniqueOrThrow({
      where: { readableId: `${bdd.readableId}-suite` },
      include: RegistryFormInclude
    });
    const wasteRegistry = toAllWaste(formToBsdd(formForRegistry));

    // Then
    expect(wasteRegistry.initialEmitterCompanyAddress).toBe(
      bdd.emitterCompanyAddress
    );
    expect(wasteRegistry.initialEmitterCompanyName).toBe(
      bdd.emitterCompanyName
    );
    expect(wasteRegistry.initialEmitterCompanySiret).toBe(
      bdd.emitterCompanySiret
    );
  });
});
