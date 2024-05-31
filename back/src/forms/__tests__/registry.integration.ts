import {
  formFactory,
  formWithTempStorageFactory,
  toIntermediaryCompany,
  userFactory,
  userWithCompanyFactory
} from "../../__tests__/factories";
import { formToBsdd } from "../compat";
import {
  getSubType,
  toAllWaste,
  toIncomingWaste,
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

  it("should contain all 3 intermediaries", async () => {
    // Given
    const user = await userFactory();
    const intermediary1 = await userWithCompanyFactory(UserRole.MEMBER);
    const intermediary2 = await userWithCompanyFactory(UserRole.MEMBER);
    const intermediary3 = await userWithCompanyFactory(UserRole.MEMBER);
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        intermediaries: {
          create: [
            toIntermediaryCompany(intermediary1.company),
            toIntermediaryCompany(intermediary2.company),
            toIntermediaryCompany(intermediary3.company)
          ]
        }
      }
    });

    // When
    const formForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: bsdd.id },
      include: RegistryFormInclude
    });
    const waste = toAllWaste(formToBsdd(formForRegistry));

    // Then
    expect(waste).not.toBeUndefined();
    expect(waste.intermediary1CompanyName).toBe(intermediary1.company.name);
    expect(waste.intermediary1CompanySiret).toBe(intermediary1.company.siret);
    expect(waste.intermediary2CompanyName).toBe(intermediary2.company.name);
    expect(waste.intermediary2CompanySiret).toBe(intermediary2.company.siret);
    expect(waste.intermediary3CompanyName).toBe(intermediary3.company.name);
    expect(waste.intermediary3CompanySiret).toBe(intermediary3.company.siret);
  });

  it("should work with only 1 intermediary", async () => {
    // Given
    const user = await userFactory();
    const intermediary1 = await userWithCompanyFactory(UserRole.MEMBER);
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        intermediaries: {
          create: [toIntermediaryCompany(intermediary1.company)]
        }
      }
    });

    // When
    const formForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: bsdd.id },
      include: RegistryFormInclude
    });
    const waste = toAllWaste(formToBsdd(formForRegistry));

    // Then
    expect(waste).not.toBeUndefined();
    expect(waste.intermediary1CompanyName).toBe(intermediary1.company.name);
    expect(waste.intermediary1CompanySiret).toBe(intermediary1.company.siret);
    expect(waste.intermediary2CompanyName).toBe(null);
    expect(waste.intermediary2CompanySiret).toBe(null);
    expect(waste.intermediary3CompanyName).toBe(null);
    expect(waste.intermediary3CompanySiret).toBe(null);
  });

  it("should work with 2 intermediaries", async () => {
    // Given
    const user = await userFactory();
    const intermediary1 = await userWithCompanyFactory(UserRole.MEMBER);
    const intermediary2 = await userWithCompanyFactory(UserRole.MEMBER);
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        intermediaries: {
          create: [
            toIntermediaryCompany(intermediary1.company),
            toIntermediaryCompany(intermediary2.company)
          ]
        }
      }
    });

    // When
    const formForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: bsdd.id },
      include: RegistryFormInclude
    });
    const waste = toAllWaste(formToBsdd(formForRegistry));

    // Then
    expect(waste).not.toBeUndefined();
    expect(waste.intermediary1CompanyName).toBe(intermediary1.company.name);
    expect(waste.intermediary1CompanySiret).toBe(intermediary1.company.siret);
    expect(waste.intermediary2CompanyName).toBe(intermediary2.company.name);
    expect(waste.intermediary2CompanySiret).toBe(intermediary2.company.siret);
    expect(waste.intermediary3CompanyName).toBe(null);
    expect(waste.intermediary3CompanySiret).toBe(null);
  });

  it("should not crash if no intermediaries", async () => {
    // Given
    const user = await userFactory();
    const bsdd = await formFactory({ ownerId: user.id });

    // When
    const formForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: bsdd.id },
      include: RegistryFormInclude
    });
    const waste = toAllWaste(formToBsdd(formForRegistry));

    // Then
    expect(waste).not.toBeUndefined();
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
