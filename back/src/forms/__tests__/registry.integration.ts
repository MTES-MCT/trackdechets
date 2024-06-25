import {
  formFactory,
  formWithTempStorageFactory,
  userFactory,
  userWithCompanyFactory
} from "../../__tests__/factories";
import { formToBsdd } from "../compat";
import {
  getSubType,
  toAllWaste,
  toGenericWaste,
  toIncomingWaste,
  toManagedWaste,
  toOutgoingWaste
} from "../registry";
import { prisma } from "@td/prisma";
import { RegistryFormInclude } from "../../registry/elastic";
import {
  refreshElasticSearch,
  resetDatabase
} from "../../../integration-tests/helper";
import { UserRole } from "@prisma/client";
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

  it("should contain nextDestination operation code & notification number", async () => {
    // Given
    const user = await userFactory();
    const bdd = await formFactory({
      ownerId: user.id,
      opt: {
        nextDestinationNotificationNumber: "A7E AAAA DDDRRR",
        nextDestinationProcessingOperation: "D9"
      }
    });

    // When
    const formForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: bdd.id },
      include: RegistryFormInclude
    });
    const waste = toIncomingWaste(formToBsdd(formForRegistry));

    // Then
    expect(waste.nextDestinationNotificationNumber).toBe("A7E AAAA DDDRRR");
    expect(waste.nextDestinationProcessingOperation).toBe("D9");
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

  it("should contain nextDestination operation code & notification number", async () => {
    // Given
    const user = await userFactory();
    const bdd = await formFactory({
      ownerId: user.id,
      opt: {
        nextDestinationNotificationNumber: "A7E AAAA DDDRRR",
        nextDestinationProcessingOperation: "D9"
      }
    });

    // When
    const formForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: bdd.id },
      include: RegistryFormInclude
    });
    const waste = toOutgoingWaste(formToBsdd(formForRegistry));

    // Then
    expect(waste.nextDestinationNotificationNumber).toBe("A7E AAAA DDDRRR");
    expect(waste.nextDestinationProcessingOperation).toBe("D9");
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

  it("should contain nextDestination operation code & notification number", async () => {
    // Given
    const user = await userFactory();
    const bdd = await formFactory({
      ownerId: user.id,
      opt: {
        nextDestinationNotificationNumber: "A7E AAAA DDDRRR",
        nextDestinationProcessingOperation: "D9"
      }
    });

    // When
    const formForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: bdd.id },
      include: RegistryFormInclude
    });
    const waste = toAllWaste(formToBsdd(formForRegistry));

    // Then
    expect(waste.nextDestinationNotificationNumber).toBe("A7E AAAA DDDRRR");
    expect(waste.nextDestinationProcessingOperation).toBe("D9");
  });
});

describe("toManagedWaste", () => {
  it("should contain nextDestination operation code & notification number", async () => {
    // Given
    const user = await userFactory();
    const bdd = await formFactory({
      ownerId: user.id,
      opt: {
        nextDestinationNotificationNumber: "A7E AAAA DDDRRR",
        nextDestinationProcessingOperation: "D9"
      }
    });

    // When
    const formForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: bdd.id },
      include: RegistryFormInclude
    });
    const waste = toManagedWaste(formToBsdd(formForRegistry));

    // Then
    expect(waste.nextDestinationNotificationNumber).toBe("A7E AAAA DDDRRR");
    expect(waste.nextDestinationProcessingOperation).toBe("D9");
  });
});

describe("toGenericWaste", () => {
  it("should contain the destination, trader & broker email addresses", async () => {
    // Given
    const user = await userFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        brokerCompanyMail: "broker@mail.com",
        recipientCompanyMail: "destination@mail.com",
        traderCompanyMail: "trader@mail.com"
      }
    });

    // When
    const formForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: RegistryFormInclude
    });
    const waste = toGenericWaste(formToBsdd(formForRegistry));

    // Then
    expect(waste.destinationCompanyMail).toEqual("destination@mail.com");
    expect(waste.brokerCompanyMail).toEqual("broker@mail.com");
    expect(waste.traderCompanyMail).toEqual("trader@mail.com");
  });
});

describe("getSubType", () => {
  afterAll(resetDatabase);

  it("emitter type is APPENDIX1 > should return TOURNEE", async () => {
    // Given
    const user = await userFactory();
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterType: "APPENDIX1" }
    });

    // When
    const bsddForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: bsdd.id },
      include: RegistryFormInclude
    });
    const subType = getSubType(formToBsdd(bsddForRegistry));

    // Then
    expect(subType).toBe("TOURNEE");
  });

  it("emitter type is APPENDIX1_PRODUCER > should return APPENDIX1", async () => {
    // Given
    const user = await userFactory();
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterType: "APPENDIX1_PRODUCER" }
    });

    // When
    const bsddForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: bsdd.id },
      include: RegistryFormInclude
    });
    const subType = getSubType(formToBsdd(bsddForRegistry));

    // Then
    expect(subType).toBe("APPENDIX1");
  });

  it("emitter type is APPENDIX2 > should return APPENDIX2", async () => {
    // Given
    const user = await userFactory();
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterType: "APPENDIX2" }
    });

    // When
    const bsddForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: bsdd.id },
      include: RegistryFormInclude
    });
    const subType = getSubType(formToBsdd(bsddForRegistry));

    // Then
    expect(subType).toBe("APPENDIX2");
  });

  it("form is temp stored > should return TEMP_STORED", async () => {
    // Given
    const user = await userFactory();
    const bsdd = await formWithTempStorageFactory({
      ownerId: user.id
    });

    // When
    const bsddForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: bsdd.id },
      include: RegistryFormInclude
    });
    const subType = getSubType(formToBsdd(bsddForRegistry));

    const bsddSuiteForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: bsdd.forwardedInId! },
      include: RegistryFormInclude
    });
    const bsdSuitesubType = getSubType(formToBsdd(bsddSuiteForRegistry));

    // Then
    expect(subType).toBe("TEMP_STORED");
    expect(bsdSuitesubType).toBe("TEMP_STORED");
  });

  it("regular form > should return INITIAL", async () => {
    // Given
    const user = await userFactory();
    const bsdd = await formFactory({
      ownerId: user.id
    });

    // When
    const bsddForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: bsdd.id },
      include: RegistryFormInclude
    });
    const subType = getSubType(formToBsdd(bsddForRegistry));

    // Then
    expect(subType).toBe("INITIAL");
  });
});
