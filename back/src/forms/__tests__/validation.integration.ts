import {
  BsddTransporter,
  EmitterType,
  Form,
  OperationMode,
  TransportMode,
  WasteProcessorType
} from "@prisma/client";
import {
  draftFormSchema,
  sealedFormSchema,
  ecoOrganismeSchema,
  receivedInfoSchema,
  processedInfoSchema,
  transporterSchemaFn,
  beforeTransportSchemaFn,
  recipientSchemaFn
} from "../validation";
import type { ReceivedFormInput } from "@td/codegen-back";
import {
  companyFactory,
  ecoOrganismeFactory,
  siretify,
  userWithCompanyFactory
} from "../../__tests__/factories";
import { resetDatabase } from "../../../integration-tests/helper";
import { REQUIRED_RECEIPT_NUMBER } from "../../common/validation";
import Decimal from "decimal.js";

const siret1 = siretify(1);
const siret2 = siretify(2);
const siret3 = siretify(3);
const formData: Partial<Form> = {
  id: "cjplbvecc000d0766j32r19am",
  readableId: "BSD-20210101-AAAAAAAA",
  status: "DRAFT",
  emitterType: "PRODUCER",
  emitterWorkSiteName: "",
  emitterWorkSiteAddress: "",
  emitterWorkSiteCity: "",
  emitterWorkSitePostalCode: "",
  emitterWorkSiteInfos: "",
  emitterCompanyName: "A company 2",
  emitterCompanySiret: siret1,
  emitterCompanyContact: "Emetteur",
  emitterCompanyPhone: "01",
  emitterCompanyAddress: "8 rue du Général de Gaulle",
  emitterCompanyMail: "e@e.fr",
  recipientCap: "1234",
  recipientProcessingOperation: "D 6",
  recipientCompanyName: "A company 3",
  recipientCompanySiret: siret2,
  recipientCompanyAddress: "8 rue du Général de Gaulle",
  recipientCompanyContact: "Destination",
  recipientCompanyPhone: "02",
  recipientCompanyMail: "d@d.fr",

  wasteDetailsCode: "16 06 01*",
  wasteDetailsName: "Déchets divers",
  wasteDetailsOnuCode: "AAA",
  wasteDetailsPackagingInfos: [
    { type: "FUT", other: null, quantity: 1 },
    { type: "GRV", other: null, quantity: 1 }
  ],
  wasteDetailsQuantity: new Decimal(1.5),
  wasteDetailsQuantityType: "REAL",
  wasteDetailsConsistence: "SOLID",
  wasteDetailsPop: false
};

const transporterData: Partial<BsddTransporter> = {
  transporterReceipt: "sdfg",
  transporterDepartment: "82",
  transporterValidityLimit: new Date("2018-12-11T00:00:00.000Z"),
  transporterCompanyName: "A company 4",
  transporterCompanySiret: siret3,
  transporterCompanyAddress: "8 rue du Général de Gaulle",
  transporterCompanyContact: "Transporteur",
  transporterCompanyPhone: "03",
  transporterCompanyMail: "t@t.fr",
  transporterTransportMode: TransportMode.ROAD,
  transporterNumberPlate: "NBR-PLATE",
  number: 1
};

