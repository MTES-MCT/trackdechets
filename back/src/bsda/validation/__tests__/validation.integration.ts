import { Bsda, BsdaType, UserRole } from "@prisma/client";
import { resetDatabase } from "../../../../integration-tests/helper";
import {
  companyFactory,
  userWithCompanyFactory
} from "../../../__tests__/factories";

import { bsdaFactory } from "../../__tests__/factories";
import { rawBsdaSchema } from "../schema";
import { parseBsdaInContext } from "../index";
import prisma from "../../../prisma";

describe("BSDA validation", () => {
  let bsda: Bsda;

  beforeEach(async () => {
    bsda = await bsdaFactory({});
  });

  afterEach(resetDatabase);

  describe("BSDA should be valid - transitory empty strings", () => {
    test("when type is COLLECTION_2710 and unused company fields are nulls", async () => {
      // on COLLECTION_2710 Bsdas worker and trasporter fields are not used
      const { success } = await rawBsdaSchema.safeParseAsync({
        ...bsda,
        type: BsdaType.COLLECTION_2710,
        transporterCompanySiret: null,
        transporterCompanyName: null,
        workerCompanyName: null,
        workerCompanySiret: null
      });

      expect(success).toEqual(true);
    });
  });

  describe("BSDA should be valid", () => {
    test("when all data is present", async () => {
      const { success } = await rawBsdaSchema.safeParseAsync(bsda);
      expect(success).toBe(true);
    });

    test("when there is a foreign transporter and recepisse fields are null", async () => {
      const foreignTransporter = await companyFactory({
        orgId: "BE0541696005",
        vatNumber: "BE0541696005"
      });
      const { success } = await rawBsdaSchema.safeParseAsync({
        ...bsda,
        transporterCompanyVatNumber: foreignTransporter.vatNumber,
        transporterCompanyName: "transporteur BE",
        transporterRecepisseDepartment: null,
        transporterRecepisseNumber: null,
        transporterRecepisseIsExempted: null
      });
      expect(success).toEqual(true);
    });

    test("when a foreign transporter vat number is specified and transporter siret is null", async () => {
      const foreignTransporter = await companyFactory({
        orgId: "BE0541696005",
        vatNumber: "BE0541696005"
      });
      const data = {
        ...bsda,
        transporterCompanySiret: null,
        transporterCompanyVatNumber: foreignTransporter.vatNumber
      };

      const { success } = await rawBsdaSchema.safeParseAsync(data);
      expect(success).toBe(true);
    });

    it("transporter recepisse is not required if transport mode is not ROAD", async () => {
      const data = {
        ...bsda,
        transporterRecepisseNumber: null,
        transporterRecepisseDepartment: null,
        transporterRecepisseValidityLimit: null,
        transporterTransportMode: "AIR"
      };

      await parseBsdaInContext(
        { persisted: data as any },
        {
          currentSignatureType: "TRANSPORT"
        }
      );
    });

    it("transporter plate is not required if transport mode is not ROAD", async () => {
      const data = {
        ...bsda,
        transporterTransportMode: "AIR"
      };

      await parseBsdaInContext(
        { persisted: data as any },
        {
          currentSignatureType: "TRANSPORT"
        }
      );
    });

    it("should work if transport mode is ROAD & plates are defined", async () => {
      const data = {
        ...bsda,
        transporterTransportMode: "ROAD",
        transporterTransportPlates: ["TRANSPORTER-PLATES"]
      };

      const res = await parseBsdaInContext(
        { persisted: data as any },
        {
          currentSignatureType: "TRANSPORT"
        }
      );
      expect(res).toBeTruthy();
    });
  });

  describe("BSDA should not be valid", () => {
    afterEach(resetDatabase);

    test("when type is COLLECTION_2710 and unused company fields are empty strings", async () => {
      // on COLLECTION_2710 Bsdas worker and trasporter fields are not used
      const { success } = await rawBsdaSchema.safeParseAsync({
        ...bsda,
        type: BsdaType.COLLECTION_2710,
        transporterCompanySiret: "",
        transporterCompanyName: "",
        workerCompanyName: "",
        workerCompanySiret: ""
      });

      expect(success).toEqual(false);
    });

    test("when emitter siret is not valid", async () => {
      const data = {
        ...bsda,
        emitterCompanySiret: "1"
      };
      const result = await rawBsdaSchema.safeParseAsync(data);

      if (result.success) {
        throw new Error("Expected error.");
      }

      expect(result.error.issues[0].message).toBe(
        "1 n'est pas un numéro de SIRET valide"
      );
    });

    test("when transporter siret is not valid", async () => {
      const data = {
        ...bsda,
        transporterCompanySiret: "1"
      };
      const result = await rawBsdaSchema.safeParseAsync(data);

      if (result.success) {
        throw new Error("Expected error.");
      }

      expect(result.error.issues[0].message).toBe(
        "1 n'est pas un numéro de SIRET valide"
      );
    });

    test("when transporter VAT number is FR", async () => {
      const data = {
        ...bsda,
        transporterCompanyVatNumber: "FR35552049447"
      };
      const result = await rawBsdaSchema.safeParseAsync(data);

      if (result.success) {
        throw new Error("Expected error.");
      }

      expect(result.error.issues[0].message).toBe(
        "Impossible d'utiliser le numéro de TVA pour un établissement français, veuillez renseigner son SIRET uniquement"
      );
    });

    test("when transporter is not registered in Trackdéchets", async () => {
      const data = {
        ...bsda,
        transporterCompanySiret: "85001946400021"
      };

      expect.assertions(1);
      try {
        await parseBsdaInContext({ persisted: data as any }, {});
      } catch (error) {
        expect(error.issues).toEqual([
          expect.objectContaining({
            message:
              "L'établissement avec le SIRET 85001946400021 n'est pas inscrit sur Trackdéchets"
          })
        ]);
      }
    });

    test("when transporter is registered with wrong profile", async () => {
      const company = await companyFactory({ companyTypes: ["PRODUCER"] });
      const data = {
        ...bsda,
        transporterCompanySiret: company.siret
      };

      expect.assertions(1);
      try {
        await parseBsdaInContext({ persisted: data as any }, {});
      } catch (error) {
        expect(error.issues).toEqual([
          expect.objectContaining({
            message:
              `Le transporteur saisi sur le bordereau (SIRET: ${company.siret}) n'est pas inscrit sur Trackdéchets en tant qu'entreprise de transport.` +
              " Cette entreprise ne peut donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette entreprise pour" +
              " qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements"
          })
        ]);
      }
    });

    test("when foreign transporter is not registered in Trackdéchets", async () => {
      const data = {
        ...bsda,
        trasnporterCompanySiret: null,
        transporterCompanyVatNumber: "IT13029381004"
      };
      const result = await rawBsdaSchema.safeParseAsync(data);

      if (result.success) {
        throw new Error("Expected error.");
      }

      expect(result.error.issues[0].message).toBe(
        "Le transporteur avec le n°de TVA IT13029381004 n'est pas inscrit sur Trackdéchets"
      );
    });

    test("when foreign transporter is registered with wrong profile", async () => {
      const company = await companyFactory({
        companyTypes: ["PRODUCER"],
        orgId: "IT13029381004",
        vatNumber: "IT13029381004"
      });
      const data = {
        ...bsda,
        transporterCompanyVatNumber: company.vatNumber
      };
      const result = await rawBsdaSchema.safeParseAsync(data);

      if (result.success) {
        throw new Error("Expected error.");
      }

      expect(result.error.issues[0].message).toBe(
        `Le transporteur saisi sur le bordereau (numéro de TVA: ${company.vatNumber}) n'est pas inscrit sur Trackdéchets en tant qu'entreprise de transport.` +
          " Cette entreprise ne peut donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette entreprise pour" +
          " qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements"
      );
    });

    test("when destination siret is not valid", async () => {
      const data = {
        ...bsda,
        destinationCompanySiret: "1"
      };
      const result = await rawBsdaSchema.safeParseAsync(data);

      if (result.success) {
        throw new Error("Expected error.");
      }

      expect(result.error.issues[0].message).toBe(
        "1 n'est pas un numéro de SIRET valide"
      );
    });

    test("when destination is not registered in Trackdéchets", async () => {
      const data = {
        ...bsda,
        destinationCompanySiret: "85001946400021"
      };
      const result = await rawBsdaSchema.safeParseAsync(data);
      if (result.success) {
        throw new Error("Expected error.");
      }

      expect(result.error.issues[0].message).toBe(
        "L'établissement avec le SIRET 85001946400021 n'est pas inscrit sur Trackdéchets"
      );
    });

    test("when destination is registered with wrong profile", async () => {
      const company = await companyFactory({ companyTypes: ["PRODUCER"] });
      const data = {
        ...bsda,
        destinationCompanySiret: company.siret
      };
      const result = await rawBsdaSchema.safeParseAsync(data);
      if (result.success) {
        throw new Error("Expected error.");
      }

      expect(result.error.issues[0].message).toBe(
        `L'installation de destination ou d’entreposage ou de reconditionnement avec le SIRET \"${company.siret}\" n'est pas inscrite` +
          " sur Trackdéchets en tant qu'installation de traitement ou de tri transit regroupement. Cette installation ne peut donc" +
          " pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette installation pour qu'il" +
          " modifie le profil de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements"
      );
    });

    test("when there is a french transporter and recepisse fields are null", async () => {
      expect.assertions(1);
      const transporterCompany = await companyFactory({
        companyTypes: ["TRANSPORTER"]
      });
      const data = {
        ...bsda,
        type: BsdaType.OTHER_COLLECTIONS,
        transporterCompanySiret: transporterCompany.siret,
        transporterCompanyVatNumber: null,
        transporterRecepisseIsExempted: false,
        transporterRecepisseNumber: null,
        transporterRecepisseDepartment: null
      };

      try {
        await parseBsdaInContext(
          { persisted: data as any },
          {
            currentSignatureType: "TRANSPORT"
          }
        );
      } catch (error) {
        expect(error.issues).toEqual([
          expect.objectContaining({
            message:
              "Transporteur: le numéro de récépissé est obligatoire. L'établissement doit renseigner son récépissé dans Trackdéchets"
          }),
          expect.objectContaining({
            message:
              "Transporteur: le département de récépissé est obligatoire. L'établissement doit renseigner son récépissé dans Trackdéchets"
          })
        ]);
      }
    });

    it("transporter plate is required if transporter mode is ROAD", async () => {
      const data = {
        ...bsda,
        transporterTransportMode: "ROAD",
        transporterTransportPlates: undefined
      };
      expect.assertions(1);

      try {
        await parseBsdaInContext(
          { persisted: data as any },
          { currentSignatureType: "TRANSPORT" }
        );
      } catch (error) {
        expect(error.issues).toEqual([
          expect.objectContaining({
            message: "La plaque d'immatriculation est requise"
          })
        ]);
      }
    });

    it.each(["", null, [], [""], [null], [undefined]])(
      "transporter plate is required if transporter mode is ROAD - invalid values",
      async invalidValue => {
        const data = {
          ...bsda,
          transporterTransportMode: "ROAD",
          transporterTransportPlates: invalidValue
        };
        expect.assertions(1);

        try {
          await parseBsdaInContext(
            { input: data as any },
            { currentSignatureType: "TRANSPORT" }
          );
        } catch (err) {
          expect(err.errors.length).toBeTruthy();
        }
      }
    );
  });

  describe("Emitter transports own waste", () => {
    it("allowed if exemption", async () => {
      const emitterAndTransporter = await companyFactory({
        companyTypes: ["PRODUCER"]
      });

      const data = {
        ...bsda,
        emittedCompanySiret: emitterAndTransporter.siret,
        transporterCompanySiret: emitterAndTransporter.siret,
        transporterRecepisseIsExempted: true
      };

      expect.assertions(1);

      const result = await parseBsdaInContext(
        { persisted: data as any },
        {
          currentSignatureType: "TRANSPORT"
        }
      );

      expect(result).toBeTruthy();
    });

    it("NOT allowed if no exemption", async () => {
      const emitterAndTransporter = await companyFactory({
        companyTypes: ["PRODUCER"]
      });

      const data = {
        ...bsda,
        emittedCompanySiret: emitterAndTransporter.siret,
        transporterCompanySiret: emitterAndTransporter.siret,
        transporterRecepisseIsExempted: false
      };

      expect.assertions(1);

      try {
        await parseBsdaInContext(
          { persisted: data as any },
          {
            currentSignatureType: "TRANSPORT"
          }
        );
      } catch (error) {
        expect(error.issues[0].message).toBe(
          `Le transporteur saisi sur le bordereau (SIRET: ${emitterAndTransporter.siret}) n'est pas inscrit sur Trackdéchets en tant qu'entreprise de transport.` +
            " Cette entreprise ne peut donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette entreprise pour" +
            " qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements"
        );
      }
    });
  });

  describe("Operation modes", () => {
    test.each([
      ["R 5", "REUTILISATION"],
      ["R 13", undefined]
    ])(
      "should work if operation code & mode are compatible (code: %p, mode: %p)",
      async (code, mode) => {
        const data = {
          ...bsda,
          destinationOperationCode: code,
          destinationOperationMode: mode
        };

        const res = await parseBsdaInContext(
          { persisted: data as any },
          {
            currentSignatureType: "EMISSION"
          }
        );
        expect(res).not.toBeUndefined();
      }
    );

    test.each([
      ["R 5", "REUTILISATION"],
      ["R 13", undefined]
    ])(
      "should work if operation code & mode are compatible (code: %p, mode: %p)",
      async (code, mode) => {
        const data = {
          ...bsda,
          destinationOperationCode: code,
          destinationOperationMode: mode
        };

        const res = await parseBsdaInContext(
          { persisted: data as any },
          {
            currentSignatureType: "TRANSPORT"
          }
        );
        expect(res).not.toBeUndefined();
      }
    );

    test.each([
      ["R 5", "VALORISATION_ENERGETIQUE"], // Correct modes are REUTILISATION or RECYCLAGE
      ["R 13", "VALORISATION_ENERGETIQUE"] // R 13 has no associated mode
    ])(
      "should fail if operation mode is not compatible with operation code (code: %p, mode: %p)",
      async (code, mode) => {
        const data = {
          ...bsda,
          destinationOperationCode: code,
          destinationOperationMode: mode
        };

        expect.assertions(2);

        try {
          await parseBsdaInContext(
            { persisted: data as any },
            { currentSignatureType: "OPERATION" }
          );
        } catch (err) {
          expect(err.errors.length).toBeTruthy();
          expect(err.errors[0].message).toBe(
            "Le mode de traitement n'est pas compatible avec l'opération de traitement choisie"
          );
        }
      }
    );

    test("should not fail if operation code has associated operation modes but none is specified", async () => {
      const data = {
        ...bsda,
        destinationOperationCode: "R 5",
        destinationOperationMode: undefined
      };

      expect.assertions(1);

      const res = await parseBsdaInContext(
        { persisted: data as any },
        { currentSignatureType: "EMISSION" }
      );
      expect(res).not.toBeUndefined();
    });

    test("should fail if operation code has associated operation modes but none is specified", async () => {
      const data = {
        ...bsda,
        destinationOperationCode: "R 5",
        destinationOperationMode: undefined
      };

      expect.assertions(2);

      try {
        await parseBsdaInContext(
          { persisted: data as any },
          { currentSignatureType: "OPERATION" }
        );
      } catch (err) {
        expect(err.errors.length).toBeTruthy();
        expect(err.errors[0].message).toBe(
          "Le mode de traitement est obligatoire."
        );
      }
    });
  });
});

