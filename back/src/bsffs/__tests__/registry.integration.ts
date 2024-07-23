import {
  toAllWaste,
  toIncomingWaste,
  toManagedWaste,
  toOutgoingWaste,
  toTransportedWaste,
  toGenericWaste
} from "../registry";
import { prisma } from "@td/prisma";
import { RegistryBsffInclude } from "../../registry/elastic";
import {
  addBsffTransporter,
  createBsff,
  createBsffAfterOperation
} from "./factories";
import { userWithCompanyFactory } from "../../__tests__/factories";
import { resetDatabase } from "../../../integration-tests/helper";

const createBsffWith5Transporters = async () => {
  const transporter1 = await userWithCompanyFactory("MEMBER", {
    companyTypes: ["TRANSPORTER"]
  });
  const transporter2 = await userWithCompanyFactory("MEMBER", {
    companyTypes: ["TRANSPORTER"]
  });
  const transporter3 = await userWithCompanyFactory("MEMBER", {
    companyTypes: ["TRANSPORTER"]
  });
  const transporter4 = await userWithCompanyFactory("MEMBER", {
    companyTypes: ["TRANSPORTER"]
  });
  const transporter5 = await userWithCompanyFactory("MEMBER", {
    companyTypes: ["TRANSPORTER"]
  });
  const bsff = await createBsff(
    { transporter: transporter1 },
    {
      data: { destinationCompanyMail: "destination@mail.com" },
      transporterData: {
        transporterTransportPlates: ["TRANSPORTER1-NBR-PLATES"]
      }
    }
  );

  await addBsffTransporter({
    bsffId: bsff.id,
    transporter: transporter2,
    opt: { transporterTransportPlates: ["TRANSPORTER2-NBR-PLATES"] }
  });
  await addBsffTransporter({
    bsffId: bsff.id,
    transporter: transporter3,
    opt: { transporterTransportPlates: ["TRANSPORTER3-NBR-PLATES"] }
  });
  await addBsffTransporter({
    bsffId: bsff.id,
    transporter: transporter4,
    opt: { transporterTransportPlates: ["TRANSPORTER4-NBR-PLATES"] }
  });
  await addBsffTransporter({
    bsffId: bsff.id,
    transporter: transporter5,
    opt: { transporterTransportPlates: ["TRANSPORTER5-NBR-PLATES"] }
  });

  return {
    bsff,
    transporter1,
    transporter2,
    transporter3,
    transporter4,
    transporter5
  };
};

describe("toOutgoingWaste", () => {
  afterAll(resetDatabase);

  it(
    "should compute destinationFinalOperationCodes" +
      " and destinationfinalOperationWeights",
    async () => {
      const emitter = await userWithCompanyFactory("MEMBER");
      const transporter = await userWithCompanyFactory("MEMBER");
      const ttr = await userWithCompanyFactory("MEMBER");
      const destination = await userWithCompanyFactory("MEMBER");

      const finalBsff = await createBsffAfterOperation({
        emitter: ttr,
        transporter,
        destination
      });

      const finalPackaging = finalBsff.packagings[0];

      const bsff = await createBsffAfterOperation(
        {
          emitter,
          transporter,
          destination
        },
        {
          packagingData: {
            finalOperations: {
              create: {
                finalBsffPackagingId: finalPackaging.id,
                quantity: 1,
                operationCode: "R 1",
                noTraceability: false
              }
            }
          }
        }
      );
      const bsffForRegistry = await prisma.bsff.findUniqueOrThrow({
        where: { id: bsff.id },
        include: RegistryBsffInclude
      });
      const waste = toOutgoingWaste(bsffForRegistry);
      expect(waste.destinationFinalOperationCodes).toStrictEqual(["R 1"]);
      expect(waste.destinationFinalOperationWeights).toStrictEqual([1]);
    }
  );

  it("should contain transporters info except plates", async () => {
    // Given
    const { bsff } = await createBsffWith5Transporters();

    // When
    const bsffForRegistry = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: RegistryBsffInclude
    });
    const waste = toOutgoingWaste(bsffForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      bsffForRegistry.transporters[0].transporterCompanySiret
    );
    expect(waste["transporterNumberPlates"]).toBeUndefined();

    expect(waste.transporter2CompanySiret).toBe(
      bsffForRegistry.transporters[1].transporterCompanySiret
    );
    expect(waste["transporter2NumberPlates"]).toBeUndefined();

    expect(waste.transporter3CompanySiret).toBe(
      bsffForRegistry.transporters[2].transporterCompanySiret
    );
    expect(waste["transporter3NumberPlates"]).toBeUndefined();

    expect(waste.transporter4CompanySiret).toBe(
      bsffForRegistry.transporters[3].transporterCompanySiret
    );
    expect(waste["transporter4NumberPlates"]).toBeUndefined();

    expect(waste.transporter5CompanySiret).toBe(
      bsffForRegistry.transporters[4].transporterCompanySiret
    );
    expect(waste["transporter5NumberPlates"]).toBeUndefined();
  });
});

