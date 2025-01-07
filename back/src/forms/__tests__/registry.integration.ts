import {
  companyFactory,
  formFactory,
  formWithTempStorageFactory,
  toIntermediaryCompany,
  userFactory,
  userWithCompanyFactory
} from "../../__tests__/factories";
import { formToBsdd } from "../compat";
import {
  getTransportersData,
  toAllWaste,
  toGenericWaste,
  toIncomingWaste,
  toManagedWaste,
  toOutgoingWaste,
  toTransportedWaste
} from "../registry";
import { prisma } from "@td/prisma";
import { RegistryFormInclude } from "../../registry/elastic";
import {
  refreshElasticSearch,
  resetDatabase
} from "../../../integration-tests/helper";
import { UserRole } from "@prisma/client";
import { indexForm, getFormForElastic } from "../elastic";

const createBsddWith5Transporters = async () => {
  const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
    companyTypes: {
      set: ["PRODUCER"]
    }
  });

  const transporter = await userWithCompanyFactory(UserRole.ADMIN, {
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

  const destination = await userWithCompanyFactory(UserRole.ADMIN, {
    companyTypes: {
      set: ["WASTEPROCESSOR"]
    }
  });

  const bsdd = await formFactory({
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
        createMany: {
          data: [
            {
              transporterCompanySiret: transporter.company.siret,
              transporterNumberPlate: "TRANSPORTER1-NBR-PLATES",
              transporterCompanyAddress: transporter.company.address,
              takenOverAt: new Date(),
              number: 1
            },
            {
              transporterCompanySiret: transporter2.company.siret,
              transporterNumberPlate: "TRANSPORTER2-NBR-PLATES",
              transporterCompanyAddress: transporter2.company.address,
              takenOverAt: new Date(),
              number: 2
            },
            {
              transporterCompanySiret: transporter3.company.siret,
              transporterNumberPlate: "TRANSPORTER3-NBR-PLATES",
              transporterCompanyAddress: transporter3.company.address,
              takenOverAt: new Date(),
              number: 3
            },
            {
              transporterCompanySiret: transporter4.company.siret,
              transporterNumberPlate: "TRANSPORTER4-NBR-PLATES",
              transporterCompanyAddress: transporter4.company.address,
              takenOverAt: new Date(),
              number: 4
            },
            {
              transporterCompanyVatNumber: transporter5.company.vatNumber,
              transporterNumberPlate: "TRANSPORTER5-NBR-PLATES",
              transporterCompanyAddress: transporter5.company.address,
              takenOverAt: new Date(),
              number: 5
            }
          ]
        }
      },
      recipientCompanySiret: destination.company.siret
    }
  });

  const formForElastic = await getFormForElastic(bsdd);
  await indexForm(formForElastic);
  await refreshElasticSearch();

  return {
    bsdd,
    transporter1: transporter.company,
    transporter2: transporter2.company,
    transporter3: transporter3.company,
    transporter4: transporter4.company,
    transporter5: transporter5.company
  };
};

