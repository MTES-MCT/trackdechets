import { prisma } from "@td/prisma";
import { RegistryBspaohInclude } from "../../registry/elastic";
import {
  toAllWaste,
  toIncomingWaste,
  toManagedWaste,
  toOutgoingWaste,
  toTransportedWaste,
  toGenericWaste,
  getTransporterData
} from "../registry";
import { bspaohFactory } from "./factories";
import { resetDatabase } from "../../../integration-tests/helper";
import { companyFactory } from "../../__tests__/factories";

describe("toIncomingWaste", () => {
  afterAll(resetDatabase);

  it("should contain transporters info except plates", async () => {
    // Given
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });
    const bspaoh = await bspaohFactory({
      opt: {
        destinationCompanyMail: "destination@mail.com",
        transporters: {
          create: {
            transporterCompanySiret: transporter.siret,
            transporterTransportPlates: ["TRANSPORTER1-NBR-PLATES"],
            number: 1
          }
        }
      }
    });

    // When
    const paohForRegistry = await prisma.bspaoh.findUniqueOrThrow({
      where: { id: bspaoh.id },
      include: RegistryBspaohInclude
    });
    const waste = toIncomingWaste(paohForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      paohForRegistry.transporters[0].transporterCompanySiret
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
    const bspaoh = await bspaohFactory({});

    // When
    const paohForRegistry = await prisma.bspaoh.findUniqueOrThrow({
      where: { id: bspaoh.id },
      include: RegistryBspaohInclude
    });
    const waste = toIncomingWaste(paohForRegistry);

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

  it("should contain transporters info except plates", async () => {
    // Given
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });
    const bspaoh = await bspaohFactory({
      opt: {
        destinationCompanyMail: "destination@mail.com",
        transporters: {
          create: {
            transporterCompanySiret: transporter.siret,
            transporterTransportPlates: ["TRANSPORTER1-NBR-PLATES"],
            number: 1
          }
        }
      }
    });

    // When
    const paohForRegistry = await prisma.bspaoh.findUniqueOrThrow({
      where: { id: bspaoh.id },
      include: RegistryBspaohInclude
    });
    const waste = toOutgoingWaste(paohForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      paohForRegistry.transporters[0].transporterCompanySiret
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
    const bspaoh = await bspaohFactory({});

    // When
    const paohForRegistry = await prisma.bspaoh.findUniqueOrThrow({
      where: { id: bspaoh.id },
      include: RegistryBspaohInclude
    });
    const waste = toOutgoingWaste(paohForRegistry);

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
    const bspaoh = await bspaohFactory({
      opt: {
        destinationCompanyMail: "destination@mail.com",
        transporters: {
          create: {
            transporterCompanySiret: transporter.siret,
            transporterTransportPlates: ["TRANSPORTER1-NBR-PLATES"],
            number: 1
          }
        }
      }
    });

    // When
    const paohForRegistry = await prisma.bspaoh.findUniqueOrThrow({
      where: { id: bspaoh.id },
      include: RegistryBspaohInclude
    });
    const waste = toManagedWaste(paohForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      paohForRegistry.transporters[0].transporterCompanySiret
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
    const bspaoh = await bspaohFactory({
      opt: {
        destinationCompanyMail: "destination@mail.com",
        transporters: {
          create: {
            transporterCompanySiret: transporter.siret,
            transporterTransportPlates: ["TRANSPORTER1-NBR-PLATES"],
            number: 1
          }
        }
      }
    });

    // When
    const paohForRegistry = await prisma.bspaoh.findUniqueOrThrow({
      where: { id: bspaoh.id },
      include: RegistryBspaohInclude
    });
    const waste = toTransportedWaste(paohForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      paohForRegistry.transporters[0].transporterCompanySiret
    );
    expect(waste.transporterNumberPlates).toStrictEqual([
      "TRANSPORTER1-NBR-PLATES"
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

  it("should contain transporters info including plates", async () => {
    // Given
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });
    const bspaoh = await bspaohFactory({
      opt: {
        destinationCompanyMail: "destination@mail.com",
        transporters: {
          create: {
            transporterCompanySiret: transporter.siret,
            transporterTransportPlates: ["TRANSPORTER1-NBR-PLATES"],
            number: 1
          }
        }
      }
    });

    // When
    const paohForRegistry = await prisma.bspaoh.findUniqueOrThrow({
      where: { id: bspaoh.id },
      include: RegistryBspaohInclude
    });
    const waste = toAllWaste(paohForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      paohForRegistry.transporters[0].transporterCompanySiret
    );
    expect(waste.transporterNumberPlates).toStrictEqual([
      "TRANSPORTER1-NBR-PLATES"
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
    const bspaoh = await bspaohFactory({});

    // When
    const paohForRegistry = await prisma.bspaoh.findUniqueOrThrow({
      where: { id: bspaoh.id },
      include: RegistryBspaohInclude
    });
    const waste = toAllWaste(paohForRegistry);

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
    const paoh = await bspaohFactory({
      opt: { destinationCompanyMail: "destination@mail.com" }
    });

    // When
    const paohForRegistry = await prisma.bspaoh.findUniqueOrThrow({
      where: { id: paoh.id },
      include: RegistryBspaohInclude
    });
    const waste = toGenericWaste(paohForRegistry);

    // Then
    expect(waste.destinationCompanyMail).toBe("destination@mail.com");
  });

  it("should contain destination's splitted address, name & siret", async () => {
    // Given
    const destination = await companyFactory({
      name: "Acme Inc",
      address: "4 Boulevard Pasteur 44100 Nantes"
    });
    const paoh = await bspaohFactory({
      opt: {
        destinationCompanyName: destination.name,
        destinationCompanyAddress: destination.address,
        destinationCompanySiret: destination.siret
      }
    });

    // When
    const paohForRegistry = await prisma.bspaoh.findUniqueOrThrow({
      where: { id: paoh.id },
      include: RegistryBspaohInclude
    });
    const waste = toGenericWaste(paohForRegistry);

    // Then
    expect(waste.destinationCompanyAddress).toBe("4 Boulevard Pasteur");
    expect(waste.destinationCompanyPostalCode).toBe("44100");
    expect(waste.destinationCompanyCity).toBe("Nantes");
    expect(waste.destinationCompanyCountry).toBe("FR");

    expect(waste.destinationCompanySiret).toBe(destination.siret);
    expect(waste.destinationCompanyName).toBe(destination.name);
  });

  it("should contain emitterPickupSite's splitted address & name", async () => {
    // Given
    const paoh = await bspaohFactory({
      opt: {
        emitterPickupSiteName: "Site name",
        emitterPickupSiteAddress: "4 Boulevard Pasteur",
        emitterPickupSitePostalCode: "44100",
        emitterPickupSiteCity: "Nantes"
      }
    });

    // When
    const paohForRegistry = await prisma.bspaoh.findUniqueOrThrow({
      where: { id: paoh.id },
      include: RegistryBspaohInclude
    });
    const waste = toGenericWaste(paohForRegistry);

    // Then
    expect(waste.emitterPickupsiteName).toBe("Site name");
    expect(waste.emitterPickupsiteAddress).toBe("4 Boulevard Pasteur");
    expect(waste.emitterPickupsitePostalCode).toBe("44100");
    expect(waste.emitterPickupsiteCity).toBe("Nantes");
    expect(waste.emitterPickupsiteCountry).toBe("FR");
  });

  it("should contain emitter's splitted address, name & siret", async () => {
    // Given
    const emitter = await companyFactory({
      name: "Emitter company name",
      address: "4 Boulevard Pasteur 44100 Nantes"
    });
    const paoh = await bspaohFactory({
      opt: {
        emitterCompanySiret: emitter.siret,
        emitterCompanyName: emitter.name,
        emitterCompanyAddress: emitter.address
      }
    });

    // When
    const paohForRegistry = await prisma.bspaoh.findUniqueOrThrow({
      where: { id: paoh.id },
      include: RegistryBspaohInclude
    });
    const waste = toGenericWaste(paohForRegistry);

    // Then
    expect(waste.emitterCompanyName).toBe(emitter.name);
    expect(waste.emitterCompanySiret).toBe(emitter.siret);
    expect(waste.emitterCompanyAddress).toBe("4 Boulevard Pasteur");
    expect(waste.emitterCompanyPostalCode).toBe("44100");
    expect(waste.emitterCompanyCity).toBe("Nantes");
    expect(waste.emitterCompanyCountry).toBe("FR");
  });
});

describe("getTransporterData", () => {
  afterAll(resetDatabase);

  it("should contain the splitted addresses of all transporters", async () => {
    // Given
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });
    const paoh = await bspaohFactory({
      opt: {
        destinationCompanyMail: "destination@mail.com",
        transporters: {
          create: {
            transporterCompanySiret: transporter.siret,
            transporterCompanyAddress: "4 Boulevard Pasteur 44100 Nantes",
            number: 1
          }
        }
      }
    });

    // When
    const paohForRegistry = await prisma.bspaoh.findUniqueOrThrow({
      where: { id: paoh.id },
      include: RegistryBspaohInclude
    });
    const waste = getTransporterData(paohForRegistry);

    // Then
    expect(waste.transporterCompanyAddress).toBe("4 Boulevard Pasteur");
    expect(waste.transporterCompanyPostalCode).toBe("44100");
    expect(waste.transporterCompanyCity).toBe("Nantes");
    expect(waste.transporterCompanyCountry).toBe("FR");
  });
});
