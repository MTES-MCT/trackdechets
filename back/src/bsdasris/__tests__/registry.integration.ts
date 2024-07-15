import {
  getSubType,
  toAllWaste,
  toIncomingWaste,
  toManagedWaste,
  toOutgoingWaste,
  toTransportedWaste,
  toGenericWaste
} from "../registry";
import { prisma } from "@td/prisma";
import { RegistryBsdasriInclude } from "../../registry/elastic";
import { bsdasriFactory } from "./factories";
import { resetDatabase } from "../../../integration-tests/helper";
import { BsdasriType } from "@prisma/client";
import { companyFactory } from "../../__tests__/factories";

describe("toIncomingWaste", () => {
  afterAll(resetDatabase);

  it("should contain transporters info except plates", async () => {
    // Given
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });
    const dasri = await bsdasriFactory({
      opt: {
        destinationCompanyMail: "destination@mail.com",
        transporterCompanySiret: transporter.siret,
        transporterTransportPlates: ["TRANSPORTER-NBR-PLATES"]
      }
    });

    // When
    const dasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id },
      include: RegistryBsdasriInclude
    });
    const waste = toIncomingWaste(dasriForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      dasriForRegistry.transporterCompanySiret
    );
    expect(waste["transporterNumberPlates"]).toBeUndefined();

    expect(waste.transporter2CompanySiret).toBeNull();
    expect(waste["transporter2NumberPlates"]).toBeUndefined();

    expect(waste.transporter3CompanySiret).toBeNull();
    expect(waste["transporter3NumberPlates"]).toBeUndefined();

    expect(waste.transporter4CompanySiret).toBeNull();
    expect(waste["transporter4NumberPlates"]).toBeUndefined();

    expect(waste.transporter5CompanySiret).toBeNull();
    expect(waste["transporter5NumberPlates"]).toBeUndefined();
  });

  it("should contain null initialEmitter data", async () => {
    // Given
    const dasri = await bsdasriFactory({});

    // When
    const dasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id },
      include: RegistryBsdasriInclude
    });
    const waste = toIncomingWaste(dasriForRegistry);

    // Then
    expect(waste.initialEmitterCompanyAddress).toBeNull();
    expect(waste.initialEmitterCompanyPostalCode).toBeNull();
    expect(waste.initialEmitterCompanyCity).toBeNull();
    expect(waste.initialEmitterCompanyCountry).toBeNull();
    expect(waste.initialEmitterCompanyName).toBeNull();
    expect(waste.initialEmitterCompanySiret).toBeNull();
  });
});

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

  it("should contain transporters info except plates", async () => {
    // Given
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });
    const dasri = await bsdasriFactory({
      opt: {
        destinationCompanyMail: "destination@mail.com",
        transporterCompanySiret: transporter.siret,
        transporterTransportPlates: ["TRANSPORTER-NBR-PLATES"]
      }
    });

    // When
    const dasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id },
      include: RegistryBsdasriInclude
    });
    const waste = toOutgoingWaste(dasriForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      dasriForRegistry.transporterCompanySiret
    );
    expect(waste["transporterNumberPlates"]).toBeUndefined();

    expect(waste.transporter2CompanySiret).toBeNull();
    expect(waste["transporter2NumberPlates"]).toBeUndefined();

    expect(waste.transporter3CompanySiret).toBeNull();
    expect(waste["transporter3NumberPlates"]).toBeUndefined();

    expect(waste.transporter4CompanySiret).toBeNull();
    expect(waste["transporter4NumberPlates"]).toBeUndefined();

    expect(waste.transporter5CompanySiret).toBeNull();
    expect(waste["transporter5NumberPlates"]).toBeUndefined();
  });

  it("should contain null initialEmitter data", async () => {
    // Given
    const dasri = await bsdasriFactory({});

    // When
    const dasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id },
      include: RegistryBsdasriInclude
    });
    const waste = toOutgoingWaste(dasriForRegistry);

    // Then
    expect(waste.initialEmitterCompanyAddress).toBeNull();
    expect(waste.initialEmitterCompanyPostalCode).toBeNull();
    expect(waste.initialEmitterCompanyCity).toBeNull();
    expect(waste.initialEmitterCompanyCountry).toBeNull();
    expect(waste.initialEmitterCompanyName).toBeNull();
    expect(waste.initialEmitterCompanySiret).toBeNull();
  });
});