describe("toGenericWaste", () => {
  afterAll(resetDatabase);

  it("should contain the destination, trader & broker email addresses", async () => {
    // Given
    const user = await userFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        brokerCompanyMail: "broker@mail.com",
        recipientCompanyMail: "destination@mail.com",
        traderCompanyMail: "trader@mail.com"
      }
    });

    // When
    const formForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: RegistryFormInclude
    });
    const waste = toGenericWaste(formToBsdd(formForRegistry));

    // Then
    expect(waste.destinationCompanyMail).toEqual("destination@mail.com");
    expect(waste.brokerCompanyMail).toEqual("broker@mail.com");
    expect(waste.traderCompanyMail).toEqual("trader@mail.com");
  });

  it("should contain destination's splitted address, name & siret", async () => {
    // Given
    const user = await userFactory();
    const destination = await companyFactory({
      name: "Acme Inc",
      address: "4 Boulevard Pasteur 44100 Nantes"
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        recipientCompanyName: destination.name,
        recipientCompanyAddress: destination.address,
        recipientCompanySiret: destination.siret
      }
    });

    // When
    const formForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: RegistryFormInclude
    });
    const waste = toGenericWaste(formToBsdd(formForRegistry));

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
    const user = await userFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        emitterWorkSiteName: "Site name",
        emitterWorkSiteAddress: "4 Boulevard Pasteur",
        emitterWorkSitePostalCode: "44100",
        emitterWorkSiteCity: "Nantes"
      }
    });

    // When
    const formForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: RegistryFormInclude
    });
    const waste = toGenericWaste(formToBsdd(formForRegistry));

    // Then
    expect(waste.emitterPickupsiteName).toBe("Site name");
    expect(waste.emitterPickupsiteAddress).toBe("4 Boulevard Pasteur");
    expect(waste.emitterPickupsitePostalCode).toBe("44100");
    expect(waste.emitterPickupsiteCity).toBe("Nantes");
    expect(waste.emitterPickupsiteCountry).toBe("FR");
  });

  it("should contain emitter's splitted address, name & siret", async () => {
    // Given
    const user = await userFactory();
    const emitter = await companyFactory({
      name: "Emitter company name",
      address: "4 Boulevard Pasteur 44100 Nantes"
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: emitter.siret,
        emitterCompanyName: emitter.name,
        emitterCompanyAddress: emitter.address
      }
    });

    // When
    const formForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: RegistryFormInclude
    });
    const waste = toGenericWaste(formToBsdd(formForRegistry));

    // Then
    expect(waste.emitterCompanyName).toBe(emitter.name);
    expect(waste.emitterCompanySiret).toBe(emitter.siret);
    expect(waste.emitterCompanyAddress).toBe("4 Boulevard Pasteur");
    expect(waste.emitterCompanyPostalCode).toBe("44100");
    expect(waste.emitterCompanyCity).toBe("Nantes");
    expect(waste.emitterCompanyCountry).toBe("FR");
  });
});

describe("toIncomingWaste", () => {
  afterAll(resetDatabase);

  it("should contain emitted weight and destinationReception weight, acceptedWeight, & refusedWeight", async () => {
    // Given
    const user = await userFactory();
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        wasteDetailsQuantity: 10.5,
        wasteAcceptationStatus: "PARTIALLY_REFUSED",
        quantityReceived: 11.7,
        quantityRefused: 8.6
      }
    });

    // When
    const formForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: bsdd.id },
      include: RegistryFormInclude
    });
    const wasteRegistry = toIncomingWaste(formToBsdd(formForRegistry));

    // Then
    expect(wasteRegistry.weight).toBe(10.5);
    expect(wasteRegistry.destinationReceptionWeight).toBe(11.7);
    expect(wasteRegistry.destinationReceptionAcceptedWeight).toBe(3.1);
    expect(wasteRegistry.destinationReceptionRefusedWeight).toBe(8.6);
  });

  it("should contain acceptedWeight = 0 in case of refusal", async () => {
    // Given
    const user = await userFactory();
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        wasteDetailsQuantity: 10.5,
        wasteAcceptationStatus: "REFUSED",
        quantityReceived: 11.7,
        quantityRefused: 11.7
      }
    });

    // When
    const formForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: bsdd.id },
      include: RegistryFormInclude
    });
    const wasteRegistry = toIncomingWaste(formToBsdd(formForRegistry));

    // Then
    expect(wasteRegistry.weight).toBe(10.5);
    expect(wasteRegistry.destinationReceptionWeight).toBe(11.7);
    expect(wasteRegistry.destinationReceptionAcceptedWeight).toBe(0);
    expect(wasteRegistry.destinationReceptionRefusedWeight).toBe(11.7);
  });

  it("should contain nextDestination operation code & notification number", async () => {
    // Given
    const user = await userFactory();
    const bdd = await formFactory({
      ownerId: user.id,
      opt: {
        nextDestinationNotificationNumber: "A7E AAAA DDDRRR",
        nextDestinationProcessingOperation: "D9"
      }
    });

    // When
    const formForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: bdd.id },
      include: RegistryFormInclude
    });
    const waste = toIncomingWaste(formToBsdd(formForRegistry));

    // Then
    expect(waste.nextDestinationNotificationNumber).toBe("A7E AAAA DDDRRR");
    expect(waste.nextDestinationProcessingOperation).toBe("D9");
  });

  it("should contain transporters info except plates", async () => {
    // Given
    const data = await createBsddWith5Transporters();

    // When
    const formForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: data.bsdd.id },
      include: RegistryFormInclude
    });
    const waste = toIncomingWaste(formToBsdd(formForRegistry));

    // Then
    expect(waste.transporterCompanySiret).toBe(data.transporter1.siret);
    expect(waste["transporterNumberPlates"]).toBeUndefined();

    expect(waste.transporter2CompanySiret).toBe(data.transporter2.siret);
    expect(waste["transporter2NumberPlates"]).toBeUndefined();

    expect(waste.transporter3CompanySiret).toBe(data.transporter3.siret);
    expect(waste["transporter3NumberPlates"]).toBeUndefined();

    expect(waste.transporter4CompanySiret).toBe(data.transporter4.siret);
    expect(waste["transporter4NumberPlates"]).toBeUndefined();

    // Foreign transporter
    expect(waste.transporter5CompanySiret).toBe(data.transporter5.vatNumber);
    expect(waste["transporter5NumberPlates"]).toBeUndefined();
  });

  it("if forwarding BSD, should contain the info of the initial emitter", async () => {
    // Given
    const user = await userFactory();
    const bsdd = await formWithTempStorageFactory({
      ownerId: user.id,
      opt: {
        emitterCompanyName: "Acme Inc.",
        emitterCompanyAddress: "4 boulevard Pasteur 44100 Nantes"
      }
    });

    // When
    const bsddSuiteForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: bsdd.forwardedInId! },
      include: RegistryFormInclude
    });
    const waste = toIncomingWaste(formToBsdd(bsddSuiteForRegistry));

    // Then
    expect(waste.initialEmitterCompanyAddress).toBe("4 boulevard Pasteur");
    expect(waste.initialEmitterCompanyPostalCode).toBe("44100");
    expect(waste.initialEmitterCompanyCity).toBe("Nantes");
    expect(waste.initialEmitterCompanyCountry).toBe("FR");
    expect(waste.initialEmitterCompanyName).toBe("Acme Inc.");
    expect(waste.initialEmitterCompanySiret).toBe(bsdd.emitterCompanySiret);
  });
});

