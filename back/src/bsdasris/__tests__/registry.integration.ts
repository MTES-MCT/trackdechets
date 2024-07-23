import {
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