describe("toManagedWaste", () => {
  afterAll(resetDatabase);

  it("should contain transporters info except plates", async () => {
    // Given
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });
    const dasri = await bsdasriFactory({
      opt: {
        destinationCompanyMail: "destination@mail.com",
        transporterCompanySiret: transporter.siret,
        transporterTransportPlates: ["TRANSPORTER-NBR-PLATES"]
      }
    });

    // When
    const dasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id },
      include: RegistryBsdasriInclude
    });
    const waste = toManagedWaste(dasriForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      dasriForRegistry.transporterCompanySiret
    );
    expect(waste["transporterNumberPlates"]).toBeUndefined();

    expect(waste.transporter2CompanySiret).toBeNull();
    expect(waste["transporter2NumberPlates"]).toBeUndefined();

    expect(waste.transporter3CompanySiret).toBeNull();
    expect(waste["transporter3NumberPlates"]).toBeUndefined();

    expect(waste.transporter4CompanySiret).toBeNull();
    expect(waste["transporter4NumberPlates"]).toBeUndefined();

    expect(waste.transporter5CompanySiret).toBeNull();
    expect(waste["transporter5NumberPlates"]).toBeUndefined();
  });
});

describe("toTransportedWaste", () => {
  afterAll(resetDatabase);

  it("should contain transporters info including plates", async () => {
    // Given
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });
    const dasri = await bsdasriFactory({
      opt: {
        destinationCompanyMail: "destination@mail.com",
        transporterCompanySiret: transporter.siret,
        transporterTransportPlates: ["TRANSPORTER-NBR-PLATES"]
      }
    });

    // When
    const dasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id },
      include: RegistryBsdasriInclude
    });
    const waste = toTransportedWaste(dasriForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      dasriForRegistry.transporterCompanySiret
    );
    expect(waste.transporterNumberPlates).toStrictEqual([
      "TRANSPORTER-NBR-PLATES"
    ]);

    expect(waste.transporter2CompanySiret).toBeNull();
    expect(waste.transporter2NumberPlates).toBeNull();

    expect(waste.transporter3CompanySiret).toBeNull();
    expect(waste.transporter3NumberPlates).toBeNull();

    expect(waste.transporter4CompanySiret).toBeNull();
    expect(waste.transporter4NumberPlates).toBeNull();

    expect(waste.transporter5CompanySiret).toBeNull();
    expect(waste.transporter5NumberPlates).toBeNull();
  });
});

describe("toAllWaste", () => {
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
      const waste = toAllWaste(bsdasriForRegistry);
      expect(waste.destinationFinalOperationCodes).toStrictEqual([
        "R 5",
        "D 5"
      ]);
      expect(waste.destinationFinalOperationWeights).toStrictEqual([1, 2]);
    }
  );

  it("should contain transporters info including plates", async () => {
    // Given
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });
    const dasri = await bsdasriFactory({
      opt: {
        destinationCompanyMail: "destination@mail.com",
        transporterCompanySiret: transporter.siret,
        transporterTransportPlates: ["TRANSPORTER-NBR-PLATES"]
      }
    });

    // When
    const dasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id },
      include: RegistryBsdasriInclude
    });
    const waste = toAllWaste(dasriForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      dasriForRegistry.transporterCompanySiret
    );
    expect(waste.transporterNumberPlates).toStrictEqual([
      "TRANSPORTER-NBR-PLATES"
    ]);

    expect(waste.transporter2CompanySiret).toBeNull();
    expect(waste.transporter2NumberPlates).toBeNull();

    expect(waste.transporter3CompanySiret).toBeNull();
    expect(waste.transporter3NumberPlates).toBeNull();

    expect(waste.transporter4CompanySiret).toBeNull();
    expect(waste.transporter4NumberPlates).toBeNull();

    expect(waste.transporter5CompanySiret).toBeNull();
    expect(waste.transporter5NumberPlates).toBeNull();
  });

  it("should contain null initialEmitter data", async () => {
    // Given
    const dasri = await bsdasriFactory({});

    // When
    const dasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id },
      include: RegistryBsdasriInclude
    });
    const waste = toAllWaste(dasriForRegistry);

    // Then
    expect(waste.initialEmitterCompanyAddress).toBeNull();
    expect(waste.initialEmitterCompanyPostalCode).toBeNull();
    expect(waste.initialEmitterCompanyCity).toBeNull();
    expect(waste.initialEmitterCompanyCountry).toBeNull();
    expect(waste.initialEmitterCompanyName).toBeNull();
    expect(waste.initialEmitterCompanySiret).toBeNull();
  });
});

