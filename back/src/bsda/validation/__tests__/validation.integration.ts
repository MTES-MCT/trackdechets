import { Bsda, BsdaType } from "@prisma/client";
import { resetDatabase } from "../../../../integration-tests/helper";
import { companyFactory } from "../../../__tests__/factories";

import { bsdaFactory } from "../../__tests__/factories";
import { rawBsdaSchema } from "../schema";
import { parseBsda } from "../validate";

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

    it("transporter plate is not required if transport mode is not ROAD", async () => {
      const data = {
        ...bsda,
        transporterTransportMode: "AIR"
      };

      const res = await parseBsda(data, {
        currentSignatureType: "TRANSPORT"
      });
      expect(res).toBeTruthy();
    });

    it("should work if transport mode is ROAD & plates are defined", async () => {
      const data = {
        ...bsda,
        transporterTransportMode: "ROAD",
        transporterTransportPlates: ["TRANSPORTER-PLATES"]
      };

      const res = await parseBsda(data, {
        currentSignatureType: "TRANSPORT"
      });
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
      const result = await rawBsdaSchema.safeParseAsync(data);

      if (result.success) {
        throw new Error("Expected error.");
      }

      expect(result.error.issues[0].message).toBe(
        "L'établissement avec le SIRET 85001946400021 n'est pas inscrit sur Trackdéchets"
      );
    });

    test("when transporter is registered with wrong profile", async () => {
      const company = await companyFactory({ companyTypes: ["PRODUCER"] });
      const data = {
        ...bsda,
        transporterCompanySiret: company.siret
      };
      const result = await rawBsdaSchema.safeParseAsync(data);

      if (result.success) {
        throw new Error("Expected error.");
      }

      expect(result.error.issues[0].message).toBe(
        `Le transporteur saisi sur le bordereau (SIRET: ${company.siret}) n'est pas inscrit sur Trackdéchets en tant qu'entreprise de transport.` +
          " Cette entreprise ne peut donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette entreprise pour" +
          " qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements"
      );
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
        await parseBsda(data, {
          currentSignatureType: "TRANSPORT"
        });
      } catch (error) {
        expect(error.issues[0].message).toBe(
          "Transporteur: le numéro de récépissé est obligatoire. L'établissement doit renseigner son récépissé dans Trackdéchets"
        );
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
        await parseBsda(data, { currentSignatureType: "TRANSPORT" });
      } catch (err) {
        expect(err.issues[0].message).toBe(
          "La plaque d'immatriculation est requise"
        );
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
          await parseBsda(data, { currentSignatureType: "TRANSPORT" });
        } catch (err) {
          expect(err.errors.length).toBeTruthy();
        }
      }
    );

    test("when operation mode is not compatible with operation code", async () => {
      const data = {
        ...bsda,
        destinationOperationCode: "R 5",
        destinationOperationMode: "VALORISATION_ENERGETIQUE"
      };

      expect.assertions(2);

      try {
        await parseBsda(data, { currentSignatureType: "OPERATION" });
      } catch (err) {
        expect(err.errors.length).toBeTruthy();
        expect(err.issues[0].message).toBe(
          "Le mode de traitement n'est pas compatible avec l'opération de traitement choisie"
        );
      }
    });

    test("if operation code has associated operation modes but none is specified", async () => {
      const data = {
        ...bsda,
        destinationOperationCode: "R 5",
        destinationOperationMode: undefined
      };

      expect.assertions(2);

      try {
        await parseBsda(data, { currentSignatureType: "OPERATION" });
      } catch (err) {
        expect(err.errors.length).toBeTruthy();
        expect(err.errors[0].message).toBe(
          "Vous devez préciser un mode de traitement"
        );
      }
    });
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

      const result = await parseBsda(data, {
        currentSignatureType: "TRANSPORT"
      });

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
        await parseBsda(data, {
          currentSignatureType: "TRANSPORT"
        });
      } catch (error) {
        expect(error.issues[0].message).toBe(
          `Le transporteur saisi sur le bordereau (SIRET: ${emitterAndTransporter.siret}) n'est pas inscrit sur Trackdéchets en tant qu'entreprise de transport.` +
            " Cette entreprise ne peut donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette entreprise pour" +
            " qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements"
        );
      }
    });
  });
});