describe("toOutgoingWaste", () => {
  afterAll(resetDatabase);

  it(
    "should compute destinationFinalOperationCodes" +
      " and destinationfinalOperationWeights",
    async () => {
      const user = await userFactory();
      const finalForm1 = await formFactory({
        ownerId: user.id,
        opt: { processingOperationDone: "R 1", quantityReceived: 1 }
      });
      const finalForm2 = await formFactory({
        ownerId: user.id,
        opt: { processingOperationDone: "R 2", quantityReceived: 2 }
      });
      const finalForm3 = await formFactory({
        ownerId: user.id,
        opt: { processingOperationDone: "D 13", quantityReceived: 3 }
      });

      const form = await formFactory({
        ownerId: user.id,
        opt: {
          processingOperationDone: "D 13",
          processedAt: new Date(),
          finalOperations: {
            createMany: {
              data: [
                {
                  finalFormId: finalForm1.id,
                  operationCode: finalForm1.processingOperationDone!,
                  noTraceability: false,
                  quantity: finalForm1.quantityReceived!
                },
                {
                  finalFormId: finalForm2.id,
                  operationCode: finalForm2.processingOperationDone!,
                  noTraceability: false,
                  quantity: finalForm2.quantityReceived!
                },
                {
                  finalFormId: finalForm3.id,
                  operationCode: finalForm3.processingOperationDone!,
                  noTraceability: true,
                  quantity: finalForm3.quantityReceived!
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
        finalForm1.processingOperationDone,
        finalForm2.processingOperationDone,
        finalForm3.processingOperationDone
      ]);
      expect(waste.destinationFinalOperationWeights).toStrictEqual([
        finalForm1.quantityReceived?.toNumber(),
        finalForm2.quantityReceived?.toNumber(),
        finalForm3.quantityReceived?.toNumber()
      ]);
      expect(waste.destinationFinalOperationCompanySirets).toStrictEqual([
        finalForm1.recipientCompanySiret,
        finalForm2.recipientCompanySiret,
        finalForm3.recipientCompanySiret
      ]);
    }
  );

  test(
    "destinationFinalOperationCodes and destinationfinalOperationWeights should be empty" +
      " when bsdd has a final operation",
    async () => {
      const user = await userFactory();
      const form = await formFactory({
        ownerId: user.id,
        opt: {
          processingOperationDone: "R 1",
          processedAt: new Date(),
          quantityReceived: 1
        }
      });
      await prisma.form.update({
        where: { id: form.id },
        data: {
          finalOperations: {
            createMany: {
              data: [
                {
                  finalFormId: form.id,
                  operationCode: form.recipientProcessingOperation!,
                  noTraceability: false,
                  quantity: form.quantityReceived!
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
      expect(waste.destinationFinalOperationCodes).toStrictEqual([]);
      expect(waste.destinationFinalOperationWeights).toStrictEqual([]);
      expect(waste.destinationFinalOperationCompanySirets).toStrictEqual([]);
    }
  );

  it("bsd with forwarding BSD should mention post-temp-storage destination", async () => {
    // Given
    const user = await userFactory();
    const emitter = await companyFactory({ name: "Emitter" });
    const recipient = await companyFactory({ name: "Recipient" });
    const nextDestination = await companyFactory({ name: "Next destination" });
    const forwardedInNextDestination = await companyFactory({
      name: "ForwardedIn next destination",
      address: "25 rue Voltaire 37100 TOURS"
    });
    const form = await formWithTempStorageFactory({
      opt: {
        emitterCompanyName: emitter.name,
        emitterCompanySiret: emitter.siret,
        recipientCompanyName: recipient.name,
        recipientCompanySiret: recipient.siret,
        nextDestinationCompanyName: nextDestination.name,
        nextDestinationCompanySiret: nextDestination.siret
      },
      ownerId: user.id,
      forwardedInOpts: {
        recipientCompanyName: forwardedInNextDestination.name,
        recipientCompanySiret: forwardedInNextDestination.siret,
        recipientCompanyAddress: forwardedInNextDestination.address
      }
    });

    // When
    const formForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: RegistryFormInclude
    });

    const formToBsdd_ = await formToBsdd(formForRegistry);
    const waste = toOutgoingWaste(formToBsdd_);

    // Then
    expect(waste.postTempStorageDestinationSiret).toBe(
      forwardedInNextDestination.siret
    );
    expect(waste.postTempStorageDestinationName).toBe(
      "ForwardedIn next destination"
    );

    // Address
    expect(waste.postTempStorageDestinationAddress).toBe("25 rue Voltaire");
    expect(waste.postTempStorageDestinationCity).toBe("TOURS");
    expect(waste.postTempStorageDestinationPostalCode).toBe("37100");
    expect(waste.postTempStorageDestinationCountry).toBe("FR");
  });

  it("should contain emitted weight and destinationReception weight, acceptedWeight, & refusedWeight", async () => {
    // Given
    const user = await userFactory();
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        wasteDetailsQuantity: 10.5,
        wasteAcceptationStatus: "PARTIALLY_REFUSED",
        quantityReceived: 11.7,
        quantityRefused: 8.6
      }
    });

    // When
    const formForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: bsdd.id },
      include: RegistryFormInclude
    });
    const wasteRegistry = toOutgoingWaste(formToBsdd(formForRegistry));

    // Then
    expect(wasteRegistry.weight).toBe(10.5);
    expect(wasteRegistry.destinationReceptionWeight).toBe(11.7);
    expect(wasteRegistry.destinationReceptionAcceptedWeight).toBe(3.1);
    expect(wasteRegistry.destinationReceptionRefusedWeight).toBe(8.6);
  });

  it("should contain nextDestination operation code & notification number", async () => {
    // Given
    const user = await userFactory();
    const bdd = await formFactory({
      ownerId: user.id,
      opt: {
        nextDestinationNotificationNumber: "A7E AAAA DDDRRR",
        nextDestinationProcessingOperation: "D9"
      }
    });

    // When
    const formForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: bdd.id },
      include: RegistryFormInclude
    });
    const waste = toOutgoingWaste(formToBsdd(formForRegistry));

    // Then
    expect(waste.nextDestinationNotificationNumber).toBe("A7E AAAA DDDRRR");
    expect(waste.nextDestinationProcessingOperation).toBe("D9");
  });

  it("should contain transporters info except plates", async () => {
    // Given
    const data = await createBsddWith5Transporters();

    // When
    const formForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: data.bsdd.id },
      include: RegistryFormInclude
    });
    const waste = toOutgoingWaste(formToBsdd(formForRegistry));

    // Then
    expect(waste.transporterCompanySiret).toBe(data.transporter1.siret);
    expect(waste["transporterNumberPlates"]).toBeUndefined();

    expect(waste.transporter2CompanySiret).toBe(data.transporter2.siret);
    expect(waste["transporter2NumberPlates"]).toBeUndefined();

    expect(waste.transporter3CompanySiret).toBe(data.transporter3.siret);
    expect(waste["transporter3NumberPlates"]).toBeUndefined();

    expect(waste.transporter4CompanySiret).toBe(data.transporter4.siret);
    expect(waste["transporter4NumberPlates"]).toBeUndefined();

    // Foreign transporter
    expect(waste.transporter5CompanySiret).toBe(data.transporter5.vatNumber);
    expect(waste["transporter5NumberPlates"]).toBeUndefined();
  });

  it("if forwarding BSD, should contain the info of the initial emitter", async () => {
    // Given
    const user = await userFactory();
    const bsdd = await formWithTempStorageFactory({
      ownerId: user.id,
      opt: {
        emitterCompanyName: "Acme Inc.",
        emitterCompanyAddress: "4 boulevard Pasteur 44100 Nantes"
      }
    });

    // When
    const bsddSuiteForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: bsdd.forwardedInId! },
      include: RegistryFormInclude
    });
    const waste = toOutgoingWaste(formToBsdd(bsddSuiteForRegistry));

    // Then
    expect(waste.initialEmitterCompanyAddress).toBe("4 boulevard Pasteur");
    expect(waste.initialEmitterCompanyPostalCode).toBe("44100");
    expect(waste.initialEmitterCompanyCity).toBe("Nantes");
    expect(waste.initialEmitterCompanyCountry).toBe("FR");
    expect(waste.initialEmitterCompanyName).toBe("Acme Inc.");
    expect(waste.initialEmitterCompanySiret).toBe(bsdd.emitterCompanySiret);
  });
});

