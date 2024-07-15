import { prisma } from "@td/prisma";
import {
  toAllWaste,
  toIncomingWaste,
  toManagedWaste,
  toOutgoingWaste,
  toTransportedWaste,
  toGenericWaste
} from "../registry";
import { bsvhuFactory } from "./factories.vhu";
import { resetDatabase } from "../../../integration-tests/helper";
import { companyFactory } from "../../__tests__/factories";

describe("toIncomingWaste", () => {
  afterAll(resetDatabase);

  it("should contain transporters info except plates", async () => {
    // Given
    const bsvhu = await bsvhuFactory({
      opt: { destinationCompanyMail: "destination@mail.com" }
    });

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id }
    });
    const waste = toIncomingWaste(bsvhuForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      bsvhuForRegistry.transporterCompanySiret
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
    const bsvhu = await bsvhuFactory({});

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id }
    });
    const waste = toIncomingWaste(bsvhuForRegistry);

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
    const bsvhu = await bsvhuFactory({
      opt: { destinationCompanyMail: "destination@mail.com" }
    });

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id }
    });
    const waste = toOutgoingWaste(bsvhuForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      bsvhuForRegistry.transporterCompanySiret
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
    const bsvhu = await bsvhuFactory({});

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id }
    });
    const waste = toOutgoingWaste(bsvhuForRegistry);

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
    const bsvhu = await bsvhuFactory({
      opt: { destinationCompanyMail: "destination@mail.com" }
    });

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id }
    });
    const waste = toManagedWaste(bsvhuForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      bsvhuForRegistry.transporterCompanySiret
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

describe("toAllWaste", () => {
  afterAll(resetDatabase);

  it("should contain transporters info except plates", async () => {
    // Given
    const bsvhu = await bsvhuFactory({
      opt: {
        destinationCompanyMail: "destination@mail.com",
        transporterTransportPlates: ["TRANSPORTER1-NBR-PLATES"]
      }
    });

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id }
    });
    const waste = toAllWaste(bsvhuForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      bsvhuForRegistry.transporterCompanySiret
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
    const bsvhu = await bsvhuFactory({});

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id }
    });
    const waste = toAllWaste(bsvhuForRegistry);

    // Then
    expect(waste.initialEmitterCompanyAddress).toBeNull();
    expect(waste.initialEmitterCompanyPostalCode).toBeNull();
    expect(waste.initialEmitterCompanyCity).toBeNull();
    expect(waste.initialEmitterCompanyCountry).toBeNull();
    expect(waste.initialEmitterCompanyName).toBeNull();
    expect(waste.initialEmitterCompanySiret).toBeNull();
  });
});

describe("toTransportedWaste", () => {
  afterAll(resetDatabase);

  it("should contain transporters info including plates", async () => {
    // Given
    const bsvhu = await bsvhuFactory({
      opt: {
        destinationCompanyMail: "destination@mail.com",
        transporterTransportPlates: ["TRANSPORTER1-NBR-PLATES"]
      }
    });

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id }
    });
    const waste = toTransportedWaste(bsvhuForRegistry);

    // Then
    expect(waste.transporterCompanySiret).toBe(
      bsvhuForRegistry.transporterCompanySiret
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

describe("toGenericWaste", () => {
  afterAll(resetDatabase);

  it("should contain destinationCompanyMail", async () => {
    // Given
    const bsvhu = await bsvhuFactory({
      opt: { destinationCompanyMail: "destination@mail.com" }
    });

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id }
    });
    const waste = toGenericWaste(bsvhuForRegistry);

    // Then
    expect(waste.destinationCompanyMail).toBe("destination@mail.com");
  });

  it("should contain destination's splitted address, name & siret", async () => {
    // Given
    const destination = await companyFactory({
      name: "Acme Inc",
      address: "4 Boulevard Pasteur 44100 Nantes"
    });
    const bsvhu = await bsvhuFactory({
      opt: {
        destinationCompanyName: destination.name,
        destinationCompanyAddress: destination.address,
        destinationCompanySiret: destination.siret
      }
    });

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id }
    });
    const waste = toGenericWaste(bsvhuForRegistry);

    // Then
    expect(waste.destinationCompanyAddress).toBe("4 Boulevard Pasteur");
    expect(waste.destinationCompanyPostalCode).toBe("44100");
    expect(waste.destinationCompanyCity).toBe("Nantes");
    expect(waste.destinationCompanyCountry).toBe("FR");

    expect(waste.destinationCompanySiret).toBe(destination.siret);
    expect(waste.destinationCompanyName).toBe(destination.name);
  });

  it("should contain emitter's splitted address, name & siret", async () => {
    // Given
    const emitter = await companyFactory({
      name: "Emitter company name",
      address: "4 Boulevard Pasteur 44100 Nantes"
    });
    const bsvhu = await bsvhuFactory({
      opt: {
        emitterCompanySiret: emitter.siret,
        emitterCompanyName: emitter.name,
        emitterCompanyAddress: emitter.address
      }
    });

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id }
    });
    const waste = toGenericWaste(bsvhuForRegistry);

    // Then
    expect(waste.emitterCompanyName).toBe(emitter.name);
    expect(waste.emitterCompanySiret).toBe(emitter.siret);
    expect(waste.emitterCompanyAddress).toBe("4 Boulevard Pasteur");
    expect(waste.emitterCompanyPostalCode).toBe("44100");
    expect(waste.emitterCompanyCity).toBe("Nantes");
    expect(waste.emitterCompanyCountry).toBe("FR");
  });
});

describe("getTransportersData", () => {
  afterAll(resetDatabase);

  it("should contain the splitted addresses of all transporters", async () => {
    // Given
    const bsvhu = await bsvhuFactory({
      opt: {
        destinationCompanyMail: "destination@mail.com",
        transporterCompanyAddress: "4 Boulevard Pasteur 44100 Nantes"
      }
    });

    // When
    const bsvhuForRegistry = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id }
    });
    const waste = toTransportedWaste(bsvhuForRegistry);

    // Then
    expect(waste.transporterCompanyAddress).toBe("4 Boulevard Pasteur");
    expect(waste.transporterCompanyPostalCode).toBe("44100");
    expect(waste.transporterCompanyCity).toBe("Nantes");
    expect(waste.transporterCompanyCountry).toBe("FR");
  });
});
