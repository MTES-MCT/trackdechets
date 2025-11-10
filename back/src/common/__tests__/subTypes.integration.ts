import { BsdasriType, BsdaType, BsffType } from "@td/prisma";
import { prisma } from "@td/prisma";
import { resetDatabase } from "../../../integration-tests/helper";
import { bsdaFactory } from "../../bsda/__tests__/factories";
import {
  getBsdasriSubType,
  getBsdaSubType,
  getBsddSubType,
  getBsffSubType
} from "../subTypes";
import { createBsff } from "../../bsffs/__tests__/factories";
import {
  userFactory,
  formFactory,
  formWithTempStorageFactory
} from "../../__tests__/factories";
import { formToBsdd } from "../../forms/compat";
import { bsdasriFactory } from "../../bsdasris/__tests__/factories";
import {
  RegistryV2BsdaInclude,
  RegistryV2BsddInclude,
  RegistryV2BsffInclude,
  RegistryV2BsdasriInclude
} from "../../registryV2/types";

describe("getBsdaSubType", () => {
  afterAll(resetDatabase);

  it("type is OTHER_COLLECTIONS > should return INITIAL", async () => {
    // Given
    const bsda = await bsdaFactory({ opt: { type: "OTHER_COLLECTIONS" } });
    const bsdaForRegistry = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsda.id },
      include: RegistryV2BsdaInclude
    });

    // Then (ES)
    expect(getBsdaSubType(bsda)).toBe("INITIAL");

    // Then (registry)
    expect(getBsdaSubType(bsdaForRegistry)).toBe("INITIAL");
  });

  it.each([BsdaType.GATHERING, BsdaType.RESHIPMENT, BsdaType.COLLECTION_2710])(
    "type is %p > should return %p",
    async type => {
      // Given
      const bsda = await bsdaFactory({ opt: { type } });
      // When
      const bsdaForRegistry = await prisma.bsda.findUniqueOrThrow({
        where: { id: bsda.id },
        include: RegistryV2BsdaInclude
      });

      // Then (ES)
      expect(getBsdaSubType(bsda)).toBe(type);

      // Then (registry)
      expect(getBsdaSubType(bsdaForRegistry)).toBe(type);
    }
  );
});

describe("getBsffSubType", () => {
  afterAll(resetDatabase);

  it.each([
    [BsffType.COLLECTE_PETITES_QUANTITES, "INITIAL"],
    [BsffType.TRACER_FLUIDE, "INITIAL"],
    [BsffType.GROUPEMENT, "GROUPEMENT"],
    [BsffType.RECONDITIONNEMENT, "RECONDITIONNEMENT"],
    [BsffType.REEXPEDITION, "RESHIPMENT"]
  ])("type is %p > should return %p", async (type, expectedSubType) => {
    // Given
    const bsff = await createBsff({}, { data: { type } });
    const bsffForRegistry = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: RegistryV2BsffInclude
    });

    // Then (ES)
    expect(getBsffSubType(bsff)).toBe(expectedSubType);

    // Then (registry)
    expect(getBsffSubType(bsffForRegistry)).toBe(expectedSubType);
  });
});

describe("getBsddSubType", () => {
  afterAll(resetDatabase);

  it("emitter type is APPENDIX1 > should return TOURNEE", async () => {
    // Given
    const user = await userFactory();
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterType: "APPENDIX1" }
    });
    const bsddForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: bsdd.id },
      include: RegistryV2BsddInclude
    });

    // Then (ES)
    expect(getBsddSubType(bsdd)).toBe("TOURNEE");

    // Then (registry)
    expect(getBsddSubType(formToBsdd(bsddForRegistry))).toBe("TOURNEE");
  });

  it("emitter type is APPENDIX1_PRODUCER > should return APPENDIX1", async () => {
    // Given
    const user = await userFactory();
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterType: "APPENDIX1_PRODUCER" }
    });
    const bsddForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: bsdd.id },
      include: RegistryV2BsddInclude
    });

    // Then (ES)
    expect(getBsddSubType(bsdd)).toBe("APPENDIX1");

    // Then (registry)
    expect(getBsddSubType(formToBsdd(bsddForRegistry))).toBe("APPENDIX1");
  });

  it("emitter type is APPENDIX2 > should return APPENDIX2", async () => {
    // Given
    const user = await userFactory();
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterType: "APPENDIX2" }
    });
    const bsddForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: bsdd.id },
      include: RegistryV2BsddInclude
    });

    // Then (ES)
    expect(getBsddSubType(bsdd)).toBe("APPENDIX2");

    // Then (registry)
    expect(getBsddSubType(formToBsdd(bsddForRegistry))).toBe("APPENDIX2");
  });

  it("form is temp stored > should return TEMP_STORED", async () => {
    // Given
    const user = await userFactory();
    const bsdd = await formWithTempStorageFactory({
      ownerId: user.id
    });
    const bsddForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: bsdd.id },
      include: RegistryV2BsddInclude
    });
    const bsddSuiteForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: bsdd.forwardedInId! },
      include: RegistryV2BsddInclude
    });

    // Then (ES)
    expect(getBsddSubType(bsdd)).toBe("TEMP_STORED");
    expect(getBsddSubType(bsddSuiteForRegistry)).toBe("TEMP_STORED");

    // Then (registry)
    expect(getBsddSubType(formToBsdd(bsddForRegistry))).toBe("TEMP_STORED");
    expect(getBsddSubType(formToBsdd(bsddSuiteForRegistry))).toBe(
      "TEMP_STORED"
    );
  });

  it("regular form > should return INITIAL", async () => {
    // Given
    const user = await userFactory();
    const bsdd = await formFactory({
      ownerId: user.id
    });
    const bsddForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: bsdd.id },
      include: RegistryV2BsddInclude
    });

    // Then (ES)
    expect(getBsddSubType(bsdd)).toBe("INITIAL");

    // Then (registry)
    expect(getBsddSubType(formToBsdd(bsddForRegistry))).toBe("INITIAL");
  });
});

describe("getBsdasriSubType", () => {
  afterAll(resetDatabase);

  it.each([
    [BsdasriType.SIMPLE, "INITIAL"],
    [BsdasriType.SYNTHESIS, "SYNTHESIS"],
    [BsdasriType.GROUPING, "GATHERING"]
  ])("type is %p > should return %p", async (type, expectedSubType) => {
    // Given
    const bsdasri = await bsdasriFactory({ opt: { type } });
    const bsdasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: bsdasri.id },
      include: RegistryV2BsdasriInclude
    });

    // Then (ES)
    expect(getBsdasriSubType(bsdasri)).toBe(expectedSubType);

    // Then (registry)
    expect(getBsdasriSubType(bsdasriForRegistry)).toBe(expectedSubType);
  });
});