describe("toTransportedWaste", () => {
  afterAll(resetDatabase);

  it("should contain emitted weight and destinationReception weight", async () => {
    // Given
    const user = await userFactory();
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        wasteDetailsQuantity: 10.5,
        wasteAcceptationStatus: "PARTIALLY_REFUSED",
        quantityReceived: 11.7,
        quantityRefused: 8.6
      }
    });

    // When
    const formForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: bsdd.id },
      include: RegistryFormInclude
    });
    const wasteRegistry = toTransportedWaste(formToBsdd(formForRegistry));

    // Then
    expect(wasteRegistry.weight).toBe(10.5);
    expect(wasteRegistry.destinationReceptionWeight).toBe(11.7);
  });

  it("should contain transporters info including plates", async () => {
    // Given
    const data = await createBsddWith5Transporters();

    // When
    const formForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: data.bsdd.id },
      include: RegistryFormInclude
    });
    const waste = toTransportedWaste(formToBsdd(formForRegistry));

    // Then
    expect(waste.transporterCompanySiret).toBe(data.transporter1.siret);
    expect(waste.transporterNumberPlates).toStrictEqual([
      "TRANSPORTER1-NBR-PLATES"
    ]);

    expect(waste.transporter2CompanySiret).toBe(data.transporter2.siret);
    expect(waste.transporter2NumberPlates).toStrictEqual([
      "TRANSPORTER2-NBR-PLATES"
    ]);

    expect(waste.transporter3CompanySiret).toBe(data.transporter3.siret);
    expect(waste.transporter3NumberPlates).toStrictEqual([
      "TRANSPORTER3-NBR-PLATES"
    ]);

    expect(waste.transporter4CompanySiret).toBe(data.transporter4.siret);
    expect(waste.transporter4NumberPlates).toStrictEqual([
      "TRANSPORTER4-NBR-PLATES"
    ]);

    expect(waste.transporter5CompanySiret).toBe(data.transporter5.vatNumber);
    expect(waste.transporter5NumberPlates).toStrictEqual([
      "TRANSPORTER5-NBR-PLATES"
    ]);
  });
});

