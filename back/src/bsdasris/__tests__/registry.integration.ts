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
import { siretify } from "../../__tests__/factories";

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
});

describe("toOutgoingWaste", () => {
  afterAll(resetDatabase);

  it(
    "should compute destinationFinalOperationCodes" +
      " and destinationfinalOperationWeights",
    async () => {
      const finalBsdasri1 = await bsdasriFactory({
        opt: {
          destinationOperationCode: "R 5",
          destinationOperationSignatureDate: new Date(),
          destinationReceptionWasteWeightValue: 1,
          destinationCompanySiret: siretify()
        }
      });
      const finalBsdasri2 = await bsdasriFactory({
        opt: {
          destinationOperationCode: "D 5",
          destinationOperationSignatureDate: new Date(),
          destinationReceptionWasteWeightValue: 2,
          destinationCompanySiret: siretify()
        }
      });

      const bsdasri = await bsdasriFactory({
        opt: {
          destinationOperationCode: "D 13",
          destinationOperationSignatureDate: new Date(),
          finalOperations: {
            createMany: {
              data: [
                {
                  finalBsdasriId: finalBsdasri1.id,
                  operationCode: finalBsdasri1.destinationOperationCode!,
                  quantity: finalBsdasri1.destinationReceptionWasteWeightValue!
                },
                {
                  finalBsdasriId: finalBsdasri2.id,
                  operationCode: finalBsdasri2.destinationOperationCode!,
                  quantity: finalBsdasri2.destinationReceptionWasteWeightValue!
                }
              ]
            }
          }
        }
      });
      const bsdasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
        where: { id: bsdasri.id },
        include: RegistryBsdasriInclude
      });
      const waste = toOutgoingWaste(bsdasriForRegistry);
      expect(waste.destinationFinalOperationCodes).toStrictEqual([
        finalBsdasri1.destinationOperationCode,
        finalBsdasri2.destinationOperationCode
      ]);
      expect(waste.destinationFinalOperationWeights).toStrictEqual([
        finalBsdasri1.destinationReceptionWasteWeightValue
          ?.dividedBy(1000)
          .toNumber(),
        finalBsdasri2.destinationReceptionWasteWeightValue
          ?.dividedBy(1000)
          .toNumber()
      ]);
      expect(waste.destinationFinalOperationCompanySirets).toStrictEqual([
        finalBsdasri1.destinationCompanySiret,
        finalBsdasri2.destinationCompanySiret
      ]);
    }
  );

  test(
    "destinationFinalOperationCodes and destinationfinalOperationWeights should be empty" +
      " when bsdasri has a final operation",
    async () => {
      const bsdasri = await bsdasriFactory({
        opt: {
          destinationOperationCode: "R 1",
          destinationOperationSignatureDate: new Date(),
          destinationReceptionWasteWeightValue: 1
        }
      });

      await prisma.bsdasri.update({
        where: { id: bsdasri.id },
        data: {
          finalOperations: {
            createMany: {
              data: [
                {
                  finalBsdasriId: bsdasri.id,
                  operationCode: bsdasri.destinationOperationCode!,
                  quantity: bsdasri.destinationReceptionWasteWeightValue!
                }
              ]
            }
          }
        }
      });

      const bsdasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
        where: { id: bsdasri.id },
        include: RegistryBsdasriInclude
      });
      const waste = toOutgoingWaste(bsdasriForRegistry);
      expect(waste.destinationFinalOperationCodes).toStrictEqual([]);
      expect(waste.destinationFinalOperationWeights).toStrictEqual([]);
      expect(waste.destinationFinalOperationCompanySirets).toStrictEqual([]);
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
      const finalBsdasri1 = await bsdasriFactory({
        opt: {
          destinationOperationCode: "R 5",
          destinationOperationSignatureDate: new Date(),
          destinationReceptionWasteWeightValue: 1,
          destinationCompanySiret: siretify()
        }
      });
      const finalBsdasri2 = await bsdasriFactory({
        opt: {
          destinationOperationCode: "D 5",
          destinationOperationSignatureDate: new Date(),
          destinationReceptionWasteWeightValue: 2,
          destinationCompanySiret: siretify()
        }
      });

      const form = await bsdasriFactory({
        opt: {
          destinationOperationCode: "D 13",
          destinationOperationSignatureDate: new Date(),
          finalOperations: {
            createMany: {
              data: [
                {
                  finalBsdasriId: finalBsdasri1.id,
                  operationCode: finalBsdasri1.destinationOperationCode!,
                  quantity: finalBsdasri1.destinationReceptionWasteWeightValue!
                },
                {
                  finalBsdasriId: finalBsdasri2.id,
                  operationCode: finalBsdasri2.destinationOperationCode!,
                  quantity: finalBsdasri2.destinationReceptionWasteWeightValue!
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
        finalBsdasri1.destinationOperationCode,
        finalBsdasri2.destinationOperationCode
      ]);
      expect(waste.destinationFinalOperationWeights).toStrictEqual([
        finalBsdasri1.destinationReceptionWasteWeightValue
          ?.dividedBy(1000)
          .toNumber(),
        finalBsdasri2.destinationReceptionWasteWeightValue
          ?.dividedBy(1000)
          .toNumber()
      ]);
      expect(waste.destinationFinalOperationCompanySirets).toStrictEqual([
        finalBsdasri1.destinationCompanySiret,
        finalBsdasri2.destinationCompanySiret
      ]);
    }
  );

  test(
    "destinationFinalOperationCodes and destinationfinalOperationWeights should be empty" +
      " when bsdasri has a final operation",
    async () => {
      const bsdasri = await bsdasriFactory({
        opt: {
          destinationOperationCode: "R 1",
          destinationOperationSignatureDate: new Date(),
          destinationReceptionWasteWeightValue: 1
        }
      });

      await prisma.bsdasri.update({
        where: { id: bsdasri.id },
        data: {
          finalOperations: {
            createMany: {
              data: [
                {
                  finalBsdasriId: bsdasri.id,
                  operationCode: bsdasri.destinationOperationCode!,
                  quantity: bsdasri.destinationReceptionWasteWeightValue!
                }
              ]
            }
          }
        }
      });

      const bsdasriForRegistry = await prisma.bsdasri.findUniqueOrThrow({
        where: { id: bsdasri.id },
        include: RegistryBsdasriInclude
      });
      const waste = toAllWaste(bsdasriForRegistry);
      expect(waste.destinationFinalOperationCodes).toStrictEqual([]);
      expect(waste.destinationFinalOperationWeights).toStrictEqual([]);
      expect(waste.destinationFinalOperationCompanySirets).toStrictEqual([]);
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