describe("toGenericWaste", () => {
  afterAll(resetDatabase);

  it("should contain destinationCompanyMail", async () => {
    // Given
    const bsdasri = await bsdasriFactory({
      opt: { destinationCompanyMail: "destination@mail.com" }
    });

    // When
    const bsdasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: bsdasri.id },
      include: RegistryBsdasriInclude
    });
    const waste = toGenericWaste(bsdasriForRegistry);

    // Then
    expect(waste.destinationCompanyMail).toBe("destination@mail.com");
  });

  it("should contain destination's splitted address, name & siret", async () => {
    // Given
    const destination = await companyFactory({
      name: "Acme Inc",
      address: "4 Boulevard Pasteur 44100 Nantes"
    });
    const bsdasri = await bsdasriFactory({
      opt: {
        destinationCompanyName: destination.name,
        destinationCompanyAddress: destination.address,
        destinationCompanySiret: destination.siret
      }
    });

    // When
    const bsdasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: bsdasri.id },
      include: RegistryBsdasriInclude
    });
    const waste = toGenericWaste(bsdasriForRegistry);

    // Then
    expect(waste.destinationCompanyAddress).toBe("4 Boulevard Pasteur");
    expect(waste.destinationCompanyPostalCode).toBe("44100");
    expect(waste.destinationCompanyCity).toBe("Nantes");
    expect(waste.destinationCompanyCountry).toBe("FR");

    expect(waste.destinationCompanySiret).toBe(destination.siret);
    expect(waste.destinationCompanyName).toBe(destination.name);
  });
});

describe("getSubType", () => {
  afterAll(resetDatabase);

  it.each([
    [BsdasriType.SIMPLE, "INITIAL"],
    [BsdasriType.SYNTHESIS, "SYNTHESIS"],
    [BsdasriType.GROUPING, "GATHERING"]
  ])("type is %p > should return %p", async (type, expectedSubType) => {
    // Given
    const bsdasri = await bsdasriFactory({ opt: { type } });

    // When
    const bsdasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: bsdasri.id },
      include: RegistryBsdasriInclude
    });
    const subType = getSubType(bsdasriForRegistry);

    // Then
    expect(subType).toBe(expectedSubType);
  });
});

describe("getTransporterData", () => {
  afterAll(resetDatabase);

  it("should contain the splitted addresses of all transporters", async () => {
    // Given
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });
    const dasri = await bsdasriFactory({
      opt: {
        transporterCompanySiret: transporter.siret,
        transporterCompanyAddress: "4 Boulevard Pasteur 44100 Nantes"
      }
    });

    // When
    const dasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id },
      include: RegistryBsdasriInclude
    });
    const waste = toAllWaste(dasriForRegistry);

    // Then
    expect(waste.transporterCompanyAddress).toBe("4 Boulevard Pasteur");
    expect(waste.transporterCompanyPostalCode).toBe("44100");
    expect(waste.transporterCompanyCity).toBe("Nantes");
    expect(waste.transporterCompanyCountry).toBe("FR");
  });
});