describe("toManagedWaste", () => {
  afterAll(resetDatabase);

  it("should contain emitted weight and destinationReception weight, acceptedWeight, & refusedWeight", async () => {
    // Given
    const user = await userFactory();
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        wasteDetailsQuantity: 10.5,
        wasteAcceptationStatus: "PARTIALLY_REFUSED",
        quantityReceived: 11.7,
        quantityRefused: 8.6
      }
    });

    // When
    const formForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: bsdd.id },
      include: RegistryFormInclude
    });
    const wasteRegistry = toManagedWaste(formToBsdd(formForRegistry));

    // Then
    expect(wasteRegistry.weight).toBe(10.5);
    expect(wasteRegistry.destinationReceptionWeight).toBe(11.7);
    expect(wasteRegistry.destinationReceptionAcceptedWeight).toBe(3.1);
    expect(wasteRegistry.destinationReceptionRefusedWeight).toBe(8.6);
  });

  it("should contain nextDestination operation code & notification number", async () => {
    // Given
    const user = await userFactory();
    const bdd = await formFactory({
      ownerId: user.id,
      opt: {
        nextDestinationNotificationNumber: "A7E AAAA DDDRRR",
        nextDestinationProcessingOperation: "D9"
      }
    });

    // When
    const formForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: bdd.id },
      include: RegistryFormInclude
    });
    const waste = toManagedWaste(formToBsdd(formForRegistry));

    // Then
    expect(waste.nextDestinationNotificationNumber).toBe("A7E AAAA DDDRRR");
    expect(waste.nextDestinationProcessingOperation).toBe("D9");
  });

  it("should contain transporters info except plates", async () => {
    // Given
    const data = await createBsddWith5Transporters();

    // When
    const formForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: data.bsdd.id },
      include: RegistryFormInclude
    });
    const waste = toManagedWaste(formToBsdd(formForRegistry));

    // Then
    expect(waste.transporterCompanySiret).toBe(data.transporter1.siret);
    expect(waste["transporterNumberPlates"]).toBeUndefined();

    expect(waste.transporter2CompanySiret).toBe(data.transporter2.siret);
    expect(waste["transporter2NumberPlates"]).toBeUndefined();

    expect(waste.transporter3CompanySiret).toBe(data.transporter3.siret);
    expect(waste["transporter3NumberPlates"]).toBeUndefined();

    expect(waste.transporter4CompanySiret).toBe(data.transporter4.siret);
    expect(waste["transporter4NumberPlates"]).toBeUndefined();

    // Foreign transporter
    expect(waste.transporter5CompanySiret).toBe(data.transporter5.vatNumber);
    expect(waste["transporter5NumberPlates"]).toBeUndefined();
  });
});

