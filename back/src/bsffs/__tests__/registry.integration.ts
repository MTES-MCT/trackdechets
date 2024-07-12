import {
  getSubType,
  toAllWaste,
  toIncomingWaste,
  toManagedWaste,
  toOutgoingWaste,
  toTransportedWaste,
  toGenericWaste,
  getTransportersData
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
import { BsffType, UserRole } from "@prisma/client";

const createBsffWith5Transporters = async () => {
  const transporter1 = await userWithCompanyFactory(UserRole.ADMIN, {
    companyTypes: {
      set: ["TRANSPORTER"]
    },
    address: "4 Boulevard Pasteur 44100 Nantes"
  });

  const transporter2 = await userWithCompanyFactory(UserRole.ADMIN, {
    companyTypes: {
      set: ["TRANSPORTER"]
    },
    address: "2 RUE PIERRE BROSSOLETTE 64000 PAU"
  });

  const transporter3 = await userWithCompanyFactory(UserRole.ADMIN, {
    companyTypes: {
      set: ["TRANSPORTER"]
    },
    address: "34 ROUTE DE BRESSUIRE 79200 CHATILLON-SUR-THOUET"
  });

  const transporter4 = await userWithCompanyFactory(UserRole.ADMIN, {
    companyTypes: {
      set: ["TRANSPORTER"]
    },
    address: "15 Rue Jacques Prévert, Le Port 97420, Réunion"
  });

  const transporter5 = await userWithCompanyFactory(UserRole.ADMIN, {
    companyTypes: {
      set: ["TRANSPORTER"]
    },
    address: "VIA TRATTATO DI SCHENGEN 5 15067 NOVI LIGURE AL",
    vatNumber: "IT01144600069"
  });

  const bsff = await createBsff(
    { transporter: transporter1 },
    {
      data: { destinationCompanyMail: "destination@mail.com" },
      transporterData: {
        transporterCompanySiret: transporter1.company.siret,
        transporterTransportPlates: ["TRANSPORTER1-NBR-PLATES"],
        transporterCompanyAddress: transporter1.company.address
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
      bsffForRegistry.transporters[4].transporterCompanyVatNumber
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
      bsffForRegistry.transporters[4].transporterCompanyVatNumber
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
      bsffForRegistry.transporters[4].transporterCompanyVatNumber
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
      bsffForRegistry.transporters[4].transporterCompanyVatNumber
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
      bsffForRegistry.transporters[4].transporterCompanyVatNumber
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

describe("getSubType", () => {
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

    // When
    const bsffForRegistry = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: RegistryBsffInclude
    });
    const subType = getSubType(bsffForRegistry);

    // Then
    expect(subType).toBe(expectedSubType);
  });
});

describe("getTransportersData", () => {
  afterAll(resetDatabase);

  it("should contain the splitted addresses of all transporters", async () => {
    // Given
    const { bsff } = await createBsffWith5Transporters();

    // When
    const bsffForRegistry = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: RegistryBsffInclude
    });
    const waste = getTransportersData(bsffForRegistry);

    // Then
    expect(waste.transporterCompanyAddress).toBe("4 Boulevard Pasteur");
    expect(waste.transporterCompanyPostalCode).toBe("44100");
    expect(waste.transporterCompanyCity).toBe("Nantes");
    expect(waste.transporterCompanyCountry).toBe("FR");

    expect(waste.transporter2CompanyAddress).toBe("2 RUE PIERRE BROSSOLETTE");
    expect(waste.transporter2CompanyPostalCode).toBe("64000");
    expect(waste.transporter2CompanyCity).toBe("PAU");
    expect(waste.transporter2CompanyCountry).toBe("FR");

    expect(waste.transporter3CompanyAddress).toBe("34 ROUTE DE BRESSUIRE");
    expect(waste.transporter3CompanyPostalCode).toBe("79200");
    expect(waste.transporter3CompanyCity).toBe("CHATILLON-SUR-THOUET");
    expect(waste.transporter3CompanyCountry).toBe("FR");

    expect(waste.transporter4CompanyAddress).toBe(
      "15 Rue Jacques Prévert, Le Port"
    );
    expect(waste.transporter4CompanyPostalCode).toBe("97420");
    expect(waste.transporter4CompanyCity).toBe("Réunion");
    expect(waste.transporter4CompanyCountry).toBe("FR");

    // Foreign transporter
    expect(waste.transporter5CompanyAddress).toBe("VIA TRATTATO DI SCHENGEN 5");
    expect(waste.transporter5CompanyPostalCode).toBe("15067");
    expect(waste.transporter5CompanyCity).toBe("NOVI LIGURE AL");
    expect(waste.transporter5CompanyCountry).toBe("IT");
  });
});
