import { Bsvhu, Company, OperationMode } from "@prisma/client";
import { resetDatabase } from "../../../integration-tests/helper";
import { companyFactory } from "../../__tests__/factories";
import { validateBsvhu } from "../validation";

import { bsvhuFactory } from "./factories.vhu";

describe("BSVHU validation", () => {
  afterAll(resetDatabase);

  let bsvhu: Bsvhu;
  let foreignTransporter: Company;

  beforeAll(async () => {
    const emitterCompany = await companyFactory({ companyTypes: ["PRODUCER"] });
    const transporterCompany = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });
    const destinationCompany = await companyFactory({
      companyTypes: ["WASTEPROCESSOR"]
    });
    foreignTransporter = await companyFactory({
      companyTypes: ["TRANSPORTER"],
      orgId: "IT13029381004",
      vatNumber: "IT13029381004"
    });

    bsvhu = await bsvhuFactory({
      opt: {
        emitterCompanySiret: emitterCompany.siret,
        transporterCompanySiret: transporterCompany.siret,
        destinationCompanySiret: destinationCompany.siret
      }
    });
  });

  describe("BSVHU should be valid", () => {
    test("when there is a foreign transporter vatNumber and transporter siret is null", async () => {
      const data = {
        ...bsvhu,
        transporterCompanyVatNumber: foreignTransporter.vatNumber,
        transporterCompanySiret: null
      };
      const validated = await validateBsvhu(data, {
        transportSignature: true
      });
      expect(validated).toBeDefined();
    });

    test("when there is a foreign transporter and recepisse fields are null", async () => {
      const data = {
        ...bsvhu,
        transporterCompanyVatNumber: foreignTransporter.vatNumber,
        transporterCompanySiret: null,
        transporterRecepisseDepartment: null,
        transporterRecepisseNumber: null
      };
      const validated = await validateBsvhu(data, {
        transportSignature: true
      });
      expect(validated).toBeDefined();
    });
    test("when transporter is french and exemption of recepisse is true", async () => {
      const data = {
        ...bsvhu,
        transporterRecepisseIsExempted: true,
        transporterRecepisseDepartment: null,
        transporterRecepisseNumber: null,
        transporterRecepisseValidityLimit: null
      };
      const validated = await validateBsvhu(data, {
        transportSignature: true
      });
      expect(validated).toBeDefined();
    });
  });

  describe("BSVHU should not be valid", () => {
    test("when emitter siret is not valid", async () => {
      const data = {
        ...bsvhu,
        emitterCompanySiret: "1"
      };
      expect.assertions(1);

      try {
        await validateBsvhu(data, {
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
        ...bsvhu,
        transporterCompanySiret: "1"
      };
      expect.assertions(1);

      try {
        await validateBsvhu(data, {
          transportSignature: true
        });
      } catch (err) {
        expect(err.errors).toEqual([
          "Transporteur: 1 n'est pas un numéro de SIRET valide",
          "Transporteur : l'établissement avec le SIRET 1 n'est pas inscrit sur Trackdéchets"
        ]);
      }
    });

    test("when transporter is not registered in Trackdéchets", async () => {
      const data = {
        ...bsvhu,
        transporterCompanySiret: "85001946400021"
      };
      expect.assertions(1);

      try {
        await validateBsvhu(data, {
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
        ...bsvhu,
        transporterCompanySiret: null,
        transporterCompanyVatNumber: "ESA15022510"
      };
      expect.assertions(1);

      try {
        await validateBsvhu(data, {
          transportSignature: true
        });
      } catch (err) {
        expect(err.errors).toEqual([
          "Transporteur : le transporteur avec le n°de TVA ESA15022510 n'est pas inscrit sur Trackdéchets"
        ]);
      }
    });

    test("when transporter is registered with wrong profile", async () => {
      const company = await companyFactory({ companyTypes: ["PRODUCER"] });
      const data = {
        ...bsvhu,
        transporterCompanySiret: company.siret
      };
      expect.assertions(1);

      try {
        await validateBsvhu(data, {
          transportSignature: true
        });
      } catch (err) {
        expect(err.errors).toEqual([
          `Le transporteur saisi sur le bordereau (SIRET: ${company.siret}) n'est pas inscrit sur Trackdéchets` +
            " en tant qu'entreprise de transport. Cette entreprise ne peut donc pas être visée sur le bordereau." +
            " Veuillez vous rapprocher de l'administrateur de cette entreprise pour qu'il modifie le profil de" +
            " l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements"
        ]);
      }
    });

    test("when foreign transporter is registered with wrong profile", async () => {
      const company = await companyFactory({
        companyTypes: ["PRODUCER"],
        orgId: "ESA15022510",
        vatNumber: "ESA15022510"
      });
      const data = {
        ...bsvhu,
        transporterCompanySiret: null,
        transporterCompanyVatNumber: company.vatNumber
      };
      expect.assertions(1);

      try {
        await validateBsvhu(data, {
          transportSignature: true
        });
      } catch (err) {
        expect(err.errors).toEqual([
          `Le transporteur saisi sur le bordereau (numéro de TVA: ${company.vatNumber}) n'est pas inscrit sur Trackdéchets` +
            " en tant qu'entreprise de transport. Cette entreprise ne peut donc pas être visée sur le bordereau." +
            " Veuillez vous rapprocher de l'administrateur de cette entreprise pour qu'il modifie le profil de" +
            " l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements"
        ]);
      }
    });

    test("when transporter vatNumber is FR", async () => {
      const data = {
        ...bsvhu,
        transporterCompanyVatNumber: "FR35552049447"
      };
      expect.assertions(1);

      try {
        await validateBsvhu(data, {
          transportSignature: true
        });
      } catch (err) {
        expect(err.errors).toEqual([
          "Transporteur : Impossible d'utiliser le numéro de TVA pour un établissement français, veuillez renseigner son SIRET uniquement",
          "Transporteur : le transporteur avec le n°de TVA FR35552049447 n'est pas inscrit sur Trackdéchets"
        ]);
      }
    });

    test("when destination siret is not valid", async () => {
      const data = {
        ...bsvhu,
        destinationCompanySiret: "1"
      };
      expect.assertions(1);

      try {
        await validateBsvhu(data, {
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
        ...bsvhu,
        destinationCompanySiret: "85001946400021"
      };
      expect.assertions(1);

      try {
        await validateBsvhu(data, {
          transportSignature: true
        });
      } catch (err) {
        expect(err.errors).toEqual([
          "Destination : l'établissement avec le SIRET 85001946400021 n'est pas inscrit sur Trackdéchets"
        ]);
      }
    });

    test("when destination is registered with wrong profile", async () => {
      const company = await companyFactory({ companyTypes: ["PRODUCER"] });
      const data = {
        ...bsvhu,
        destinationCompanySiret: company.siret
      };
      expect.assertions(1);

      try {
        await validateBsvhu(data, {
          transportSignature: true
        });
      } catch (err) {
        expect(err.errors).toEqual([
          `L'installation de destination ou d’entreposage ou de reconditionnement avec le SIRET \"${company.siret}\" n'est pas inscrite` +
            " sur Trackdéchets en tant qu'installation de traitement ou de tri transit regroupement. Cette installation ne peut donc pas" +
            " être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette installation pour qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements"
        ]);
      }
    });

    test("when transporter is french but recepisse fields are missing", async () => {
      const data = {
        ...bsvhu,
        transporterRecepisseIsExempted: false,
        transporterRecepisseDepartment: null,
        transporterRecepisseNumber: null,
        transporterRecepisseValidityLimit: null
      };
      expect.assertions(1);

      try {
        await validateBsvhu(data, {
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

    test("when operation mode is not compatible with operation code", async () => {
      const data = {
        ...bsvhu,
        destinationOperationCode: "R 1",
        destinationOperationMode: OperationMode.RECYCLAGE
      };
      expect.assertions(1);

      try {
        await validateBsvhu(data, {
          transportSignature: true
        });
      } catch (err) {
        expect(err.errors.length).toBeTruthy();
      }
    });

    test("when destination agrement number is missing", async () => {
      const data = {
        ...bsvhu,
        destinationAgrementNumber: null
      };

      try {
        await validateBsvhu(data, {
          emissionSignature: true
        });
      } catch (err) {
        expect(err.errors).toEqual(
          expect.arrayContaining([
            "Destinataire: le numéro d'agrément est obligatoire"
          ])
        );
      }
    });
  });

  describe("Emitter transports own waste", () => {
    it("allowed if exemption", async () => {
      const data = {
        ...bsvhu,
        transporterCompanySiret: bsvhu.emitterCompanySiret,
        transporterRecepisseIsExempted: true
      };

      expect.assertions(1);

      const validated = await validateBsvhu(data, {
        transportSignature: true
      });

      expect(validated).toBeDefined();
    });

    it("NOT allowed if no exemption", async () => {
      const data = {
        ...bsvhu,
        transporterCompanySiret: bsvhu.emitterCompanySiret,
        transporterRecepisseIsExempted: false
      };

      expect.assertions(1);

      try {
        await validateBsvhu(data, {
          transportSignature: true
        });
      } catch (err) {
        expect(err.errors).toEqual([
          `Le transporteur saisi sur le bordereau (SIRET: ${bsvhu.emitterCompanySiret}) n'est pas inscrit sur Trackdéchets en tant qu'entreprise de transport. Cette entreprise ne peut donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette entreprise pour qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements`
        ]);
      }
    });
  });
});