describe("toIncomingWaste", () => {
  afterAll(resetDatabase);

  it("should contain transporters info except plates", async () => {
    // Given
    const { bsff } = await createBsffWith5Transporters();

    // When
    const bsffForRegistry = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: RegistryBsffInclude
    });
    const waste = toIncomingWaste(bsffForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      bsffForRegistry.transporters[0].transporterCompanySiret
    );
    expect(waste["transporterNumberPlates"]).toBeUndefined();

    expect(waste.transporter2CompanySiret).toBe(
      bsffForRegistry.transporters[1].transporterCompanySiret
    );
    expect(waste["transporter2NumberPlates"]).toBeUndefined();

    expect(waste.transporter3CompanySiret).toBe(
      bsffForRegistry.transporters[2].transporterCompanySiret
    );
    expect(waste["transporter3NumberPlates"]).toBeUndefined();

    expect(waste.transporter4CompanySiret).toBe(
      bsffForRegistry.transporters[3].transporterCompanySiret
    );
    expect(waste["transporter4NumberPlates"]).toBeUndefined();

    expect(waste.transporter5CompanySiret).toBe(
      bsffForRegistry.transporters[4].transporterCompanySiret
    );
    expect(waste["transporter5NumberPlates"]).toBeUndefined();
  });
});

describe("toManagedWaste", () => {
  afterAll(resetDatabase);

  it("should contain transporters info except plates", async () => {
    // Given
    const { bsff } = await createBsffWith5Transporters();

    // When
    const bsffForRegistry = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: RegistryBsffInclude
    });
    const waste = toManagedWaste(bsffForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      bsffForRegistry.transporters[0].transporterCompanySiret
    );
    expect(waste["transporterNumberPlates"]).toBeUndefined();

    expect(waste.transporter2CompanySiret).toBe(
      bsffForRegistry.transporters[1].transporterCompanySiret
    );
    expect(waste["transporter2NumberPlates"]).toBeUndefined();

    expect(waste.transporter3CompanySiret).toBe(
      bsffForRegistry.transporters[2].transporterCompanySiret
    );
    expect(waste["transporter3NumberPlates"]).toBeUndefined();

    expect(waste.transporter4CompanySiret).toBe(
      bsffForRegistry.transporters[3].transporterCompanySiret
    );
    expect(waste["transporter4NumberPlates"]).toBeUndefined();

    expect(waste.transporter5CompanySiret).toBe(
      bsffForRegistry.transporters[4].transporterCompanySiret
    );
    expect(waste["transporter5NumberPlates"]).toBeUndefined();
  });
});

