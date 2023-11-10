import { Bsdasri, Company } from "@prisma/client";
import { resetDatabase } from "../../../integration-tests/helper";
import { companyFactory } from "../../__tests__/factories";
import { validateBsdasri } from "../validation";

import {
  initialData,
  readyToPublishData,
  readyToTakeOverData
} from "./factories";

describe("Mutation.signBsdasri emission", () => {
  afterEach(resetDatabase);

  let bsdasri: Partial<Bsdasri>;
  let foreignTransporter: Company;

  beforeEach(async () => {
    const emitter = await companyFactory({ companyTypes: ["PRODUCER"] });
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });
    foreignTransporter = await companyFactory({
      companyTypes: ["TRANSPORTER"],
      orgId: "IT13029381004",
      vatNumber: "IT13029381004"
    });
    const destination = await companyFactory({
      companyTypes: ["COLLECTOR"]
    });
    bsdasri = {
      ...initialData(emitter),
      ...readyToPublishData(destination),
      ...readyToTakeOverData({
        siret: transporter.siret,
        name: "transporteur"
      })
    };
  });

  describe("BSDASRI should be valid", () => {
    test("before emission", async () => {
      const validated = await validateBsdasri(
        {
          ...initialData(await companyFactory()),
          ...readyToPublishData(await companyFactory())
        },
        {
          emissionSignature: true
        }
      );
      expect(validated).toBeDefined();
    });

    test("before transport", async () => {
      const validated = await validateBsdasri(
        {
          ...readyToPublishData(await companyFactory()),
          ...readyToTakeOverData(
            await companyFactory({ companyTypes: ["TRANSPORTER"] })
          )
        },
        { transportSignature: true }
      );
      expect(validated).toBeDefined();
    });

    test("before emission and transport", async () => {
      const validated = await validateBsdasri(bsdasri as any, {
        emissionSignature: true,
        transportSignature: true
      });
      expect(validated).toBeDefined();
    });

    test("when there is foreign vat number and transporter siret is null", async () => {
      const data = {
        ...bsdasri,
        transporterCompanyVatNumber: foreignTransporter.vatNumber,
        transporterCompanySiret: null
      };
      const validated = await validateBsdasri(data as any, {
        transportSignature: true
      });
      expect(validated).toBeDefined();
    });

    test("there is a foreign transporter and recepisse fields are null", async () => {
      const data = {
        ...bsdasri,
        transporterCompanyVatNumber: foreignTransporter.vatNumber,
        transporterCompanySiret: null,
        transporterRecepisseNumber: null,
        transporterRecepisseDepartment: null,
        transporterRecepisseValidityLimit: null
      };
      const validated = await validateBsdasri(data as any, {
        transportSignature: true
      });
      expect(validated).toBeDefined();
    });
    test("when transporter is french and exemption of recepisse is true", async () => {
      const data = {
        ...bsdasri,
        transporterRecepisseIsExempted: true,
        transporterRecepisseDepartment: null,
        transporterRecepisseNumber: null,
        transporterRecepisseValidityLimit: null
      };
      const validated = await validateBsdasri(data as any, {
        transportSignature: true
      });
      expect(validated).toBeDefined();
    });

    it("transporter plate is not required if transport mode is not ROAD", async () => {
      const data = {
        ...bsdasri,
        transporterTransportMode: "AIR"
      };
      const validated = await validateBsdasri(data as any, {
        transportSignature: true
      });
      expect(validated).toBeDefined();
    });

    it("should work if transport mode is ROAD & plates are defined", async () => {
      const data = {
        ...bsdasri,
        transporterTransportMode: "ROAD",
        transporterTransportPlates: ["TRANSPORTER-PLATES"]
      };
      const validated = await validateBsdasri(data as any, {
        transportSignature: true
      });
      expect(validated).toBeDefined();
    });
  });

  describe("BSDASRI should not be valid", () => {
    afterEach(resetDatabase);

    test("when transporter is FR and recepisse fields are null", async () => {
      const data = {
        ...bsdasri,
        transporterRecepisseIsExempted: false,
        transporterRecepisseNumber: null,
        transporterRecepisseDepartment: null,
        transporterRecepisseValidityLimit: null
      };

      expect.assertions(1);

      try {
        await validateBsdasri(data as any, {
          transportSignature: true
        });
      } catch (err) {
        expect(err.errors).toEqual(
          expect.arrayContaining([
            "Transporteur: le département associé au récépissé est obligatoire - l'établissement doit renseigner son récépissé dans Trackdéchets",
            "Transporteur: le numéro de récépissé est obligatoire - l'établissement doit renseigner son récépissé dans Trackdéchets",
            "Transporteur: la date limite de validité du récépissé est obligatoire - l'établissement doit renseigner son récépissé dans Trackdéchets"
          ])
        );
      }
    });

    test("when emitter siret is not valid", async () => {
      const data = {
        ...bsdasri,
        emitterCompanySiret: "1"
      };

      expect.assertions(1);

      try {
        await validateBsdasri(data as any, {
          transportSignature: true
        });
      } catch (err) {
        expect(err.errors).toEqual([
          "Émetteur: 1 n'est pas un numéro de SIRET valide"
        ]);
      }
    });

    test("when transporter siret is not valid", async () => {
      const data = {
        ...bsdasri,
        transporterCompanySiret: "1"
      };

      expect.assertions(1);

      try {
        await validateBsdasri(data as any, {
          transportSignature: true
        });
      } catch (err) {
        expect(err.errors).toEqual([
          "Transporteur: 1 n'est pas un numéro de SIRET valide",
          "Transporteur : l'établissement avec le SIRET 1 n'est pas inscrit sur Trackdéchets"
        ]);
      }
    });

    test("when transporter vatNumber is FR", async () => {
      const data = {
        ...bsdasri,
        transporterCompanyVatNumber: "FR35552049447"
      };

      expect.assertions(1);

      try {
        await validateBsdasri(data as any, {
          transportSignature: true
        });
      } catch (err) {
        expect(err.errors).toEqual([
          "Transporteur : Impossible d'utiliser le numéro de TVA pour un établissement français, veuillez renseigner son SIRET uniquement",
          "Transporteur : le transporteur avec le n°de TVA FR35552049447 n'est pas inscrit sur Trackdéchets"
        ]);
      }
    });

    test("when transporter is not registered in Trackdéchets", async () => {
      const data = {
        ...bsdasri,
        transporterCompanySiret: "85001946400021"
      };

      expect.assertions(1);

      try {
        await validateBsdasri(data as any, {
          transportSignature: true
        });
      } catch (err) {
        expect(err.errors).toEqual([
          "Transporteur : l'établissement avec le SIRET 85001946400021 n'est pas inscrit sur Trackdéchets"
        ]);
      }
    });

    test("when foreign transporter is not registered in Trackdéchets", async () => {
      const data = {
        ...bsdasri,
        transporterCompanySiret: null,
        transporterCompanyVatNumber: "ESA15022510"
      };

      expect.assertions(1);

      try {
        await validateBsdasri(data as any, {
          transportSignature: true
        });
      } catch (err) {
        expect(err.errors).toEqual([
          "Transporteur : le transporteur avec le n°de TVA ESA15022510 n'est pas inscrit sur Trackdéchets"
        ]);
      }
    });

    test("when transporter is registered with the wrong profile Trackdéchets", async () => {
      const company = await companyFactory({ companyTypes: ["PRODUCER"] });
      const data = {
        ...bsdasri,
        transporterCompanySiret: company.siret
      };

      expect.assertions(1);

      try {
        await validateBsdasri(data as any, {
          transportSignature: true
        });
      } catch (err) {
        expect(err.errors).toEqual([
          `Le transporteur saisi sur le bordereau (SIRET: ${company.siret}) n'est pas inscrit sur Trackdéchets en tant qu'entreprise de transport.` +
            " Cette entreprise ne peut donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette entreprise pour" +
            " qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements"
        ]);
      }
    });

    test("when foreign transporter is registered with the wrong profile Trackdéchets", async () => {
      const company = await companyFactory({
        companyTypes: ["PRODUCER"],
        orgId: "ESA15022510",
        vatNumber: "ESA15022510"
      });
      const data = {
        ...bsdasri,
        transporterCompanySiret: null,
        transporterCompanyVatNumber: company.vatNumber
      };

      expect.assertions(1);

      try {
        await validateBsdasri(data as any, {
          transportSignature: true
        });
      } catch (err) {
        expect(err.errors).toEqual([
          `Le transporteur saisi sur le bordereau (numéro de TVA: ${company.vatNumber}) n'est pas inscrit sur Trackdéchets en tant qu'entreprise de transport.` +
            " Cette entreprise ne peut donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette entreprise pour" +
            " qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements"
        ]);
      }
    });

    test("when destination siret is not valid", async () => {
      const data = {
        ...bsdasri,
        destinationCompanySiret: "1"
      };

      expect.assertions(1);

      try {
        await validateBsdasri(data as any, {
          transportSignature: true
        });
      } catch (err) {
        expect(err.errors).toEqual([
          "Destination: 1 n'est pas un numéro de SIRET valide",
          "Destination : l'établissement avec le SIRET 1 n'est pas inscrit sur Trackdéchets"
        ]);
      }
    });

    test("when destination is not registered in Trackdéchets", async () => {
      const data = {
        ...bsdasri,
        destinationCompanySiret: "85001946400021"
      };

      expect.assertions(1);

      try {
        await validateBsdasri(data as any, {
          transportSignature: true
        });
      } catch (err) {
        expect(err.errors).toEqual([
          "Destination : l'établissement avec le SIRET 85001946400021 n'est pas inscrit sur Trackdéchets"
        ]);
      }
    });

    test("when destination is registered with the wrong profile Trackdéchets", async () => {
      const company = await companyFactory({ companyTypes: ["PRODUCER"] });
      const data = {
        ...bsdasri,
        destinationCompanySiret: company.siret
      };

      expect.assertions(1);

      try {
        await validateBsdasri(data as any, {
          transportSignature: true
        });
      } catch (err) {
        expect(err.errors).toEqual([
          `L'installation de destination ou d’entreposage ou de reconditionnement avec le SIRET \"${company.siret}\" n'est pas inscrite` +
            " sur Trackdéchets en tant qu'installation de traitement ou de tri transit regroupement. Cette installation ne peut donc" +
            " pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette installation pour qu'il modifie le profil" +
            " de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements"
        ]);
      }
    });

    it("transporter plate is required if transporter mode is ROAD", async () => {
      const data = {
        ...bsdasri,
        transporterTransportMode: "ROAD",
        transporterTransportPlates: undefined
      };
      expect.assertions(1);

      try {
        await validateBsdasri(data as any, {
          transportSignature: true
        });
      } catch (err) {
        expect(err.errors).toEqual(["La plaque d'immatriculation est requise"]);
      }
    });

    it.each(["", null, [null], [undefined], []])(
      "transporter plate is required if transporter mode is ROAD - invalid value %p",
      async invalidValue => {
        const data = {
          ...bsdasri,
          transporterTransportMode: "ROAD",
          transporterTransportPlates: invalidValue
        };
        expect.assertions(2);

        try {
          await validateBsdasri(data as any, {
            transportSignature: true
          });
        } catch (err) {
          expect(err.errors.length).toBeTruthy();
          expect(
            [
              "transporterTransportPlates[0] ne peut pas être null",
              "transporterTransportPlates ne peut pas être null",
              "La plaque d'immatriculation est requise"
            ].includes(err.errors[0])
          ).toBeTruthy();
        }
      }
    );

    test("when operation mode is not compatible with operation code", async () => {
      const data = {
        ...bsdasri,
        destinationOperationCode: "R1",
        destinationOperationMode: "RECYCLAGE",
        destinationReceptionWasteWeightValue: 10
      };
      expect.assertions(2);

      try {
        await validateBsdasri(data as any, {
          operationSignature: true
        });
      } catch (err) {
        expect(err.errors.length).toBeTruthy();
        expect(err.errors[0]).toBe(
          "Le mode de traitement n'est pas compatible avec l'opération de traitement choisie"
        );
      }
    });

    test("if operation code has associated operation modes but none is specified", async () => {
      const data = {
        ...bsdasri,
        destinationOperationCode: "D9",
        destinationOperationMode: undefined,
        destinationReceptionWasteWeightValue: 10
      };

      expect.assertions(2);

      try {
        await validateBsdasri(data as any, {
          operationSignature: true
        });
      } catch (err) {
        expect(err.errors.length).toBeTruthy();
        expect(err.errors[0]).toBe("Vous devez préciser un mode de traitement");
      }
    });
  });

  describe("Emitter transports own waste", () => {
    it("allowed if exemption", async () => {
      const data = {
        ...bsdasri,
        transporterCompanySiret: bsdasri.emitterCompanySiret,
        transporterRecepisseIsExempted: true
      };

      expect.assertions(1);

      const validated = await validateBsdasri(data as any, {
        transportSignature: true
      });

      expect(validated).toBeDefined();
    });

    it("NOT allowed if no exemption", async () => {
      const data = {
        ...bsdasri,
        transporterCompanySiret: bsdasri.emitterCompanySiret,
        transporterRecepisseIsExempted: false
      };

      expect.assertions(1);

      try {
        await validateBsdasri(data as any, {
          transportSignature: true
        });
      } catch (err) {
        expect(err.errors).toEqual([
          `Le transporteur saisi sur le bordereau (SIRET: ${bsdasri.emitterCompanySiret}) n'est pas inscrit sur Trackdéchets` +
            ` en tant qu'entreprise de transport. Cette entreprise ne peut donc pas être visée sur le bordereau.` +
            ` Veuillez vous rapprocher de l'administrateur de cette entreprise pour qu'il modifie le profil` +
            ` de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements`
        ]);
      }
    });
  });

  describe("Operation modes", () => {
    test.each([
      ["D9", "ELIMINATION"],
      ["R12", undefined]
    ])(
      "should work if operation code & mode are compatible (code: %p, mode: %p)",
      async (code, mode) => {
        const data = {
          ...bsdasri,
          destinationOperationCode: code,
          destinationOperationMode: mode,
          destinationOperationDate: new Date(),
          destinationReceptionWasteWeightValue: 10
        };

        const res = await validateBsdasri(data as any, {
          operationSignature: true
        });
        expect(res).not.toBeUndefined();
      }
    );

    test.only("should work if operation mode is missing but step is not operation",
      async () => {
        const data = {
          ...bsdasri,
          destinationOperationCode: "D9",
          destinationOperationMode: undefined, // Correct mode is ELIMINATION
          destinationOperationDate: new Date(),
          destinationReceptionWasteWeightValue: 10
        };

        const res = await validateBsdasri(data as any, {
          transportSignature: true
        });
        expect(res).not.toBeUndefined();
      }
    );

    test.each([
      ["D9", "VALORISATION_ENERGETIQUE"], // Correct mode is ELIMINATION
      ["R12", "VALORISATION_ENERGETIQUE"] // R12 has no associated mode
    ])(
      "should not be valid if operation mode is not compatible with operation code (mode: %p, code: %p)",
      async (code, mode) => {
        const data = {
          ...bsdasri,
          destinationOperationCode: code,
          destinationOperationMode: mode,
          destinationOperationDate: new Date(),
          destinationReceptionWasteWeightValue: 10
        };

        expect.assertions(2);

        try {
          await validateBsdasri(data as any, { operationSignature: true });
        } catch (err) {
          expect(err.errors.length).toBeTruthy();
          expect(err.errors[0]).toBe(
            "Le mode de traitement n'est pas compatible avec l'opération de traitement choisie"
          );
        }
      }
    );

    test("should not be valid if operation code has associated operation modes but none is specified", async () => {
      const data = {
        ...bsdasri,
        destinationOperationCode: "D9",
        destinationOperationMode: undefined,
        destinationOperationDate: new Date(),
        destinationReceptionWasteWeightValue: 10
      };

      expect.assertions(2);

      try {
        await validateBsdasri(data as any, { operationSignature: true });
      } catch (err) {
        expect(err.errors.length).toBeTruthy();
        expect(err.errors[0]).toBe("Vous devez préciser un mode de traitement");
      }
    });
  });
});