describe("sealedFormSchema", () => {
  let sealedForm: Partial<Form> & { transporters: Partial<BsddTransporter>[] };

  afterAll(resetDatabase);
  beforeAll(async () => {
    const emitterCompany = await companyFactory({ companyTypes: ["PRODUCER"] });
    const transporterCompany = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });
    const destinationCompany = await companyFactory({
      companyTypes: ["WASTEPROCESSOR"],
      wasteProcessorTypes: {
        set: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      }
    });
    sealedForm = {
      ...formData,
      emitterCompanySiret: emitterCompany.siret,
      recipientCompanySiret: destinationCompany.siret,
      transporters: [
        {
          ...transporterData,
          transporterCompanySiret: transporterCompany.siret
        }
      ]
    };
  });

  describe("form can be sealed", () => {
    it("when fully filled", async () => {
      const isValid = await sealedFormSchema.isValid(sealedForm);
      expect(isValid).toEqual(true);
    });

    it("with empty strings for optionnal fields", async () => {
      const testForm = {
        ...sealedForm,
        transporters: [
          { ...sealedForm.transporters[0], transporterNumberPlate: "" }
        ]
      };
      await sealedFormSchema.validate(testForm);
      const isValid = await sealedFormSchema.isValid(testForm);
      expect(isValid).toEqual(true);
    });

    it("with null values for optionnal fields", async () => {
      const testForm = {
        ...sealedForm,
        transporters: [
          { ...sealedForm.transporters[0], transporterNumberPlate: null }
        ]
      };
      const isValid = await sealedFormSchema.isValid(testForm);
      expect(isValid).toEqual(true);
    });

    it("with transporter receipt exemption R.541-50 ticked and no transportation infos", async () => {
      const testForm = {
        ...sealedForm,
        transporters: [
          {
            ...sealedForm.transporters[0],
            transporterIsExemptedOfReceipt: true,
            transporterReceipt: null,
            transporterDepartment: null
          }
        ]
      };

      const isValid = await sealedFormSchema.isValid(testForm);
      expect(isValid).toEqual(true);
    });

    it("with foreign transporter receipt no need for exemption R.541-50", async () => {
      const transporter = await companyFactory({
        vatNumber: "GB809734507"
      });
      const testForm: any = {
        ...sealedForm,
        transporters: [
          {
            ...sealedForm.transporters[0],
            transporterCompanyVatNumber: transporter.vatNumber,
            transporterIsExemptedOfReceipt: null,
            transporterReceipt: null,
            transporterDepartment: null
          }
        ]
      };
      delete testForm.transporterCompanySiret;
      const isValid = await sealedFormSchema.isValid(testForm);
      expect(isValid).toEqual(true);
      testForm.transporterIsExemptedOfReceipt = false;
      delete testForm.transporterCompanySiret;
      const isValid2 = await sealedFormSchema.isValid(testForm);
      expect(isValid2).toEqual(true);
    });

    it("when there is an eco-organisme and emitter type is OTHER", async () => {
      const testForm = {
        ...sealedForm,
        emitterType: "OTHER",
        ecoOrganisme: { id: "an_id" }
      };

      const isValid = await sealedFormSchema
        .resolve({ value: testForm })
        .concat(ecoOrganismeSchema)
        .isValid(testForm);
      expect(isValid).toEqual(true);
    });

    it("when there is no eco-organisme and emitter type is OTHER", async () => {
      const testForm = {
        ...sealedForm,
        emitterType: "OTHER",
        ecoOrganisme: null
      };

      const isValid = await sealedFormSchema
        .resolve({ value: testForm })
        .concat(ecoOrganismeSchema)
        .isValid(testForm);
      expect(isValid).toEqual(true);
    });

    test.each(["PRODUCER", "OTHER", "APPENDIX1", "APPENDIX2"])(
      "when emitterType is (%p)",
      async emitterType => {
        const testForm = {
          ...sealedForm,
          emitterType
        };

        const isValid = await sealedFormSchema.isValid(testForm);

        expect(isValid).toEqual(true);
      }
    );

    it("when emitterIsForeignShip is true without emitter company siret", async () => {
      const partialForm: Partial<Form> = {
        ...sealedForm,
        emitterIsForeignShip: true,
        emitterCompanySiret: undefined,
        emitterCompanyOmiNumber: "OMI1234567"
      };
      await sealedFormSchema.validate(partialForm);
      const isValid = await sealedFormSchema.isValid(partialForm);
      expect(isValid).toEqual(true);
    });
    it("when emitterIsPrivateIndividual is true without emitter company siret", async () => {
      const partialForm: Partial<Form> = {
        ...sealedForm,
        emitterIsPrivateIndividual: true,
        emitterCompanySiret: null,
        emitterCompanyContact: null
      };
      await sealedFormSchema.validate(partialForm);
      const isValid = await sealedFormSchema.isValid(partialForm);
      expect(isValid).toEqual(true);
    });

    it("when is grouped and R0 is selected", async () => {
      // Given
      const processedInfo = {
        ...sealedForm,
        processedAt: new Date(),
        processedBy: "John Snow",
        emitterType: EmitterType.APPENDIX2,
        recipientProcessingOperation: "R 0"
      };

      // When
      const validateFn = () => sealedFormSchema.validate(processedInfo);
      const isValid = await validateFn();

      // Then
      expect(isValid).toBeTruthy();
    });

    it("when there is 2 bennes", async () => {
      const testForm = {
        ...sealedForm,
        wasteDetailsPackagingInfos: [
          { type: "BENNE", other: null, quantity: 2 }
        ]
      };

      const isValid = await sealedFormSchema.isValid(testForm);
      expect(isValid).toEqual(true);
    });

    it("when there is 2 citernes", async () => {
      const testForm = {
        ...sealedForm,
        wasteDetailsPackagingInfos: [
          { type: "CITERNE", other: null, quantity: 2 }
        ]
      };

      const isValid = await sealedFormSchema.isValid(testForm);
      expect(isValid).toEqual(true);
    });

    it("when there is more than 2 bennes", async () => {
      const testForm = {
        ...sealedForm,
        wasteDetailsPackagingInfos: [
          { type: "BENNE", other: null, quantity: 3 }
        ]
      };
      const validateFn = () => sealedFormSchema.validate(testForm);
      await expect(validateFn()).rejects.toThrow(
        "Le nombre de benne ou de citerne ne peut être supérieur à 2."
      );
    });

    it("when there is more than 2 citernes", async () => {
      const testForm = {
        ...sealedForm,
        wasteDetailsPackagingInfos: [
          { type: "CITERNE", other: null, quantity: 3 }
        ]
      };

      const validateFn = () => sealedFormSchema.validate(testForm);
      await expect(validateFn()).rejects.toThrow(
        "Le nombre de benne ou de citerne ne peut être supérieur à 2."
      );
    });

    it("when there is no waste details quantity", async () => {
      const testForm = {
        ...sealedForm,
        wasteDetailsQuantity: null
      };

      const isValid = await sealedFormSchema.isValid(testForm);
      expect(isValid).toEqual(false);
    });
  });

  describe("form cannot be sealed", () => {
    it("when emitterCompanySiret is not well formatted", async () => {
      const partialForm: Partial<Form> = {
        ...sealedForm,
        emitterCompanySiret: "123"
      };
      const validateFn = () => sealedFormSchema.validate(partialForm);
      await expect(validateFn()).rejects.toThrow(
        "Émetteur: 123 n'est pas un numéro de SIRET valide"
      );
    });

    it("when transporterCompanySiret is not well formatted", async () => {
      const partialForm: Partial<Form> & {
        transporters: Partial<BsddTransporter>[];
      } = {
        ...sealedForm,
        transporters: [
          { ...sealedForm.transporters[0], transporterCompanySiret: "123" }
        ]
      };
      const validateFn = () => sealedFormSchema.validate(partialForm);
      await expect(validateFn()).rejects.toThrow(
        "Transporteur: 123 n'est pas un numéro de SIRET valide"
      );
    });

    it("when transporter is not registered in Trackdéchets", async () => {
      const partialForm: Partial<Form> & {
        transporters: Partial<BsddTransporter>[];
      } = {
        ...sealedForm,
        transporters: [
          {
            ...sealedForm.transporters[0],
            transporterCompanySiret: "85001946400021"
          }
        ]
      };
      const validateFn = () => sealedFormSchema.validate(partialForm);
      await expect(validateFn()).rejects.toThrow(
        "Transporteur : l'établissement avec le SIRET 85001946400021 n'est pas inscrit sur Trackdéchets"
      );
    });

    it("when foreign transporter is not registered in Trackdéchets", async () => {
      const partialForm: Partial<Form> & {
        transporters: Partial<BsddTransporter>[];
      } = {
        ...sealedForm,
        transporters: [
          {
            ...sealedForm.transporters[0],
            transporterCompanyVatNumber: "IT13029381004"
          }
        ]
      };
      const validateFn = () => sealedFormSchema.validate(partialForm);
      await expect(validateFn()).rejects.toThrow(
        "Transporteur : le transporteur avec le n°de TVA IT13029381004 n'est pas inscrit sur Trackdéchets"
      );
    });

    it("when transporter is registered in Trackdéchets with wrong profile", async () => {
      const company = await companyFactory({ companyTypes: ["PRODUCER"] });
      const partialForm: Partial<Form> & {
        transporters: Partial<BsddTransporter>[];
      } = {
        ...sealedForm,
        transporters: [
          {
            ...sealedForm.transporters[0],
            transporterCompanySiret: company.siret
          }
        ]
      };
      const validateFn = () => sealedFormSchema.validate(partialForm);
      await expect(validateFn()).rejects.toThrow(
        `Le transporteur saisi sur le bordereau (SIRET: ${company.siret}) n'est pas inscrit sur Trackdéchets` +
          " en tant qu'entreprise de transport. Cette entreprise ne peut donc pas être visée sur le bordereau." +
          " Veuillez vous rapprocher de l'administrateur de cette entreprise pour qu'il modifie le profil de" +
          " l'établissement depuis l'interface Trackdéchets dans Mes établissements"
      );
    });

    it("when foreign transporter is registered in Trackdéchets with wrong profile", async () => {
      const company = await companyFactory({
        companyTypes: ["PRODUCER"],
        orgId: "IT13029381004",
        vatNumber: "IT13029381004"
      });
      const partialForm: Partial<Form> & {
        transporters: Partial<BsddTransporter>[];
      } = {
        ...sealedForm,
        transporters: [
          {
            ...sealedForm.transporters[0],
            transporterCompanyVatNumber: company.vatNumber
          }
        ]
      };
      const validateFn = () => sealedFormSchema.validate(partialForm);
      await expect(validateFn()).rejects.toThrow(
        `Le transporteur saisi sur le bordereau (numéro de TVA: ${company.vatNumber}) n'est pas inscrit sur Trackdéchets` +
          " en tant qu'entreprise de transport. Cette entreprise ne peut donc pas être visée sur le bordereau." +
          " Veuillez vous rapprocher de l'administrateur de cette entreprise pour qu'il modifie le profil de" +
          " l'établissement depuis l'interface Trackdéchets dans Mes établissements"
      );
    });

    it("when recipientCompanySiret is not well formatted", async () => {
      const partialForm: Partial<Form> = {
        ...sealedForm,
        recipientCompanySiret: "123"
      };
      const validateFn = () => sealedFormSchema.validate(partialForm);
      await expect(validateFn()).rejects.toThrow(
        "Destinataire: 123 n'est pas un numéro de SIRET valide"
      );
    });

    it("when recipient is not registered in Trackdéchets", async () => {
      const partialForm: Partial<Form> = {
        ...sealedForm,
        recipientCompanySiret: "85001946400021"
      };
      const validateFn = () => sealedFormSchema.validate(partialForm);
      await expect(validateFn()).rejects.toThrow(
        "Destinataire : l'établissement avec le SIRET 85001946400021 n'est pas inscrit sur Trackdéchets"
      );
    });

    it("when recipient is registered in Trackdéchets with wrong profile", async () => {
      const company = await companyFactory({ companyTypes: ["PRODUCER"] });
      const partialForm: Partial<Form> = {
        ...sealedForm,
        recipientCompanySiret: company.siret
      };
      const validateFn = () => sealedFormSchema.validate(partialForm);
      await expect(validateFn()).rejects.toThrow(
        `L'installation de destination ou d’entreposage ou de reconditionnement avec le SIRET \"${company.siret}\" n'est` +
          " pas inscrite sur Trackdéchets en tant qu'installation de traitement ou de tri transit regroupement." +
          " Cette installation ne peut donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur" +
          " de cette installation pour qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets dans Mes établissements"
      );
    });

    it("when emitterIsForeignShip is true without emitterCompanyOmiNumber", async () => {
      const partialForm: Partial<Form> = {
        ...sealedForm,
        emitterIsForeignShip: true,
        emitterCompanySiret: null,
        emitterCompanyOmiNumber: null
      };
      const validateFn = () => sealedFormSchema.validate(partialForm);
      await expect(validateFn()).rejects.toThrow(
        "Émetteur: Le numéro OMI (Organisation maritime international) de l'entreprise est obligatoire"
      );
    });

    it("when emitterIsForeignShip and siret is defined", async () => {
      const partialForm: Partial<Form> = {
        ...sealedForm,
        emitterIsForeignShip: true,
        emitterCompanySiret: siret1,
        emitterCompanyOmiNumber: "OMI1234567"
      };
      const validateFn = () => sealedFormSchema.validate(partialForm);

      await expect(validateFn()).rejects.toThrow(
        "Émetteur : vous ne pouvez pas enregistrer un numéro de SIRET en cas d'émetteur navire étranger"
      );

      const isValid = await sealedFormSchema.isValid(partialForm);
      expect(isValid).toEqual(false);
    });

    it("when emitterIsForeignShip is true with invalid emitterCompanyOmiNumber", async () => {
      const partialForm: Partial<Form> = {
        ...sealedForm,
        emitterIsForeignShip: true,
        emitterCompanySiret: null,
        emitterCompanyOmiNumber: "foo"
      };
      const validateFn = () => sealedFormSchema.validate(partialForm);

      await expect(validateFn()).rejects.toThrow(
        "Émetteur: Le numéro OMI (Organisation maritime international) de l'entreprise doit se composer des trois lettres OMI suivies de 7 chiffres (ex. OMI1234567)"
      );

      const isValid = await sealedFormSchema.isValid(partialForm);
      expect(isValid).toEqual(false);
    });

    it("when emitterIsForeignShip and emitterIsPrivateIndividual both true", async () => {
      const partialForm: Partial<Form> = {
        ...sealedForm,
        emitterIsForeignShip: true,
        emitterCompanySiret: null,
        emitterIsPrivateIndividual: true,
        emitterCompanyOmiNumber: "OMI1234567"
      };
      const validateFn = () => sealedFormSchema.validate(partialForm);

      await expect(validateFn()).rejects.toThrow(
        "Émetteur: Impossible de définir un  numéro OMI avec un émetteur particulier"
      );

      const isValid = await sealedFormSchema.isValid(partialForm);
      expect(isValid).toEqual(false);
    });

    it("when emitterIsPrivateIndividual and siret is defined", async () => {
      const partialForm: Partial<Form> = {
        ...sealedForm,
        emitterIsPrivateIndividual: true,
        emitterCompanyContact: null,
        emitterCompanySiret: siret1
      };
      const validateFn = () => sealedFormSchema.validate(partialForm);

      await expect(validateFn()).rejects.toThrow(
        "Émetteur : vous ne pouvez pas renseigner de n°SIRET lorsque l'émetteur ou le détenteur est un particulier"
      );
    });

    it("when there is an eco-organisme but emitter type is not OTHER", async () => {
      const testForm = {
        ...sealedForm,
        emitterType: "PRODUCER",
        ecoOrganismeSiret: siretify(5),
        ecoOrganismeName: "Some eco-organisme"
      };

      const isValid = await sealedFormSchema
        .resolve({ value: testForm })
        .concat(ecoOrganismeSchema)
        .isValid(testForm);
      expect(isValid).toEqual(false);
    });

    it("when there is 1 citerne and another packaging", async () => {
      const testForm = {
        ...sealedForm,
        wasteDetailsPackagingInfos: [
          { type: "CITERNE", other: null, quantity: 1 },
          { type: "GRV", other: null, quantity: 1 }
        ]
      };

      const isValid = await sealedFormSchema.isValid(testForm);
      expect(isValid).toEqual(false);
    });

    it("when there is 1 benne and another packaging", async () => {
      const testForm = {
        ...sealedForm,
        wasteDetailsPackagingInfos: [
          { type: "BENNE", other: null, quantity: 1 },
          { type: "GRV", other: null, quantity: 1 }
        ]
      };

      const isValid = await sealedFormSchema.isValid(testForm);
      expect(isValid).toEqual(false);
    });

    it("when is NOT grouped and R0 is selected", async () => {
      expect.assertions(1);

      // Given
      const processedInfo = {
        ...sealedForm,
        processedAt: new Date(),
        processedBy: "John Snow",
        emitterType: EmitterType.APPENDIX1,
        recipientProcessingOperation: "R 0"
      };

      // When
      const validateFn = () => sealedFormSchema.validate(processedInfo);
      try {
        await validateFn();
      } catch (err) {
        // Then
        expect(err.errors).toEqual([
          "Destination : Cette opération d’élimination / valorisation n'existe pas."
        ]);
      }
    });

    it("when the transporterCompanyVatNumber is invalid", async () => {
      const partialForm: Partial<Form> & {
        transporters: Partial<BsddTransporter>[];
      } = {
        ...sealedForm,
        transporters: [
          {
            ...sealedForm.transporters[0],
            transporterCompanyVatNumber: "invalid"
          }
        ]
      };
      const validateFn = () => sealedFormSchema.validate(partialForm);

      await expect(validateFn()).rejects.toThrow(
        "Transporteur: invalid n'est pas un numéro de TVA valide"
      );
    });

    it("when the transporterCompanyVatNumber is FR", async () => {
      const partialForm: Partial<Form> & {
        transporters: Partial<BsddTransporter>[];
      } = {
        ...sealedForm,
        transporters: [
          {
            ...sealedForm.transporters[0],
            transporterCompanySiret: null,
            transporterCompanyVatNumber: "FR35552049447"
          }
        ]
      };
      const validateFn = () => sealedFormSchema.validate(partialForm);

      await expect(validateFn()).rejects.toThrow(
        "Transporteur : Impossible d'utiliser le numéro de TVA pour un établissement français, veuillez renseigner son SIRET uniquement"
      );
    });

    it("when parcel number coordinate is out of range", async () => {
      const partialForm: Partial<Form> = {
        ...sealedForm,
        wasteDetailsParcelNumbers: [
          { city: "Paris", postalCode: "75018", x: 100, y: 0 }
        ]
      };
      const validateFn = () => sealedFormSchema.validate(partialForm);
      await expect(validateFn()).rejects.toThrow(
        "Parcelle: la coordonnée X doit être inférieure ou égale à 90"
      );
    });

    it("when parcel number coordinate has too many decimals", async () => {
      const partialForm: Partial<Form> = {
        ...sealedForm,
        wasteDetailsParcelNumbers: [
          { city: "Paris", postalCode: "75018", x: 5.1234567, y: 5 }
        ]
      };
      const validateFn = () => sealedFormSchema.validate(partialForm);
      await expect(validateFn()).rejects.toThrow(
        "La coordonnée ne peut pas avoir plus de 6 décimales"
      );
    });
  });

  describe("Emitter transports own waste", () => {
    it("allowed if exemption", async () => {
      const partialForm: Partial<Form> & {
        transporters: Partial<BsddTransporter>[];
      } = {
        ...sealedForm,
        transporters: [
          {
            ...sealedForm.transporters[0],
            transporterCompanySiret: sealedForm.emitterCompanySiret,
            transporterIsExemptedOfReceipt: true
          }
        ]
      };

      expect.assertions(1);

      const isValid = await sealedFormSchema.isValid(partialForm);

      expect(isValid).toBe(true);
    });

    it("NOT allowed if no exemption", async () => {
      const partialForm: Partial<Form> & {
        transporters: Partial<BsddTransporter>[];
      } = {
        ...sealedForm,
        transporters: [
          {
            ...sealedForm.transporters[0],
            transporterCompanySiret: sealedForm.emitterCompanySiret,
            transporterIsExemptedOfReceipt: false
          }
        ]
      };

      expect.assertions(1);

      const isValid = await sealedFormSchema.isValid(partialForm);

      expect(isValid).toBe(false);
    });
  });
});