describe("BSDA Sealed rules checks", () => {
  afterAll(resetDatabase);

  it("should be possible to update any fields when bsda status is INITIAL", async () => {
    const bsda = await bsdaFactory({
      opt: {
        status: "INITIAL"
      }
    });
    await parseBsdaInContext(
      {
        input: {
          emitter: { company: { name: "ACME" } }
        },
        persisted: bsda as any
      },
      {}
    );
  });

  it("should be possible to update any fields when bsda status is SIGNED_BY_PRODUCER", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    const { company: nextDestinationCompany } = await userWithCompanyFactory();
    const { company: workerCompany } = await userWithCompanyFactory();
    const bsda = await bsdaFactory({
      opt: {
        workerCompanySiret: company.siret,
        destinationCompanySiret: company.siret,
        transporterCompanySiret: company.siret,
        destinationOperationNextDestinationCompanySiret:
          nextDestinationCompany.siret,
        status: "SIGNED_BY_PRODUCER"
      }
    });

    await parseBsdaInContext(
      {
        input: {
          worker: { company: { name: "ACME 2", siret: workerCompany.siret } }
        },
        persisted: bsda as any
      },
      { user }
    );
  });

  it("should not be possible to update a field sealed by emission signature", async () => {
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date()
      }
    });

    expect.assertions(1);
    try {
      await parseBsdaInContext(
        {
          input: {
            emitter: { company: { name: "ACME" } }
          },
          persisted: bsda as any
        },
        { currentSignatureType: "WORK" }
      );
    } catch (error) {
      expect(error.issues[0].message).toBe(
        "Le nom de l'entreprise émettrice a été vérouillé via signature et ne peut pas être modifié."
      );
    }
  });

  it("should be possible to set a sealed field to null if it was empty", async () => {
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date(),
        emitterPickupSiteAddress: ""
      }
    });

    await parseBsdaInContext(
      {
        input: {
          emitter: { pickupSite: { address: null } }
        },
        persisted: bsda as any
      },
      {}
    );
  });

  it("should be possible to set a sealed field to an empty string if it was null", async () => {
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date(),
        emitterPickupSiteAddress: null
      }
    });

    await parseBsdaInContext(
      {
        input: {
          emitter: { pickupSite: { address: "" } }
        },
        persisted: bsda as any
      },
      {}
    );
  });

  it("should be possible for the emitter to update a field sealed by emission signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterCompanySiret: company.siret,
        emitterEmissionSignatureDate: new Date()
      }
    });

    await parseBsdaInContext(
      {
        input: {
          emitter: { company: { name: "ACME" } }
        },
        persisted: bsda as any
      },
      { user }
    );
  });

  it("should be possible to re-send same data on a field sealed by emission signature", async () => {
    const grouping = [await bsdaFactory({})];
    const intermediary = await companyFactory();
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date(),
        grouping: { connect: grouping.map(bsda => ({ id: bsda.id })) }
      }
    });
    await prisma.intermediaryBsdaAssociation.create({
      data: {
        bsdaId: bsda.id,
        siret: intermediary.siret!,
        name: intermediary.name,
        contact: "contact"
      }
    });

    await parseBsdaInContext(
      {
        input: {
          emitter: { company: { siret: bsda.emitterCompanySiret } },
          forwarding: bsda.forwardingId,
          grouping: grouping.map(bsda => bsda.id),
          intermediaries: [
            {
              siret: intermediary.siret,
              name: intermediary.name,
              contact: "contact2",
              address: "adresse"
            }
          ]
        },
        persisted: bsda as any
      },
      {}
    );
  });

  it("should be possible to update a field not yet sealed by emission signature", async () => {
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date()
      }
    });

    await parseBsdaInContext(
      {
        input: {
          transporter: { transport: { plates: ["AD-008-TS"] } }
        },
        persisted: bsda as any
      },
      {}
    );
  });

  it("should not be possible to update a field sealed by worker signature", async () => {
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_WORKER",
        emitterEmissionSignatureDate: new Date(),
        workerWorkSignatureDate: new Date()
      }
    });

    expect.assertions(1);
    try {
      await parseBsdaInContext(
        {
          input: {
            worker: {
              work: {
                hasEmitterPaperSignature:
                  !bsda.workerWorkHasEmitterPaperSignature
              }
            }
          },
          persisted: bsda as any
        },
        { currentSignatureType: "WORK" }
      );
    } catch (error) {
      expect(error.issues[0].message).toBe(
        "Le champ workerWorkHasEmitterPaperSignature a été vérouillé via signature et ne peut pas être modifié."
      );
    }
  });

  it("should be possible to update a field not yet sealed by worker signature", async () => {
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_WORKER",
        emitterEmissionSignatureDate: new Date(),
        workerWorkSignatureDate: new Date()
      }
    });

    await parseBsdaInContext(
      {
        input: {
          transporter: { transport: { plates: ["AD-008-TS"] } }
        },
        persisted: bsda as any
      },
      {}
    );
  });

  it("should not be possible to update a field sealed by transporter signature", async () => {
    const bsda = await bsdaFactory({
      opt: {
        status: "SENT",
        emitterEmissionSignatureDate: new Date(),
        workerWorkSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date()
      }
    });

    expect.assertions(1);
    try {
      await parseBsdaInContext(
        {
          input: {
            transporter: {
              transport: {
                plates: ["AD-008-YT"]
              }
            }
          },
          persisted: bsda as any
        },
        { currentSignatureType: "OPERATION" }
      );
    } catch (error) {
      expect(error.issues[0].message).toBe(
        "Le champ transporterTransportPlates a été vérouillé via signature et ne peut pas être modifié."
      );
    }
  });

  it("should be possible to re-send same data on a field sealed by transporter signature", async () => {
    const intermediary = await companyFactory();
    const bsda = await bsdaFactory({
      opt: {
        status: "SENT",
        emitterEmissionSignatureDate: new Date(),
        workerWorkSignatureDate: new Date()
      }
    });
    await prisma.intermediaryBsdaAssociation.create({
      data: {
        bsdaId: bsda.id,
        siret: intermediary.siret!,
        name: intermediary.name,
        contact: "contact"
      }
    });

    await parseBsdaInContext(
      {
        input: {
          transporter: { company: { siret: bsda.transporterCompanySiret } },
          intermediaries: [
            {
              siret: intermediary.siret,
              name: intermediary.name,
              contact: "contact2",
              address: "adresse"
            }
          ]
        },
        persisted: bsda as any
      },
      {}
    );
  });

  it("should be possible to update a field not yet sealed by transport signature", async () => {
    const bsda = await bsdaFactory({
      opt: {
        status: "SENT",
        emitterEmissionSignatureDate: new Date(),
        workerWorkSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date()
      }
    });

    await parseBsdaInContext(
      {
        input: {
          destination: { reception: { weight: 300 } }
        },
        persisted: bsda as any
      },
      {}
    );
  });

  it("should not be possible to update a field sealed by operation signature", async () => {
    const bsda = await bsdaFactory({
      opt: {
        status: "PROCESSED",
        emitterEmissionSignatureDate: new Date(),
        workerWorkSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date(),
        destinationOperationSignatureDate: new Date()
      }
    });

    expect.assertions(1);
    try {
      await parseBsdaInContext(
        {
          input: {
            destination: { reception: { weight: 300 } }
          },
          persisted: bsda as any
        },
        { currentSignatureType: "OPERATION" }
      );
    } catch (error) {
      expect(error.issues[0].message).toBe(
        "Le champ destinationReceptionWeight a été vérouillé via signature et ne peut pas être modifié."
      );
    }
  });
});