describe("toAllWaste", () => {
  afterAll(resetDatabase);

  it(
    "should compute destinationFinalOperationCodes" +
      " and destinationfinalOperationWeights",
    async () => {
      const user = await userFactory();

      const finalForm1 = await formFactory({
        ownerId: user.id,
        opt: { processingOperationDone: "R 1", quantityReceived: 1 }
      });
      const finalForm2 = await formFactory({
        ownerId: user.id,
        opt: { processingOperationDone: "R 2", quantityReceived: 2 }
      });
      const finalForm3 = await formFactory({
        ownerId: user.id,
        opt: { processingOperationDone: "D 13", quantityReceived: 3 }
      });

      const form = await formFactory({
        ownerId: user.id,
        opt: {
          processingOperationDone: "D 13",
          processedAt: new Date(),
          finalOperations: {
            createMany: {
              data: [
                {
                  finalFormId: finalForm1.id,
                  operationCode: finalForm1.processingOperationDone!,
                  noTraceability: false,
                  quantity: finalForm1.quantityReceived!
                },
                {
                  finalFormId: finalForm2.id,
                  operationCode: finalForm2.processingOperationDone!,
                  noTraceability: false,
                  quantity: finalForm2.quantityReceived!
                },
                {
                  finalFormId: finalForm3.id,
                  operationCode: finalForm3.processingOperationDone!,
                  noTraceability: true,
                  quantity: finalForm3.quantityReceived!
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
        finalForm1.processingOperationDone,
        finalForm2.processingOperationDone,
        finalForm3.processingOperationDone
      ]);
      expect(waste.destinationFinalOperationWeights).toStrictEqual([
        finalForm1.quantityReceived?.toNumber(),
        finalForm2.quantityReceived?.toNumber(),
        finalForm3.quantityReceived?.toNumber()
      ]);
      expect(waste.destinationFinalOperationCompanySirets).toStrictEqual([
        finalForm1.recipientCompanySiret,
        finalForm2.recipientCompanySiret,
        finalForm3.recipientCompanySiret
      ]);
    }
  );

  test(
    "destinationFinalOperationCodes and destinationfinalOperationWeights should be empty" +
      " when bsdd has a final operation",
    async () => {
      const user = await userFactory();
      const form = await formFactory({
        ownerId: user.id,
        opt: {
          processingOperationDone: "R 1",
          processedAt: new Date(),
          quantityReceived: 1
        }
      });
      await prisma.form.update({
        where: { id: form.id },
        data: {
          finalOperations: {
            createMany: {
              data: [
                {
                  finalFormId: form.id,
                  operationCode: form.recipientProcessingOperation!,
                  noTraceability: false,
                  quantity: form.quantityReceived!
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
      expect(waste.destinationFinalOperationCodes).toStrictEqual([]);
      expect(waste.destinationFinalOperationWeights).toStrictEqual([]);
      expect(waste.destinationFinalOperationCompanySirets).toStrictEqual([]);
    }
  );

  test(
    "destinationFinalOperationCodes and destinationfinalOperationWeights" +
      " should not be empty in case of temporary storage",
    async () => {
      const user = await userFactory();

      const bsdSuite = await formFactory({
        ownerId: user.id,
        opt: { processingOperationDone: "R 1", quantityReceived: 1 }
      });

      const form = await formFactory({
        ownerId: user.id,
        opt: {
          recipientIsTempStorage: true,
          forwardedIn: { connect: { id: bsdSuite.id } },
          // ces deux champs sont nulls en cas d'entreposage provisioire
          processingOperationDone: null,
          processedAt: null,
          finalOperations: {
            createMany: {
              data: [
                {
                  finalFormId: bsdSuite.id,
                  operationCode: bsdSuite.processingOperationDone!,
                  noTraceability: false,
                  quantity: bsdSuite.quantityReceived!
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
        bsdSuite.processingOperationDone
      ]);
      expect(waste.destinationFinalOperationWeights).toStrictEqual([
        bsdSuite.quantityReceived?.toNumber()
      ]);
    }
  );

  it("bsd with forwarding BSD should mention post-temp-storage destination", async () => {
    // Given
    const user = await userFactory();
    const emitter = await companyFactory({ name: "Emitter" });
    const recipient = await companyFactory({ name: "Recipient" });
    const nextDestination = await companyFactory({ name: "Next destination" });
    const forwardedInNextDestination = await companyFactory({
      name: "ForwardedIn next destination",
      address: "25 rue Voltaire 37100 TOURS"
    });
    const form = await formWithTempStorageFactory({
      opt: {
        emitterCompanyName: emitter.name,
        emitterCompanySiret: emitter.siret,
        recipientCompanyName: recipient.name,
        recipientCompanySiret: recipient.siret,
        nextDestinationCompanyName: nextDestination.name,
        nextDestinationCompanySiret: nextDestination.siret
      },
      ownerId: user.id,
      forwardedInOpts: {
        recipientCompanyName: forwardedInNextDestination.name,
        recipientCompanySiret: forwardedInNextDestination.siret,
        recipientCompanyAddress: forwardedInNextDestination.address
      }
    });

    // When
    const formForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: RegistryFormInclude
    });

    const formToBsdd_ = await formToBsdd(formForRegistry);
    const waste = toAllWaste(formToBsdd_);

    // Then
    expect(waste.postTempStorageDestinationSiret).toBe(
      forwardedInNextDestination.siret
    );
    expect(waste.postTempStorageDestinationName).toBe(
      "ForwardedIn next destination"
    );

    // Address
    expect(waste.postTempStorageDestinationAddress).toBe("25 rue Voltaire");
    expect(waste.postTempStorageDestinationCity).toBe("TOURS");
    expect(waste.postTempStorageDestinationPostalCode).toBe("37100");
    expect(waste.postTempStorageDestinationCountry).toBe("FR");
  });

  it("should contain emitted weight and destinationReception weight, acceptedWeight, & refusedWeight", async () => {
    // Given
    const user = await userFactory();
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        wasteDetailsQuantity: 10.5,
        wasteAcceptationStatus: "PARTIALLY_REFUSED",
        quantityReceived: 11.7,
        quantityRefused: 8.6
      }
    });

    // When
    const formForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: bsdd.id },
      include: RegistryFormInclude
    });
    const wasteRegistry = toAllWaste(formToBsdd(formForRegistry));

    // Then
    expect(wasteRegistry.weight).toBe(10.5);
    expect(wasteRegistry.destinationReceptionWeight).toBe(11.7);
    expect(wasteRegistry.destinationReceptionAcceptedWeight).toBe(3.1);
    expect(wasteRegistry.destinationReceptionRefusedWeight).toBe(8.6);
  });

  it("should contain nextDestination operation code & notification number", async () => {
    // Given
    const user = await userFactory();
    const bdd = await formFactory({
      ownerId: user.id,
      opt: {
        nextDestinationNotificationNumber: "A7E AAAA DDDRRR",
        nextDestinationProcessingOperation: "D9"
      }
    });

    // When
    const formForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: bdd.id },
      include: RegistryFormInclude
    });
    const waste = toAllWaste(formToBsdd(formForRegistry));

    // Then
    expect(waste.nextDestinationNotificationNumber).toBe("A7E AAAA DDDRRR");
    expect(waste.nextDestinationProcessingOperation).toBe("D9");
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
    expect(waste.intermediary1CompanyName).toBe(null);
    expect(waste.intermediary1CompanySiret).toBe(null);
    expect(waste.intermediary2CompanyName).toBe(null);
    expect(waste.intermediary2CompanySiret).toBe(null);
    expect(waste.intermediary3CompanyName).toBe(null);
    expect(waste.intermediary3CompanySiret).toBe(null);
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

  it("should contain transporters info including plates", async () => {
    // Given
    const data = await createBsddWith5Transporters();

    // When
    const formForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: data.bsdd.id },
      include: RegistryFormInclude
    });
    const waste = toAllWaste(formToBsdd(formForRegistry));

    // Then
    expect(waste.transporterCompanySiret).toBe(data.transporter1.siret);
    expect(waste.transporterNumberPlates).toStrictEqual([
      "TRANSPORTER1-NBR-PLATES"
    ]);

    expect(waste.transporter2CompanySiret).toBe(data.transporter2.siret);
    expect(waste.transporter2NumberPlates).toStrictEqual([
      "TRANSPORTER2-NBR-PLATES"
    ]);

    expect(waste.transporter3CompanySiret).toBe(data.transporter3.siret);
    expect(waste.transporter3NumberPlates).toStrictEqual([
      "TRANSPORTER3-NBR-PLATES"
    ]);

    expect(waste.transporter4CompanySiret).toBe(data.transporter4.siret);
    expect(waste.transporter4NumberPlates).toStrictEqual([
      "TRANSPORTER4-NBR-PLATES"
    ]);

    // Foreign transporter
    expect(waste.transporter5CompanySiret).toBe(data.transporter5.vatNumber);
    expect(waste.transporter5NumberPlates).toStrictEqual([
      "TRANSPORTER5-NBR-PLATES"
    ]);
  });

  it("if forwarding BSD, should contain the info of the initial emitter", async () => {
    // Given
    const user = await userFactory();
    const bsdd = await formWithTempStorageFactory({
      ownerId: user.id,
      opt: {
        emitterCompanyName: "Acme Inc.",
        emitterCompanyAddress: "4 boulevard Pasteur 44100 Nantes"
      }
    });

    // When
    const bsddSuiteForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: bsdd.forwardedInId! },
      include: RegistryFormInclude
    });
    const waste = toAllWaste(formToBsdd(bsddSuiteForRegistry));

    // Then
    expect(waste.initialEmitterCompanyAddress).toBe("4 boulevard Pasteur");
    expect(waste.initialEmitterCompanyPostalCode).toBe("44100");
    expect(waste.initialEmitterCompanyCity).toBe("Nantes");
    expect(waste.initialEmitterCompanyCountry).toBe("FR");
    expect(waste.initialEmitterCompanyName).toBe("Acme Inc.");
    expect(waste.initialEmitterCompanySiret).toBe(bsdd.emitterCompanySiret);
  });
});

describe("getTransportersData", () => {
  afterAll(resetDatabase);

  it("should contain the splitted addresses of all transporters", async () => {
    // Given
    const data = await createBsddWith5Transporters();

    // When
    const formForRegistry = await prisma.form.findUniqueOrThrow({
      where: { id: data.bsdd.id },
      include: RegistryFormInclude
    });
    const waste = getTransportersData(formToBsdd(formForRegistry));

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