describe("beforeTransportSchema", () => {
  let beforeTransportForm: Partial<Form> & {
    transporters: Partial<BsddTransporter>[];
  };

  let transporterCompany;

  afterAll(resetDatabase);
  beforeAll(async () => {
    const emitterCompany = await companyFactory({
      companyTypes: ["PRODUCER"]
    });

    transporterCompany = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });

    const destinationCompany = await companyFactory({
      companyTypes: ["WASTEPROCESSOR"]
    });
    beforeTransportForm = {
      ...formData,
      emitterCompanySiret: emitterCompany.siret,
      recipientCompanySiret: destinationCompany.siret,
      transporters: [
        {
          ...transporterData,
          transporterCompanySiret: transporterCompany.siret
        }
      ]
    };
  });

  it("should not be valid when there is no receipt exemption and no receipt", async () => {
    const testForm = {
      ...beforeTransportForm,
      transporters: [
        {
          ...beforeTransportForm.transporters[0],
          transporterIsExemptedOfReceipt: false,
          transporterReceipt: null
        }
      ]
    };

    const validateFn = () =>
      beforeTransportSchemaFn({
        signingTransporterOrgId:
          testForm.transporters[0].transporterCompanySiret
      }).validate(testForm);

    await expect(validateFn()).rejects.toThrow(REQUIRED_RECEIPT_NUMBER);
  });

  it("transporter SIRET is optional when a valid foreign vatNumber is present", async () => {
    const transporterCompany = await companyFactory({
      vatNumber: "BE0541696005"
    });

    const testForm: Partial<Form> & {
      transporters: Partial<BsddTransporter>[];
    } = {
      ...beforeTransportForm,
      transporters: [
        {
          ...beforeTransportForm.transporters[0],
          transporterCompanySiret: null,
          transporterCompanyVatNumber: null
        }
      ]
    };
    expect(
      await beforeTransportSchemaFn({
        signingTransporterOrgId: transporterCompany.vatNumber
      }).isValid(testForm)
    ).toEqual(true);
  });

  it("transporter vatNumber is optional when a valid SIRET is present", async () => {
    const transporterCompany = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });

    const testForm: Partial<Form> & {
      transporters: Partial<BsddTransporter>[];
    } = {
      ...beforeTransportForm,
      transporters: [
        {
          ...beforeTransportForm.transporters[0],
          transporterCompanySiret: transporterCompany.siret,
          transporterCompanyVatNumber: null
        }
      ]
    };
    expect(
      await beforeTransportSchemaFn({
        signingTransporterOrgId: transporterCompany.siret
      }).isValid(testForm)
    ).toEqual(true);
  });

  it("transporter SIRET is required with a french vatNumber", async () => {
    const testForm: Partial<Form> & {
      transporters: Partial<BsddTransporter>[];
    } = {
      ...beforeTransportForm,
      transporters: [
        {
          ...beforeTransportForm.transporters[0],
          transporterCompanySiret: null,
          transporterCompanyVatNumber: "FR87850019464"
        }
      ]
    };
    const validateFn = () =>
      beforeTransportSchemaFn({
        signingTransporterOrgId: "FR87850019464"
      }).validate(testForm);

    await expect(validateFn()).rejects.toThrow(
      "Transporteur : Impossible d'utiliser le numéro de TVA pour un établissement français, veuillez renseigner son SIRET uniquement"
    );
  });

  it("transporter vatNumber should be valid", async () => {
    const testForm: Partial<Form> & {
      transporters: Partial<BsddTransporter>[];
    } = {
      ...beforeTransportForm,
      transporters: [
        {
          ...beforeTransportForm.transporters[0],
          transporterCompanySiret: null,
          transporterCompanyVatNumber: "invalid"
        }
      ]
    };

    const validateFn = () =>
      beforeTransportSchemaFn({ signingTransporterOrgId: "invalid" }).validate(
        testForm
      );

    await expect(validateFn()).rejects.toThrow(
      "Transporteur: invalid n'est pas un numéro de TVA valide"
    );
  });

  it("transporter plate is required if transporter mode is ROAD", async () => {
    const testForm: Partial<Form> & {
      transporters: Partial<BsddTransporter>[];
    } = {
      ...beforeTransportForm,
      transporters: [
        {
          ...transporterData,
          transporterTransportMode: "ROAD",
          transporterNumberPlate: undefined
        }
      ]
    };
    const validateFn = () =>
      beforeTransportSchemaFn({
        signingTransporterOrgId: transporterData.transporterCompanySiret
      }).validate(testForm);

    await expect(validateFn()).rejects.toThrow(
      "La plaque d'immatriculation est requise"
    );
  });

  it("transporter plate is required if transporter mode is ROAD - empty string", async () => {
    const testForm: Partial<Form> & {
      transporters: Partial<BsddTransporter>[];
    } = {
      ...beforeTransportForm,
      transporters: [
        {
          ...transporterData,
          transporterTransportMode: "ROAD",
          transporterNumberPlate: ""
        }
      ]
    };
    const validateFn = () =>
      beforeTransportSchemaFn({
        signingTransporterOrgId: transporterData.transporterCompanySiret
      }).validate(testForm);

    await expect(validateFn()).rejects.toThrow(
      "La plaque d'immatriculation est requise"
    );
  });

  it("transporter plate is required if transporter mode is ROAD - too short", async () => {
    const testForm: Partial<Form> & {
      transporters: Partial<BsddTransporter>[];
    } = {
      ...beforeTransportForm,
      transporters: [
        {
          ...transporterData,
          transporterTransportMode: "ROAD",
          transporterNumberPlate: "ab"
        }
      ]
    };
    const validateFn = () =>
      beforeTransportSchemaFn({
        signingTransporterOrgId: transporterData.transporterCompanySiret
      }).validate(testForm);

    await expect(validateFn()).rejects.toThrow(
      "Le numéro d'immatriculation doit faire entre 4 et 12 caractères"
    );
  });

  it("transporter plate is required if transporter mode is ROAD - too long", async () => {
    const testForm: Partial<Form> & {
      transporters: Partial<BsddTransporter>[];
    } = {
      ...beforeTransportForm,
      transporters: [
        {
          ...transporterData,
          transporterTransportMode: "ROAD",
          transporterNumberPlate: "abcdefghijklm"
        }
      ]
    };
    const validateFn = () =>
      beforeTransportSchemaFn({
        signingTransporterOrgId: transporterData.transporterCompanySiret
      }).validate(testForm);

    await expect(validateFn()).rejects.toThrow(
      "Le numéro d'immatriculation doit faire entre 4 et 12 caractères"
    );
  });

  it("transporter plate is required if transporter mode is ROAD - 2 plates provided", async () => {
    const testForm: Partial<Form> & {
      transporters: Partial<BsddTransporter>[];
    } = {
      ...beforeTransportForm,
      transporters: [
        {
          ...transporterData,
          transporterCompanySiret: transporterCompany.siret,
          transporterTransportMode: "ROAD",
          transporterNumberPlate: "AZ-12-TY, TY-LK-34"
        }
      ]
    };
    const validateFn = () =>
      beforeTransportSchemaFn({
        signingTransporterOrgId: transporterData.transporterCompanySiret
      }).validate(testForm);

    const isValid = await validateFn();

    expect(isValid).toBeTruthy();
  });

  it("transporter plate is required if transporter mode is ROAD - too many plates", async () => {
    const testForm: Partial<Form> & {
      transporters: Partial<BsddTransporter>[];
    } = {
      ...beforeTransportForm,
      transporters: [
        {
          ...transporterData,
          transporterCompanySiret: transporterCompany.siret,
          transporterTransportMode: "ROAD",
          transporterNumberPlate: "AZ-12-TY, TY-LK-34, QS-23-TY"
        }
      ]
    };
    const validateFn = () =>
      beforeTransportSchemaFn({
        signingTransporterOrgId: transporterData.transporterCompanySiret
      }).validate(testForm);

    await expect(validateFn()).rejects.toThrow(
      "Un maximum de 2 plaques d'immatriculation est accepté"
    );
  });

  it("transporter plate is required if transporter mode is ROAD - only whitespace", async () => {
    const testForm: Partial<Form> & {
      transporters: Partial<BsddTransporter>[];
    } = {
      ...beforeTransportForm,
      createdAt: new Date("2025-01-10T00:00:00Z"),
      transporters: [
        {
          ...transporterData,
          transporterTransportMode: "ROAD",
          transporterNumberPlate: "      "
        }
      ]
    };
    const validateFn = () =>
      beforeTransportSchemaFn({
        signingTransporterOrgId: transporterData.transporterCompanySiret
      }).validate(testForm);

    await expect(validateFn()).rejects.toThrow(
      "Le numéro de plaque fourni est incorrect"
    );
  });

  it("transporter plate is not required if transport mode is not ROAD", async () => {
    const testForm: Partial<Form> & {
      transporters: Partial<BsddTransporter>[];
    } = {
      ...beforeTransportForm,
      transporters: [
        {
          ...transporterData,
          transporterTransportMode: "AIR",
          transporterNumberPlate: ""
        }
      ]
    };
    const isValid = beforeTransportSchemaFn({
      signingTransporterOrgId: transporterData.transporterCompanySiret
    }).isValid(testForm);

    expect(isValid).toBeTruthy();
  });

  it("transporter receipt is not required if transport mode is not ROAD", async () => {
    const testForm: Partial<Form> & {
      transporters: Partial<BsddTransporter>[];
    } = {
      ...beforeTransportForm,
      transporters: [
        {
          ...transporterData,
          transporterTransportMode: "AIR",
          transporterReceipt: "",
          transporterDepartment: "",
          transporterValidityLimit: null
        }
      ]
    };
    const isValid = beforeTransportSchemaFn({
      signingTransporterOrgId: transporterData.transporterCompanySiret
    }).isValid(testForm);

    expect(isValid).toBeTruthy();
  });

  it("should work if transport mode is ROAD & plates are defined", async () => {
    const testForm: Partial<Form> & {
      transporters: Partial<BsddTransporter>[];
    } = {
      ...beforeTransportForm,
      transporters: [
        {
          ...transporterData,
          transporterTransportMode: "ROAD",
          transporterNumberPlate: "AZ-45-TR"
        }
      ]
    };
    const isValid = beforeTransportSchemaFn({
      signingTransporterOrgId: transporterData.transporterCompanySiret
    }).isValid(testForm);

    expect(isValid).toBeTruthy();
  });
});

