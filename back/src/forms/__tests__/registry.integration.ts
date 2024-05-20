import {
  formFactory,
  formWithTempStorageFactory,
  userFactory
} from "../../__tests__/factories";
import { formToBsdd } from "../compat";
import { getSubType, toAllWaste, toOutgoingWaste } from "../registry";
import { prisma } from "@td/prisma";
import { RegistryFormInclude } from "../../registry/elastic";
import { resetDatabase } from "../../../integration-tests/helper";

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

    // Then
    expect(subType).toBe("TEMP_STORED");
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
