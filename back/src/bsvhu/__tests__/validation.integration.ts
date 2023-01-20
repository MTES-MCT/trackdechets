import { Bsvhu } from "@prisma/client";
import { resetDatabase } from "../../../integration-tests/helper";
import { companyFactory } from "../../__tests__/factories";
import { validateBsvhu } from "../validation";

import { bsvhuFactory } from "./factories.vhu";

describe("BSVHU validation", () => {
  afterAll(resetDatabase);

  let bsvhu: Bsvhu;

  beforeAll(async () => {
    const emitterCompany = await companyFactory({ companyTypes: ["PRODUCER"] });
    const transporterCompany = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });
    const destinationCompany = await companyFactory({
      companyTypes: ["WASTEPROCESSOR"]
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
        transporterCompanyVatNumber: "BE0541696005",
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
        transporterCompanyVatNumber: "BE0541696005",
        transporterRecepisseDepartment: null,
        transporterRecepisseNumber: null
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
          "Transporteur : Impossible d'utiliser le numéro de TVA pour un établissement français, veuillez renseigner son SIRET uniquement"
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
        expect(err.errors).toEqual([
          "Transporteur: le département associé au récépissé est obligatoire",
          "Transporteur: le numéro de récépissé est obligatoire",
          "Transporteur: la date de validité de récépissé est obligatoire"
        ]);
      }
    });
  });
});