describe("receivedInfosSchema", () => {
  describe("waste is accepted", () => {
    const receivedInfo: ReceivedFormInput = {
      wasteAcceptationStatus: "ACCEPTED",
      quantityReceived: 12.5,
      quantityRefused: 0,
      wasteRefusalReason: "",
      receivedBy: "Jim",
      receivedAt: new Date("2020-01-17T10:12:00+0100"),
      signedAt: new Date("2020-01-17T10:12:00+0100")
    };

    it("should be valid when waste is accepted", async () => {
      const isValid = await receivedInfoSchema.isValid(receivedInfo);
      expect(isValid).toEqual(true);
    });

    it("should be invalid when quantity received is 0", async () => {
      const validateFn = () =>
        receivedInfoSchema.validate({
          ...receivedInfo,
          quantityReceived: 0
        });
      await expect(validateFn()).rejects.toThrow(
        "Réception : le poids doit être supérieur à 0 lorsque le déchet est accepté ou accepté partiellement"
      );
    });
  });

  describe("waste is refused", () => {
    const receivedInfo: ReceivedFormInput = {
      wasteAcceptationStatus: "REFUSED",
      quantityReceived: 10,
      quantityRefused: 10,
      wasteRefusalReason: "non conformity",
      receivedBy: "Joe",
      receivedAt: new Date("2020-01-17T10:12:00+0100"),
      signedAt: new Date("2020-01-17T10:12:00+0100")
    };

    it("should be valid when waste is refused", async () => {
      const isValid = await receivedInfoSchema.isValid(receivedInfo);
      expect(isValid).toEqual(true);
    });

    it("should be invalid if wasteRefusalReason is missing", async () => {
      const validateFn = () =>
        receivedInfoSchema.validate({
          ...receivedInfo,
          wasteRefusalReason: null
        });
      await expect(validateFn()).rejects.toThrow(
        "Vous devez saisir un motif de refus"
      );
    });
  });

  describe("waste is partially refused", () => {
    const receivedInfo: ReceivedFormInput = {
      wasteAcceptationStatus: "PARTIALLY_REFUSED",
      quantityReceived: 11,
      quantityRefused: 6,
      wasteRefusalReason: "mixed waste",
      receivedBy: "Bill",
      receivedAt: new Date("2020-01-17T10:12:00+0100"),
      signedAt: new Date("2020-01-17T10:12:00+0100")
    };

    it("should be valid when waste is partially refused", async () => {
      const isValid = await receivedInfoSchema.isValid(receivedInfo);
      expect(isValid).toEqual(true);
    });

    it("should be invalid if wasteRefusalReason is missing", async () => {
      const validateFn = () =>
        receivedInfoSchema.validate({
          ...receivedInfo,
          wasteRefusalReason: null
        });
      await expect(validateFn()).rejects.toThrow(
        "Vous devez saisir un motif de refus"
      );
    });

    // TODO: can no longer be tested because error on quantityRefused pops first
    // it("should be invalid when quantity received is 0", async () => {
    //   const validateFn = () =>
    //     receivedInfoSchema.validate({
    //       ...receivedInfo,
    //       quantityReceived: 0,
    //       quantityRefused: 0
    //     });
    //   await expect(validateFn()).rejects.toThrow(
    //     "Réception : le poids doit être supérieur à 0 lorsque le déchet est accepté ou accepté partiellement"
    //   );
    // });
  });

  describe("quantityRefused", () => {
    const form = {
      receivedBy: "Bill",
      createdAt: new Date("2025-03-20T10:12:00+0100"),
      receivedAt: new Date("2020-01-17T10:12:00+0100"),
      signedAt: new Date("2020-01-17T10:12:00+0100")
    };

    it("quantityRefused is NOT required for legacy BSDs", async () => {
      // Given
      const update = {
        ...form,
        createdAt: new Date("2025-02-20T10:12:00+0100"),
        wasteAcceptationStatus: "PARTIALLY_REFUSED",
        wasteRefusalReason: "Reason",
        quantityReceived: 10
      };

      // When
      const isValid = await receivedInfoSchema.validate(update);

      // Then
      expect(isValid).toBeTruthy();
    });

    it("quantityRefused is required if wasteAcceptationStatus + quantityReceived (PARTIALLY_REFUSED)", async () => {
      // Given
      const update = {
        ...form,
        wasteAcceptationStatus: "PARTIALLY_REFUSED",
        wasteRefusalReason: "Reason",
        quantityReceived: 10
      };

      // When
      const validateFn = () => receivedInfoSchema.validate(update);

      // Then
      await expect(validateFn()).rejects.toThrow(
        "La quantité refusée (quantityRefused) est requise"
      );
    });

    it("quantityRefused is required if wasteAcceptationStatus + quantityReceived (ACCEPTED)", async () => {
      // Given
      const update = {
        ...form,
        wasteAcceptationStatus: "ACCEPTED",
        quantityReceived: 10
      };

      // When
      const validateFn = () => receivedInfoSchema.validate(update);

      // Then
      await expect(validateFn()).rejects.toThrow(
        "La quantité refusée (quantityRefused) est requise"
      );
    });

    it("quantityRefused is required if wasteAcceptationStatus + quantityReceived (REFUSED)", async () => {
      // Given
      const update = {
        ...form,
        wasteAcceptationStatus: "REFUSED",
        wasteRefusalReason: "Because",
        quantityReceived: 10
      };

      // When
      const validateFn = () => receivedInfoSchema.validate(update);

      // Then
      await expect(validateFn()).rejects.toThrow(
        "La quantité refusée (quantityRefused) est requise"
      );
    });

    it("quantityRefused can be 0 if waste is REFUSED and quantityReceived = 0", async () => {
      // Given
      const update = {
        ...form,
        wasteAcceptationStatus: "REFUSED",
        wasteRefusalReason: "Because",
        quantityReceived: 0,
        quantityRefused: 0
      };

      // When
      const isValid = await receivedInfoSchema.validate(update);

      // Then
      expect(isValid).toBeTruthy();
    });

    it("quantityRefused cannot be defined if quantityReceived is not", async () => {
      // Given
      const update = {
        ...form,
        quantityRefused: 10
      };

      // When
      const validateFn = () => receivedInfoSchema.validate(update);

      // Then
      await expect(validateFn()).rejects.toThrow(
        "La quantité refusée (quantityRefused) ne peut être définie si la quantité reçue (quantityReceived) ne l'est pas"
      );
    });

    it("waste is ACCEPTED > quantityReceived = 10 > quantityRefused must equal 0", async () => {
      // Given
      const update = {
        ...form,
        wasteAcceptationStatus: "ACCEPTED",
        quantityReceived: 10,
        quantityRefused: 0
      };

      // When
      const isValid = await receivedInfoSchema.validate(update);

      // Then
      expect(isValid).toBeTruthy();
    });

    it.each([5, 10, 15])(
      "waste is ACCEPTED > quantityReceived = 10 > quantityRefused can NOT be %p",
      async quantityRefused => {
        // Given
        const update = {
          ...form,
          wasteAcceptationStatus: "ACCEPTED",
          quantityReceived: 10,
          quantityRefused
        };

        // When
        const validateFn = () => receivedInfoSchema.validate(update);

        // Then
        await expect(validateFn()).rejects.toThrow(
          "La quantité refusée (quantityRefused) ne peut être supérieure à zéro si le déchet est accepté (ACCEPTED)"
        );
      }
    );

    it("waste is REFUSED > quantityReceived = 10 > quantityRefused must be quantityReceived", async () => {
      // Given
      const update = {
        ...form,
        wasteAcceptationStatus: "REFUSED",
        wasteRefusalReason: "Reason",
        quantityReceived: 10,
        quantityRefused: 10
      };

      // When
      const isValid = await receivedInfoSchema.validate(update);

      // Then
      expect(isValid).toBeTruthy();
    });

    it.each([0, 3, 15])(
      "waste is REFUSED > quantityReceived = 10 > quantityRefused can NOT be %p",
      async quantityRefused => {
        // Given
        const update = {
          ...form,
          wasteAcceptationStatus: "REFUSED",
          wasteRefusalReason: "Reason",
          quantityReceived: 10,
          quantityRefused
        };

        // When
        const validateFn = () => receivedInfoSchema.validate(update);

        // Then
        await expect(validateFn()).rejects.toThrow(
          "La quantité refusée (quantityRefused) doit être égale à la quantité reçue (quantityReceived) si le déchet est refusé (REFUSED)"
        );
      }
    );

    it.each([0, 10, 15])(
      "waste is PARTIALLY_REFUSED > quantityReceived = 10 > quantityRefused can NOT be %p",
      async quantityRefused => {
        // Given
        const update = {
          ...form,
          wasteAcceptationStatus: "PARTIALLY_REFUSED",
          wasteRefusalReason: "Reason",
          quantityReceived: 10,
          quantityRefused
        };

        // When
        const validateFn = () => receivedInfoSchema.validate(update);

        // Then
        await expect(validateFn()).rejects.toThrow(
          "La quantité refusée (quantityRefused) doit être inférieure à la quantité reçue (quantityReceived) et supérieure à zéro si le déchet est partiellement refusé (PARTIALLY_REFUSED)"
        );
      }
    );

    it.each([1, 5, 9.99])(
      "waste is PARTIALLY_REFUSED > quantityReceived = 10 > quantityRefused can be %p",
      async quantityRefused => {
        // Given
        const update = {
          ...form,
          wasteAcceptationStatus: "PARTIALLY_REFUSED",
          wasteRefusalReason: "Reason",
          quantityReceived: 10,
          quantityRefused
        };

        // When
        const isValid = await receivedInfoSchema.validate(update);

        // Then
        expect(isValid).toBeTruthy();
      }
    );

    it("quantityRefused must be positive", async () => {
      // Given
      const update = {
        ...form,
        wasteAcceptationStatus: "PARTIALLY_REFUSED",
        wasteRefusalReason: "Reason",
        quantityReceived: 10,
        quantityRefused: -5
      };

      // When
      const validateFn = () => receivedInfoSchema.validate(update);

      // Then
      await expect(validateFn()).rejects.toThrow(
        "quantityRefused must be greater than or equal to 0"
      );
    });
  });
});