describe("toTransportedWaste", () => {
  afterAll(resetDatabase);

  it("should contain transporters info including plates", async () => {
    // Given
    const { bsff } = await createBsffWith5Transporters();

    // When
    const bsffForRegistry = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: RegistryBsffInclude
    });
    const waste = toTransportedWaste(bsffForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      bsffForRegistry.transporters[0].transporterCompanySiret
    );
    expect(waste.transporterNumberPlates).toStrictEqual([
      "TRANSPORTER1-NBR-PLATES"
    ]);

    expect(waste.transporter2CompanySiret).toBe(
      bsffForRegistry.transporters[1].transporterCompanySiret
    );
    expect(waste.transporter2NumberPlates).toStrictEqual([
      "TRANSPORTER2-NBR-PLATES"
    ]);

    expect(waste.transporter3CompanySiret).toBe(
      bsffForRegistry.transporters[2].transporterCompanySiret
    );
    expect(waste.transporter3NumberPlates).toStrictEqual([
      "TRANSPORTER3-NBR-PLATES"
    ]);

    expect(waste.transporter4CompanySiret).toBe(
      bsffForRegistry.transporters[3].transporterCompanySiret
    );
    expect(waste.transporter4NumberPlates).toStrictEqual([
      "TRANSPORTER4-NBR-PLATES"
    ]);

    expect(waste.transporter5CompanySiret).toBe(
      bsffForRegistry.transporters[4].transporterCompanySiret
    );
    expect(waste.transporter5NumberPlates).toStrictEqual([
      "TRANSPORTER5-NBR-PLATES"
    ]);
  });
});

describe("toAllWaste", () => {
  it(
    "should compute destinationFinalOperationCodes" +
      " and destinationfinalOperationWeights",
    async () => {
      const emitter = await userWithCompanyFactory("MEMBER");
      const transporter = await userWithCompanyFactory("MEMBER");
      const ttr = await userWithCompanyFactory("MEMBER");
      const destination = await userWithCompanyFactory("MEMBER");

      const finalBsff = await createBsffAfterOperation({
        emitter: ttr,
        transporter,
        destination
      });

      const finalPackaging = finalBsff.packagings[0];

      const bsff = await createBsffAfterOperation(
        {
          emitter,
          transporter,
          destination: ttr
        },
        {
          packagingData: {
            finalOperations: {
              create: {
                finalBsffPackagingId: finalPackaging.id,
                quantity: 1,
                operationCode: "R 1",
                noTraceability: false
              }
            }
          }
        }
      );
      const bsffForRegistry = await prisma.bsff.findUniqueOrThrow({
        where: { id: bsff.id },
        include: RegistryBsffInclude
      });
      const waste = toAllWaste(bsffForRegistry);
      expect(waste.destinationFinalOperationCodes).toStrictEqual(["R 1"]);
      expect(waste.destinationFinalOperationWeights).toStrictEqual([1]);
    }
  );

  it("should contain transporters info including plates", async () => {
    // Given
    const { bsff } = await createBsffWith5Transporters();

    // When
    const bsffForRegistry = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: RegistryBsffInclude
    });
    const waste = toTransportedWaste(bsffForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      bsffForRegistry.transporters[0].transporterCompanySiret
    );
    expect(waste.transporterNumberPlates).toStrictEqual([
      "TRANSPORTER1-NBR-PLATES"
    ]);

    expect(waste.transporter2CompanySiret).toBe(
      bsffForRegistry.transporters[1].transporterCompanySiret
    );
    expect(waste.transporter2NumberPlates).toStrictEqual([
      "TRANSPORTER2-NBR-PLATES"
    ]);

    expect(waste.transporter3CompanySiret).toBe(
      bsffForRegistry.transporters[2].transporterCompanySiret
    );
    expect(waste.transporter3NumberPlates).toStrictEqual([
      "TRANSPORTER3-NBR-PLATES"
    ]);

    expect(waste.transporter4CompanySiret).toBe(
      bsffForRegistry.transporters[3].transporterCompanySiret
    );
    expect(waste.transporter4NumberPlates).toStrictEqual([
      "TRANSPORTER4-NBR-PLATES"
    ]);

    expect(waste.transporter5CompanySiret).toBe(
      bsffForRegistry.transporters[4].transporterCompanySiret
    );
    expect(waste.transporter5NumberPlates).toStrictEqual([
      "TRANSPORTER5-NBR-PLATES"
    ]);
  });
});

describe("toGenericWaste", () => {
  it("should contain destinationCompanyMail", async () => {
    // Given
    const bsff = await createBsff(
      {},
      { data: { destinationCompanyMail: "destination@mail.com" } }
    );

    // When
    const bsffForRegistry = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: RegistryBsffInclude
    });
    const waste = toGenericWaste(bsffForRegistry);

    // Then
    expect(waste.destinationCompanyMail).toBe("destination@mail.com");
  });
});