describe("draftFormSchema", () => {
  const form: Partial<Form & BsddTransporter> = {
    emitterCompanySiret: "",
    recipientCompanySiret: "",
    transporterCompanySiret: "",
    emitterCompanyMail: "",
    recipientCompanyMail: "",
    wasteDetailsCode: "",
    transporterCompanyMail: "",
    transporterValidityLimit: new Date()
  };

  it("should be valid when passing empty strings", async () => {
    const isValid = await draftFormSchema.isValid(form);
    expect(isValid).toBe(true);
  });

  it("should be valid when passing null values", async () => {
    const form = {
      emitterCompanySiret: null,
      recipientCompanySiret: null,
      transporterCompanySiret: null,
      emitterCompanyMail: null,
      recipientCompanyMail: null,
      wasteDetailsCode: null,
      transporterCompanyMail: null,
      transporterValidityLimit: null
    };
    const isValid = await draftFormSchema.isValid(form);

    expect(isValid).toBe(true);
  });

  it("should be valid when passing undefined values", async () => {
    const isValid = await draftFormSchema.isValid({});

    expect(isValid).toBe(true);
  });

  it("should not be valid when passing an invalid siret", async () => {
    const validateFn = () =>
      draftFormSchema.validate({
        ...form,
        emitterCompanySiret: "this is not a siret"
      });

    await expect(validateFn()).rejects.toThrow(
      "Émetteur: this is not a siret n'est pas un numéro de SIRET valide"
    );
  });

  it("should be invalid when passing an invalid waste code", async () => {
    const validateFn = () =>
      draftFormSchema.validate({
        ...form,
        wasteDetailsCode: "this is not a waste cde"
      });

    await expect(validateFn()).rejects.toThrow(
      "Le code déchet n'est pas reconnu comme faisant partie de la liste officielle du code de l'environnement."
    );
  });

  it("should be invalid when passing an invalid email", async () => {
    const validateFn = () =>
      draftFormSchema.validate({
        ...form,
        emitterCompanyMail: "this is not an email"
      });

    await expect(validateFn()).rejects.toThrow(
      "emitterCompanyMail must be a valid email"
    );
  });

  it("should be invalid when passing a parcelNumber with unknown properties", async () => {
    const validateFn = () =>
      draftFormSchema.validate({
        ...form,
        wasteDetailsParcelNumbers: [
          {
            foo: "bar"
          }
        ]
      });

    await expect(validateFn()).rejects.toThrow(
      "Parcelle: impossible d'avoir à la fois des coordonnées GPS et un numéro de parcelle"
    );
  });

  it("should be invalid when passing a parcelNumber with no city and postal code", async () => {
    const validateFn = () =>
      draftFormSchema.validate({
        ...form,
        wasteDetailsParcelNumbers: [
          {
            x: 1.2,
            y: 1.3
          }
        ]
      });

    await expect(validateFn()).rejects.toThrow(
      "Parcelle: le code postal est obligatoire"
    );
  });

  it("should be invalid when passing a parcelNumber coordinate and number", async () => {
    const validateFn = () =>
      draftFormSchema.validate({
        ...form,
        wasteDetailsParcelNumbers: [
          {
            city: "Paris",
            postalCode: "750012",
            prefix: "000",
            section: "AB",
            number: "25",
            x: 1.2,
            y: 1.3
          }
        ]
      });

    await expect(validateFn()).rejects.toThrow(
      "Parcelle: impossible d'avoir à la fois des coordonnées GPS et un numéro de parcelle"
    );
  });

  it("should be valid when passing a null parcelNumber coordinate and number", async () => {
    const isValid = await draftFormSchema.isValid({
      ...form,
      wasteDetailsParcelNumbers: [
        {
          city: "Paris",
          postalCode: "750012",
          prefix: "000",
          section: "AB",
          number: "25",
          x: null,
          y: null
        }
      ]
    });

    expect(isValid).toBe(true);
  });

  it("should be valid when passing a parcelNumber coordinate and bull number", async () => {
    const isValid = await draftFormSchema.isValid({
      ...form,
      wasteDetailsParcelNumbers: [
        {
          city: "Paris",
          postalCode: "750012",
          prefix: null,
          section: null,
          number: null,
          x: 1.2,
          y: 1.3
        }
      ]
    });

    expect(isValid).toBe(true);
  });

  it("should be valid when passing a parcelNumber number", async () => {
    const isValid = await draftFormSchema.isValid({
      ...form,
      wasteDetailsParcelNumbers: [
        {
          city: "Paris",
          postalCode: "750012",
          prefix: "000",
          section: "AB",
          number: "25"
        }
      ]
    });

    expect(isValid).toBe(true);
  });

  it("should be valid when passing a parcelNumber coordinates", async () => {
    const isValid = await draftFormSchema.isValid({
      ...form,
      wasteDetailsParcelNumbers: [
        {
          city: "Paris",
          postalCode: "750012",
          x: 1.2,
          y: 1.3
        }
      ]
    });

    expect(isValid).toBe(true);
  });

  it("should be valid when passing a parcelNumber negative coordinates", async () => {
    const isValid = await draftFormSchema.isValid({
      ...form,
      wasteDetailsParcelNumbers: [
        {
          city: "Paris",
          postalCode: "750012",
          x: -1.2,
          y: -1.3
        }
      ]
    });

    expect(isValid).toBe(true);
  });

  it("should be invalid when passing an incomplete parcelNumber number", async () => {
    const validateFn = () =>
      draftFormSchema.validate({
        ...form,
        wasteDetailsParcelNumbers: [
          {
            city: "Paris",
            postalCode: "750012",
            prefix: "000",
            section: "AB"
          }
        ]
      });

    await expect(validateFn()).rejects.toThrow(
      "Parcelle: le numéro de parcelle est obligatoire"
    );
  });

  it("should be invalid when passing an incomplete parcelNumber coordinates", async () => {
    const validateFn = () =>
      draftFormSchema.validate({
        ...form,
        wasteDetailsParcelNumbers: [
          {
            city: "Paris",
            postalCode: "750012",
            x: 1.2
          }
        ]
      });

    await expect(validateFn()).rejects.toThrow(
      "Parcelle: la coordonnée Y est obligatoire"
    );
  });

  it("should be valid when emitterIsForeignShip with empty fields", async () => {
    const partialForm: Partial<Form> = {
      id: "cjplbvecc000d0766j32r19am",
      readableId: "BSD-20210101-AAAAAAAA",
      status: "DRAFT",
      emitterType: "PRODUCER",
      emitterIsForeignShip: true,
      emitterWorkSiteName: "",
      emitterWorkSiteAddress: "",
      emitterWorkSiteCity: "",
      emitterWorkSitePostalCode: "",
      emitterWorkSiteInfos: "",
      emitterCompanyName: "A company 2",
      emitterCompanyContact: "Emetteur",
      emitterCompanyPhone: "01",
      emitterCompanyAddress: "8 rue du Général de Gaulle",
      emitterCompanyMail: "e@e.fr",
      emitterCompanyOmiNumber: "OMI1234567",
      wasteDetailsCode: "01 03 04*",
      wasteDetailsOnuCode: "AAA",
      wasteDetailsPackagingInfos: [
        { type: "FUT", other: null, quantity: 1 },
        { type: "GRV", other: null, quantity: 1 }
      ],
      wasteDetailsQuantity: 1.5,
      wasteDetailsQuantityType: "REAL",
      wasteDetailsConsistence: "SOLID",
      wasteDetailsPop: false
    };
    const isValid = await draftFormSchema.isValid(partialForm);
    expect(isValid).toEqual(true);
  });

  it("packaging PIPELINE can be set without any other details", async () => {
    const isValid = await draftFormSchema.isValid({
      wasteDetailsPackagingInfos: [
        { type: "PIPELINE", numero: null, weight: null, volume: null }
      ]
    });

    expect(isValid).toEqual(true);
  });

  it("packaging PIPELINE cannot be set with any other packaging", async () => {
    const isValid = await draftFormSchema.isValid({
      wasteDetailsPackagingInfos: [
        { type: "PIPELINE", other: null, quantity: null },
        { type: "FUT", other: null, quantity: 1 }
      ]
    });

    expect(isValid).toEqual(false);
  });

  it("packaging PIPELINE cannot be set with a transporter", async () => {
    const validateFn = () =>
      draftFormSchema.validate({
        wasteDetailsPackagingInfos: [
          { type: "PIPELINE", numero: null, weight: null, volume: null }
        ],
        transporters: [{ transporterCompanySiret: siretify(1) }]
      });

    await expect(validateFn()).rejects.toThrow(
      "Vous ne devez pas spécifier de transporteur dans le cas d'un transport par pipeline"
    );
  });

  it("should not be valid when passing eco-organisme as emitter", async () => {
    const ecoOrganisme = await ecoOrganismeFactory({
      siret: siretify(),
      handle: { handleBsdd: true }
    });

    const partialForm: Partial<Form> = {
      emitterCompanySiret: ecoOrganisme.siret
    };
    const validateFn = () => draftFormSchema.validate(partialForm);

    await expect(validateFn()).rejects.toThrow(
      "L'émetteur ne peut pas être un éco-organisme."
    );
  });

  it("should be valid when passing non eco-organisme as emitter", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");

    const partialForm: Partial<Form> = {
      emitterCompanySiret: company.siret
    };
    const isValid = await draftFormSchema.isValid(partialForm);

    expect(isValid).toEqual(true);
  });
});

describe("processedInfoSchema", () => {
  it("noTraceability can be true when processing operation is groupement", async () => {
    const processedInfo = {
      processedBy: "John Snow",
      processedAt: new Date(),
      processingOperationDone: "D 13",
      processingOperationDescription: "Regroupement",
      noTraceability: true,
      nextDestinationProcessingOperation: "D 8",
      nextDestinationCompanyName: "Exutoire",
      nextDestinationCompanySiret: siretify(1),
      nextDestinationCompanyAddress: "4 rue du déchet",
      nextDestinationCompanyCountry: "FR",
      nextDestinationCompanyContact: "Arya Stark",
      nextDestinationCompanyPhone: "06 XX XX XX XX",
      nextDestinationCompanyMail: "arya.stark@trackdechets.fr"
    };
    expect(await processedInfoSchema.isValid(processedInfo)).toEqual(true);
  });

  it("noTraceability can be false when processing operation is groupement", async () => {
    const processedInfo = {
      processedBy: "John Snow",
      processedAt: new Date(),
      processingOperationDone: "D 13",
      processingOperationDescription: "Regroupement",
      noTraceability: false,
      nextDestinationProcessingOperation: "D 8",
      nextDestinationCompanyName: "Exutoire",
      nextDestinationCompanySiret: siretify(1),
      nextDestinationCompanyAddress: "4 rue du déchet",
      nextDestinationCompanyCountry: "FR",
      nextDestinationCompanyContact: "Arya Stark",
      nextDestinationCompanyPhone: "06 XX XX XX XX",
      nextDestinationCompanyMail: "arya.stark@trackdechets.fr"
    };
    expect(await processedInfoSchema.isValid(processedInfo)).toEqual(true);
  });

  it("noTraceability can be undefined when processing operation is groupement", async () => {
    const processedInfo = {
      processedBy: "John Snow",
      processedAt: new Date(),
      processingOperationDone: "D 13",
      processingOperationDescription: "Regroupement",
      nextDestinationProcessingOperation: "D 8",
      nextDestinationCompanyName: "Exutoire",
      nextDestinationCompanySiret: siretify(1),
      nextDestinationCompanyAddress: "4 rue du déchet",
      nextDestinationCompanyCountry: "FR",
      nextDestinationCompanyContact: "Arya Stark",
      nextDestinationCompanyPhone: "06 XX XX XX XX",
      nextDestinationCompanyMail: "arya.stark@trackdechets.fr"
    };
    expect(await processedInfoSchema.isValid(processedInfo)).toEqual(true);
  });

  it("noTraceability can be null when processing operation is groupement", async () => {
    const processedInfo = {
      processedBy: "John Snow",
      processedAt: new Date(),
      processingOperationDone: "D 13",
      processingOperationDescription: "Regroupement",
      noTraceability: false,
      nextDestinationProcessingOperation: "D 8",
      nextDestinationCompanyName: "Exutoire",
      nextDestinationCompanySiret: siretify(1),
      nextDestinationCompanyAddress: "4 rue du déchet",
      nextDestinationCompanyCountry: "FR",
      nextDestinationCompanyContact: "Arya Stark",
      nextDestinationCompanyPhone: "06 XX XX XX XX",
      nextDestinationCompanyMail: "arya.stark@trackdechets.fr"
    };
    expect(await processedInfoSchema.isValid(processedInfo)).toEqual(true);
  });

  it("nextDestinationCompany SIRET is required when no other identification is given", async () => {
    const processedInfo = {
      processedBy: "John Snow",
      processedAt: new Date(),
      processingOperationDone: "D 13",
      processingOperationDescription: "Regroupement",
      nextDestinationProcessingOperation: "D 8",
      nextDestinationCompanyName: "Exutoire",
      nextDestinationCompanyAddress: "4 rue du déchet",
      nextDestinationCompanyCountry: "FR",
      nextDestinationCompanyContact: "Arya Stark",
      nextDestinationCompanyPhone: "06 XX XX XX XX",
      nextDestinationCompanyMail: "arya.stark@trackdechets.fr"
    };
    const validateFn = () => processedInfoSchema.validate(processedInfo);

    await expect(validateFn()).rejects.toThrow(
      "Destination ultérieure : Le siret de l'entreprise est obligatoire (exactement un des identifiants obligatoire, un SIRET ou un numéro TVA intra-communautaire ou un identifiant d'un pays hors Union Européenne)"
    );
  });

  it("nextDestinationCompany return an error when SIRET is given and country is not FR", async () => {
    const processedInfo = {
      processedBy: "John Snow",
      processedAt: new Date(),
      processingOperationDone: "D 13",
      processingOperationDescription: "Regroupement",
      nextDestinationProcessingOperation: "D 8",
      nextDestinationCompanyName: "Exutoire",
      nextDestinationCompanyAddress: "4 rue du déchet",
      nextDestinationCompanySiret: siretify(1),
      nextDestinationCompanyCountry: "IE",
      nextDestinationCompanyContact: "Arya Stark",
      nextDestinationCompanyPhone: "06 XX XX XX XX",
      nextDestinationCompanyMail: "arya.stark@trackdechets.fr"
    };
    const validateFn = () => processedInfoSchema.validate(processedInfo);

    await expect(validateFn()).rejects.toThrow(
      "Destination ultérieure : le code du pays de l'entreprise ne peut pas être différent de FR"
    );
  });

  it("nextDestinationCompany return an error when a foreign VAT is given and country is FR", async () => {
    const processedInfo = {
      processedBy: "John Snow",
      processedAt: new Date(),
      processingOperationDone: "D 13",
      processingOperationDescription: "Regroupement",
      nextDestinationProcessingOperation: "D 8",
      nextDestinationCompanyName: "Exutoire",
      nextDestinationCompanyAddress: "4 rue du déchet",
      nextDestinationCompanyCountry: "FR",
      nextDestinationCompanyVatNumber: "BE0541696005",
      nextDestinationCompanyContact: "Arya Stark",
      nextDestinationCompanyPhone: "06 XX XX XX XX",
      nextDestinationCompanyMail: "arya.stark@trackdechets.fr"
    };
    const validateFn = () => processedInfoSchema.validate(processedInfo);

    await expect(validateFn()).rejects.toThrow(
      "Destination ultérieure : le code du pays de l'entreprise ne correspond pas au numéro de TVA entré"
    );
  });
  // NotificationNumber tests
  // non-UE company

  const testMatrix = [
    //  Traceability
    {
      // traceability, dangerous*, non EU country
      noTraceability: false,
      wasteDetailsCode: "07 07 07*",
      wasteDetailsPop: false,
      wasteDetailsIsDangerous: false,
      nextDestinationCompanyCountry: "BY",
      nextDestinationCompanyExtraEuropeanId: "BRU0541696005" // Non eu company
    },
    {
      // traceability, pop, non EU country
      noTraceability: false,
      wasteDetailsCode: "07 07 07",
      wasteDetailsPop: true,
      wasteDetailsIsDangerous: false,
      nextDestinationCompanyCountry: "BY",
      nextDestinationCompanyExtraEuropeanId: "BRU0541696005" // Non eu company
    },
    {
      // traceability, isDangerous, non EU country
      noTraceability: false,
      wasteDetailsCode: "07 07 07",
      wasteDetailsPop: false,
      wasteDetailsIsDangerous: true,
      nextDestinationCompanyCountry: "BY",
      nextDestinationCompanyExtraEuropeanId: "BRU0541696005" // Non eu company
    },
    // european countries
    {
      // traceability, dangerous*,  EU country
      noTraceability: false,
      wasteDetailsCode: "07 07 07*",
      wasteDetailsPop: false,
      wasteDetailsIsDangerous: false,
      nextDestinationCompanyCountry: "BE",
      nextDestinationCompanyVatNumber: "BE0541696005" // EU company
    },
    {
      // traceability, pop, EU country
      noTraceability: false,
      wasteDetailsCode: "07 07 07",
      wasteDetailsPop: true,
      wasteDetailsIsDangerous: false,
      nextDestinationCompanyCountry: "BE",
      nextDestinationCompanyVatNumber: "BE0541696005" // EU company
    },
    {
      // traceability,isDangerous, EU country
      noTraceability: false,
      wasteDetailsCode: "07 07 07",
      wasteDetailsPop: false,
      wasteDetailsIsDangerous: true,
      nextDestinationCompanyCountry: "BE",
      nextDestinationCompanyVatNumber: "BE0541696005" // EU company
    },
    // No Traceability
    {
      // no traceability, dangerous*,  EU country
      noTraceability: true,
      wasteDetailsCode: "07 07 07*",
      wasteDetailsPop: false,
      wasteDetailsIsDangerous: false,
      nextDestinationCompanyCountry: "BY",
      nextDestinationCompanyExtraEuropeanId: "BRU0541696005" // Non eu company
    },
    {
      // not traceability, pop, non EU country

      noTraceability: true,
      wasteDetailsCode: "07 07 07",
      wasteDetailsPop: true,
      wasteDetailsIsDangerous: false,
      nextDestinationCompanyCountry: "BY",
      nextDestinationCompanyExtraEuropeanId: "BRU0541696005" // Non eu company
    },
    {
      // not traceability, isDangerous, non EU country
      noTraceability: true,
      wasteDetailsCode: "07 07 07",
      wasteDetailsPop: false,
      wasteDetailsIsDangerous: true,
      nextDestinationCompanyCountry: "BY",
      nextDestinationCompanyExtraEuropeanId: "BRU0541696005" // Non eu company
    },
    // european countries
    {
      // no traceability, dangerous*,  EU country
      noTraceability: true,
      wasteDetailsCode: "07 07 07*",
      wasteDetailsPop: false,
      wasteDetailsIsDangerous: false,
      nextDestinationCompanyCountry: "BE",
      nextDestinationCompanyVatNumber: "BE0541696005" // EU company
    },
    {
      // no traceability, pop,  EU country
      noTraceability: true,
      wasteDetailsCode: "07 07 07",
      wasteDetailsPop: true,
      wasteDetailsIsDangerous: false,
      nextDestinationCompanyCountry: "BE",
      nextDestinationCompanyVatNumber: "BE0541696005" // EU company
    },
    {
      // no traceability, isDangerous,  EU country
      noTraceability: true,
      wasteDetailsCode: "07 07 07",
      wasteDetailsPop: false,
      wasteDetailsIsDangerous: true,
      nextDestinationCompanyCountry: "BE",
      nextDestinationCompanyVatNumber: "BE0541696005" // EU company
    }
  ];

  it.each(testMatrix)(
    "should throw when `nextDestinationNotificationNumber` is missing %o",
    async ({
      noTraceability,
      wasteDetailsCode,
      wasteDetailsPop,
      wasteDetailsIsDangerous,
      nextDestinationCompanyCountry,
      nextDestinationCompanyExtraEuropeanId = null,
      nextDestinationCompanyVatNumber = null
    }) => {
      const processedInfo = {
        processedBy: "John Snow",
        processedAt: new Date(),
        processingOperationDone: "D 13", // non final
        processingOperationDescription: "Regroupement",
        noTraceability,
        nextDestinationProcessingOperation: "D 8",
        nextDestinationCompanyName: "Exutoire",
        nextDestinationCompanyAddress: "4 rue du déchet",
        nextDestinationCompanyCountry,
        nextDestinationCompanyVatNumber,
        nextDestinationCompanyExtraEuropeanId,
        nextDestinationCompanyContact: "Arya Stark",
        nextDestinationCompanyPhone: "06 XX XX XX XX",
        nextDestinationCompanyMail: "arya.stark@trackdechets.fr",
        wasteDetailsCode,
        wasteDetailsPop,
        wasteDetailsIsDangerous
        // missing nextDestinationNotificationNumber
      };
      const validateFn = () => processedInfoSchema.validate(processedInfo);

      await expect(validateFn()).rejects.toThrow(
        "Destination ultérieure : le numéro de notification est obligatoire"
      );
    }
  );

  it("should also throw when `nextDestinationNotificationNumber` is null", async () => {
    const processedInfo = {
      processedBy: "John Snow",
      processedAt: new Date(),
      processingOperationDone: "D 13", // non final
      processingOperationDescription: "Regroupement",

      nextDestinationProcessingOperation: "D 8",
      nextDestinationCompanyName: "Exutoire",
      nextDestinationCompanyAddress: "4 rue du déchet",

      wasteDetailsCode: "07 07 07*",
      wasteDetailsPop: false,
      wasteDetailsIsDangerous: false,
      nextDestinationCompanyCountry: "BY",
      nextDestinationCompanyExtraEuropeanId: "BRU0541696005",

      nextDestinationCompanyContact: "Arya Stark",
      nextDestinationCompanyPhone: "06 XX XX XX XX",
      nextDestinationCompanyMail: "arya.stark@trackdechets.fr",

      nextDestinationNotificationNumber: null
    };
    const validateFn = () => processedInfoSchema.validate(processedInfo);

    await expect(validateFn()).rejects.toThrow(
      "Destination ultérieure : le numéro de notification est obligatoire"
    );
  });

  it.each(testMatrix)(
    "should pass when `nextDestinationNotificationNumber` is provided %o",
    async ({
      wasteDetailsCode,
      wasteDetailsPop,
      wasteDetailsIsDangerous,
      nextDestinationCompanyCountry,
      nextDestinationCompanyExtraEuropeanId = null,
      nextDestinationCompanyVatNumber = null
    }) => {
      const processedInfo = {
        processedBy: "John Snow",
        processedAt: new Date(),
        processingOperationDone: "D 13", // non final
        processingOperationDescription: "Regroupement",
        nextDestinationProcessingOperation: "D 8",
        nextDestinationCompanyName: "Exutoire",
        nextDestinationCompanyAddress: "4 rue du déchet",
        nextDestinationCompanyCountry,
        nextDestinationCompanyVatNumber,
        nextDestinationCompanyExtraEuropeanId,
        nextDestinationCompanyContact: "Arya Stark",
        nextDestinationCompanyPhone: "06 XX XX XX XX",
        nextDestinationCompanyMail: "arya.stark@trackdechets.fr",
        wasteDetailsCode,
        wasteDetailsPop,
        wasteDetailsIsDangerous,
        nextDestinationNotificationNumber: "xyz"
      };
      expect(await processedInfoSchema.isValid(processedInfo)).toEqual(true);
    }
  );

  it("nextDestinationCompany return an error when a foreign extraEuropeanId is given with a VAT number", async () => {
    const processedInfo = {
      processedBy: "John Snow",
      processedAt: new Date(),
      processingOperationDone: "D 13",
      processingOperationDescription: "Regroupement",
      nextDestinationProcessingOperation: "D 8",
      nextDestinationCompanyName: "Exutoire",
      nextDestinationCompanyAddress: "4 rue du déchet",
      nextDestinationCompanyVatNumber: "BE0541696005",
      nextDestinationCompanyExtraEuropeanId: "BRU0541696005",
      nextDestinationCompanyContact: "Arya Stark",
      nextDestinationCompanyPhone: "06 XX XX XX XX",
      nextDestinationCompanyMail: "arya.stark@trackdechets.fr"
    };
    const validateFn = () => processedInfoSchema.validate(processedInfo);

    await expect(validateFn()).rejects.toThrow(
      "Destination ultérieure : Le siret de l'entreprise est obligatoire (exactement un des identifiants obligatoire, un SIRET ou un numéro TVA intra-communautaire ou un identifiant d'un pays hors Union Européenne)"
    );
  });

  it("nextDestinationCompany return an error when a foreign extraEuropeanId is given with a SIRET number", async () => {
    const processedInfo = {
      processedBy: "John Snow",
      processedAt: new Date(),
      processingOperationDone: "D 13",
      processingOperationDescription: "Regroupement",
      nextDestinationProcessingOperation: "D 8",
      nextDestinationCompanyName: "Exutoire",
      nextDestinationCompanyAddress: "4 rue du déchet",
      nextDestinationCompanySiret: siretify(1),
      nextDestinationCompanyExtraEuropeanId: "BRU0541696005",
      nextDestinationCompanyContact: "Arya Stark",
      nextDestinationCompanyPhone: "06 XX XX XX XX",
      nextDestinationCompanyMail: "arya.stark@trackdechets.fr"
    };
    const validateFn = () => processedInfoSchema.validate(processedInfo);

    await expect(validateFn()).rejects.toThrow(
      "Destination ultérieure : Le siret de l'entreprise est obligatoire (exactement un des identifiants obligatoire, un SIRET ou un numéro TVA intra-communautaire ou un identifiant d'un pays hors Union Européenne)"
    );
  });

  it("noTraceability cannot be true when processing operation is not groupement", async () => {
    const processedInfo = {
      processedBy: "John Snow",
      processedAt: new Date(),
      processingOperationDone: "D 8",
      destinationOperationMode: OperationMode.ELIMINATION,
      processingOperationDescription: "Traitement biologique",
      noTraceability: true
    };
    const validateFn = () => processedInfoSchema.validate(processedInfo);

    await expect(validateFn()).rejects.toThrow(
      "Vous ne pouvez pas indiquer une rupture de traçabilité avec un code de traitement final"
    );
  });

  it("noTraceability can be false when processing operation is not groupement", async () => {
    const processedInfo = {
      processedBy: "John Snow",
      processedAt: new Date(),
      processingOperationDone: "D 8",
      destinationOperationMode: OperationMode.ELIMINATION,
      processingOperationDescription: "Traitement biologique",
      noTraceability: false
    };
    expect(await processedInfoSchema.isValid(processedInfo)).toEqual(true);
  });

  it("noTraceability can be undefined when processing operation is not groupement", async () => {
    const processedInfo = {
      processedBy: "John Snow",
      processedAt: new Date(),
      processingOperationDone: "D 8",
      destinationOperationMode: OperationMode.ELIMINATION,
      processingOperationDescription: "Traitement biologique"
    };
    expect(await processedInfoSchema.isValid(processedInfo)).toEqual(true);
  });

  it("noTraceability can be null when processing operation is not groupement", async () => {
    const processedInfo = {
      processedBy: "John Snow",
      processedAt: new Date(),
      processingOperationDone: "D 8",
      destinationOperationMode: OperationMode.ELIMINATION,
      processingOperationDescription: "Traitement biologique",
      noTraceability: null
    };
    expect(await processedInfoSchema.isValid(processedInfo)).toEqual(true);
  });

  it("SIRET for la poste is valid", async () => {
    const transporterCompany = await companyFactory({
      siret: "35600000040773",
      companyTypes: ["TRANSPORTER"]
    });
    const transporter = {
      transporterCompanyName: "la poste",
      transporterCompanySiret: transporterCompany.siret,
      transporterCompanyAddress: "paris",
      transporterCompanyContact: "Contact",
      transporterCompanyPhone: "00 00 00 00 00",
      transporterCompanyMail: "contact@laposte.com",
      transporterIsExemptedOfReceipt: true,
      transporterTransportMode: "RAIL"
    };
    const validateFn = () =>
      transporterSchemaFn({
        signingTransporterOrgId: transporter.transporterCompanySiret
      }).validate(transporter);

    await expect(validateFn()).resolves.toMatchObject({
      transporterCompanyAddress: "paris",
      transporterCompanyContact: "Contact",
      transporterCompanyMail: "contact@laposte.com",
      transporterCompanyName: "la poste",
      transporterCompanyPhone: "00 00 00 00 00",
      transporterCompanySiret: "35600000040773",
      transporterIsExemptedOfReceipt: true,
      transporterTransportMode: "RAIL"
    });
  });

  it("SIRET for any valid SIRET is valid", async () => {
    const transporterCompany = await companyFactory({
      siret: "35600000000048",
      companyTypes: ["TRANSPORTER"]
    });
    const transporter = {
      transporterCompanyName: "la poste siege",
      transporterCompanySiret: transporterCompany.siret,
      transporterCompanyAddress: "paris",
      transporterCompanyContact: "Contact",
      transporterCompanyPhone: "00 00 00 00 00",
      transporterCompanyMail: "contact@laposte.com",
      transporterIsExemptedOfReceipt: true,
      transporterTransportMode: "RAIL"
    };
    const validateFn = () =>
      transporterSchemaFn({
        signingTransporterOrgId: transporter.transporterCompanySiret
      }).validate(transporter);

    await expect(validateFn()).resolves.toMatchObject({
      transporterCompanyAddress: "paris",
      transporterCompanyContact: "Contact",
      transporterCompanyMail: "contact@laposte.com",
      transporterCompanyName: "la poste siege",
      transporterCompanyPhone: "00 00 00 00 00",
      transporterCompanySiret: transporterCompany.siret,
      transporterIsExemptedOfReceipt: true,
      transporterTransportMode: "RAIL"
    });
  });

  it("nextDestination should be defined when processing operation is groupement and noTraceability is false", async () => {
    const processedInfo = {
      processedBy: "John Snow",
      processedAt: new Date(),
      processingOperationDone: "D 13",
      processingOperationDescription: "Regroupement",
      noTraceability: false
    };

    expect.assertions(1);

    try {
      await processedInfoSchema.validate(processedInfo, { abortEarly: false });
    } catch (err) {
      expect(err.errors).toEqual([
        "Destination ultérieure : L'opération de traitement est obligatoire",
        "Destination ultérieure : Le nom de l'entreprise est obligatoire",
        "Destination ultérieure : L'adresse de l'entreprise est obligatoire",
        "Destination ultérieure : Le contact dans l'entreprise est obligatoire",
        "Destination ultérieure : Le téléphone de l'entreprise est obligatoire",
        "Destination ultérieure : L'email de l'entreprise est obligatoire",
        "Destination ultérieure : Le siret de l'entreprise est obligatoire (exactement un des identifiants obligatoire, un SIRET ou un numéro TVA intra-communautaire ou un identifiant d'un pays hors Union Européenne)"
      ]);
    }
  });

  it("nextDestination company info is optional when noTraceability is true", async () => {
    const processedInfo = {
      processedBy: "John Snow",
      processedAt: new Date(),
      processingOperationDone: "R 12",
      processingOperationDescription: "Regroupement",
      nextDestinationProcessingOperation: "R 1",
      noTraceability: true
    };
    expect(await processedInfoSchema.isValid(processedInfo)).toEqual(true);
  });

  it("nextDestination fields can be empty when noTraceability is true", async () => {
    const processedInfo = {
      processedBy: "John Snow",
      processedAt: new Date(),
      processingOperationDone: "R 12",
      processingOperationDescription: "Regroupement",
      noTraceability: true,
      nextDestinationProcessingOperation: "R 1",
      nextDestinationCompanyName: "",
      nextDestinationCompanySiret: "",
      nextDestinationCompanyAddress: "",
      nextDestinationCompanyContact: "",
      nextDestinationCompanyPhone: "",
      nextDestinationCompanyMail: ""
    };
    expect(await processedInfoSchema.isValid(processedInfo)).toEqual(true);
  });

  it("nextDestination processingOperation is required when noTraceability is true", async () => {
    const processedInfo = {
      processedBy: "John Snow",
      processedAt: new Date(),
      processingOperationDone: "R 12",
      processingOperationDescription: "Regroupement",
      noTraceability: true
    };
    const validateFn = () => processedInfoSchema.validate(processedInfo);

    await expect(validateFn()).rejects.toThrow(
      "Destination ultérieure : L'opération de traitement est obligatoire"
    );
  });

  describe("Operation modes", () => {
    it("should be valid if operationMode is compatible", async () => {
      const processedInfo = {
        nextDestination: null,
        noTraceability: null,
        processedAt: new Date(),
        processedBy: "Test",
        processingOperationDescription: "test",
        processingOperationDone: "R 2",
        destinationOperationMode: OperationMode.REUTILISATION
      };

      expect(await processedInfoSchema.isValid(processedInfo)).toEqual(true);
    });

    it("should be valid if operationMode is missing but step is not process", async () => {
      const receivedInfo: ReceivedFormInput = {
        wasteAcceptationStatus: "ACCEPTED",
        quantityReceived: 12.5,
        quantityRefused: 0,
        wasteRefusalReason: "",
        receivedBy: "Jim",
        receivedAt: new Date("2020-01-17T10:12:00+0100"),
        signedAt: new Date("2020-01-17T10:12:00+0100")
      };

      const bsdd = {
        nextDestination: null,
        noTraceability: null,
        processedAt: new Date(),
        processedBy: "Test",
        processingOperationDescription: "test",
        processingOperationDone: "R 2",
        destinationOperationMode: undefined, // Should be REUTILISATION
        ...receivedInfo
      };

      expect(await receivedInfoSchema.isValid(bsdd)).toEqual(true);
    });

    test.each([
      ["D8", "VALORISATION_ENERGETIQUE"], // correct mode is ELIMINATION
      ["D9", "VALORISATION_ENERGETIQUE"], // D9 has no associated mode
      ["R12", "VALORISATION_ENERGETIQUE"] // R12 has no associated mode
    ])(
      "should not be valid if operation mode is not compatible with operation code (mode: %p, code: %p)",
      async (code, mode) => {
        const processedInfo = {
          nextDestination: null,
          noTraceability: null,
          processedAt: new Date(),
          processedBy: "Test",
          processingOperationDescription: "test",
          processingOperationDone: code,
          destinationOperationMode: mode
        };

        const validateFn = () => processedInfoSchema.validate(processedInfo);

        await expect(validateFn()).rejects.toThrow(
          "Le mode de traitement n'est pas compatible avec l'opération de traitement choisie"
        );
      }
    );

    it("should not be valid if operationCode has potential operationModes associated and none is specified", async () => {
      const processedInfo = {
        nextDestination: null,
        noTraceability: null,
        processedAt: new Date(),
        processedBy: "Test",
        processingOperationDescription: "test",
        processingOperationDone: "R 2",
        destinationOperationMode: undefined
      };

      const validateFn = () => processedInfoSchema.validate(processedInfo);

      await expect(validateFn()).rejects.toThrow(
        "Vous devez préciser un mode de traitement"
      );
    });

    it.each(["D 9", "D 13"])(
      "should be valid if operationCode has no potential operationModes associated and none is specified",
      async code => {
        const processedInfo = {
          processedBy: "John Snow",
          processedAt: new Date(),
          processingOperationDone: code,
          processingOperationDescription: "test",
          noTraceability: false,
          nextDestinationProcessingOperation: "D 8",
          nextDestinationCompanyName: "Exutoire",
          nextDestinationCompanySiret: siretify(1),
          nextDestinationCompanyAddress: "4 rue du déchet",
          nextDestinationCompanyCountry: "FR",
          nextDestinationCompanyContact: "Arya Stark",
          nextDestinationCompanyPhone: "06 XX XX XX XX",
          nextDestinationCompanyMail: "arya.stark@trackdechets.fr"
        };

        expect(await processedInfoSchema.isValid(processedInfo)).toEqual(true);
      }
    );
  });

  describe("recipientSchemaFn", () => {
    it.each([false, null, undefined])(
      "recipientProcessingOperation must be defined if no temp storage and not draft (recipientIsTempStorage: %p)",
      async recipientIsTempStorage => {
        // Given
        const recipientCompany = await companyFactory({
          companyTypes: ["WASTEPROCESSOR", "COLLECTOR", "WASTEPROCESSOR"],
          collectorTypes: ["DANGEROUS_WASTES", "NON_DANGEROUS_WASTES"]
        });
        const recipient = {
          recipientCompanySiret: recipientCompany.siret,
          recipientCompanyName: recipientCompany.name,
          recipientCompanyAddress: "Test",
          recipientCompanyContact: "Test",
          recipientCompanyPhone: "06 00 00 00 00",
          recipientCompanyMail: recipientCompany.contactEmail,
          recipientProcessingOperation: undefined, // < Operation not defined
          recipientIsTempStorage
        };

        // Then
        expect.assertions(1);
        try {
          await recipientSchemaFn({ isDraft: false }).validate(recipient);
        } catch (err) {
          expect(err.message).toBe(
            "Opération d’élimination / valorisation est un champ requis et doit avoir une valeur"
          );
        }
      }
    );

    it.each([false, null, undefined])(
      "recipientProcessingOperation can be undefined if no temp storage and draft (recipientIsTempStorage: %p)",
      async recipientIsTempStorage => {
        // Given
        const recipientCompany = await companyFactory({
          companyTypes: ["WASTEPROCESSOR", "COLLECTOR", "WASTEPROCESSOR"],
          collectorTypes: ["DANGEROUS_WASTES", "NON_DANGEROUS_WASTES"]
        });
        const recipient = {
          recipientCompanySiret: recipientCompany.siret,
          recipientCompanyName: recipientCompany.name,
          recipientCompanyAddress: "Test",
          recipientCompanyContact: "Test",
          recipientCompanyPhone: "06 00 00 00 00",
          recipientCompanyMail: recipientCompany.contactEmail,
          recipientProcessingOperation: undefined, // < Operation not defined
          recipientIsTempStorage
        };

        // Then
        expect(
          await recipientSchemaFn({ isDraft: true }).isValid(recipient)
        ).toBeTruthy();
      }
    );

    it("recipientProcessingOperation can be undefined if temp storage and not draft", async () => {
      // Given
      const recipientCompany = await companyFactory({
        companyTypes: ["WASTEPROCESSOR", "COLLECTOR", "WASTEPROCESSOR"],
        collectorTypes: ["DANGEROUS_WASTES", "NON_DANGEROUS_WASTES"]
      });
      const recipient = {
        recipientCompanySiret: recipientCompany.siret,
        recipientCompanyName: recipientCompany.name,
        recipientCompanyAddress: "Test",
        recipientCompanyContact: "Test",
        recipientCompanyPhone: "06 00 00 00 00",
        recipientCompanyMail: recipientCompany.contactEmail,
        recipientProcessingOperation: undefined, // < Operation not defined
        recipientIsTempStorage: true
      };

      // Then
      expect(
        await recipientSchemaFn({ isDraft: false }).isValid(recipient)
      ).toBeTruthy();
    });

    it("no error if recipientProcessingOperation is defined and no temp storage and not draft", async () => {
      // Given
      const recipientCompany = await companyFactory({
        companyTypes: ["WASTEPROCESSOR", "COLLECTOR", "WASTEPROCESSOR"],
        collectorTypes: ["DANGEROUS_WASTES", "NON_DANGEROUS_WASTES"]
      });
      const recipient = {
        recipientCompanySiret: recipientCompany.siret,
        recipientCompanyName: recipientCompany.name,
        recipientCompanyAddress: "Test",
        recipientCompanyContact: "Test",
        recipientCompanyPhone: "06 00 00 00 00",
        recipientCompanyMail: recipientCompany.contactEmail,
        recipientProcessingOperation: "R 1", // < Defined
        recipientIsTempStorage: false
      };

      // Then
      expect(
        await recipientSchemaFn({ isDraft: false }).isValid(recipient)
      ).toBeTruthy();
    });
  });
});
