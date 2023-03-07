import { EmitterType, Form } from "@prisma/client";
import {
  draftFormSchema,
  sealedFormSchema,
  ecoOrganismeSchema,
  receivedInfoSchema,
  processedInfoSchema,
  transporterSchemaFn
} from "../validation";
import { ReceivedFormInput } from "../../generated/graphql/types";
import { companyFactory, siretify } from "../../__tests__/factories";
import { resetDatabase } from "../../../integration-tests/helper";

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
  transporterReceipt: "sdfg",
  transporterDepartment: "82",
  transporterValidityLimit: new Date("2018-12-11T00:00:00.000Z"),
  transporterCompanyName: "A company 4",
  transporterCompanySiret: siret3,
  transporterCompanyAddress: "8 rue du Général de Gaulle",
  transporterCompanyContact: "Transporteur",
  transporterCompanyPhone: "03",
  transporterCompanyMail: "t@t.fr",
  wasteDetailsCode: "16 06 01*",
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

describe("sealedFormSchema", () => {
  let sealedForm: Partial<Form>;

  afterAll(resetDatabase);
  beforeAll(async () => {
    const emitterCompany = await companyFactory({ companyTypes: ["PRODUCER"] });
    const transporterCompany = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });
    const destinationCompany = await companyFactory({
      companyTypes: ["WASTEPROCESSOR"]
    });
    sealedForm = {
      ...formData,
      emitterCompanySiret: emitterCompany.siret,
      transporterCompanySiret: transporterCompany.siret,
      recipientCompanySiret: destinationCompany.siret
    };
  });

  describe("form can be sealed", () => {
    test("when fully filled", async () => {
      const isValid = await sealedFormSchema.isValid(sealedForm);
      expect(isValid).toEqual(true);
    });

    test("with empty strings for optionnal fields", async () => {
      const testForm = {
        ...sealedForm,
        transporterNumberPlate: ""
      };
      const isValid = await sealedFormSchema.isValid(testForm);
      expect(isValid).toEqual(true);
    });

    test("with null values for optionnal fields", async () => {
      const testForm = {
        ...sealedForm,
        transporterNumberPlate: null
      };
      const isValid = await sealedFormSchema.isValid(testForm);
      expect(isValid).toEqual(true);
    });

    test("with transporter receipt exemption R.541-50 ticked and no transportation infos", async () => {
      const testForm = {
        ...sealedForm,
        transporterIsExemptedOfReceipt: true,
        transporterReceipt: null,
        transporterDepartment: null
      };

      const isValid = await sealedFormSchema.isValid(testForm);
      expect(isValid).toEqual(true);
    });

    test("with foreign transporter receipt no need for exemption R.541-50", async () => {
      const transporter = await companyFactory({
        orgId: "BE0541696005",
        vatNumber: "BE0541696005"
      });
      const testForm = {
        ...sealedForm,
        transporterCompanyVatNumber: transporter.vatNumber,
        transporterIsExemptedOfReceipt: null,
        transporterReceipt: null,
        transporterDepartment: null
      };
      delete testForm.transporterCompanySiret;
      const isValid = await sealedFormSchema.isValid(testForm);
      expect(isValid).toEqual(true);
      testForm.transporterIsExemptedOfReceipt = false;
      delete testForm.transporterCompanySiret;
      const isValid2 = await sealedFormSchema.isValid(testForm);
      expect(isValid2).toEqual(true);
    });

    test("when there is an eco-organisme and emitter type is OTHER", async () => {
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

    test("when there is no eco-organisme and emitter type is OTHER", async () => {
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

    test("when emitterIsForeignShip is true without emitter company siret", async () => {
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
    test("when emitterIsPrivateIndividual is true without emitter company siret", async () => {
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

    test("when is grouped and R0 is selected", async () => {
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

    test("when transporterVatNumber is defined and transporterCompanySiret is nullish", async () => {
      const transporter = await companyFactory({
        orgId: "ESA15022510",
        vatNumber: "ESA15022510"
      });
      const partialForm: Partial<Form> = {
        ...sealedForm,
        transporterCompanySiret: null,
        transporterCompanyVatNumber: transporter.vatNumber
      };
      await sealedFormSchema.validate(partialForm);
      const isValid = await sealedFormSchema.isValid(partialForm);
      expect(isValid).toEqual(true);
    });

    test("when there is 2 bennes", async () => {
      const testForm = {
        ...sealedForm,
        wasteDetailsPackagingInfos: [
          { type: "BENNE", other: null, quantity: 2 }
        ]
      };

      const isValid = await sealedFormSchema.isValid(testForm);
      expect(isValid).toEqual(true);
    });

    test("when there is 2 citernes", async () => {
      const testForm = {
        ...sealedForm,
        wasteDetailsPackagingInfos: [
          { type: "CITERNE", other: null, quantity: 2 }
        ]
      };

      const isValid = await sealedFormSchema.isValid(testForm);
      expect(isValid).toEqual(true);
    });

    test("when there is more than 2 bennes", async () => {
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

    test("when there is more than 2 citernes", async () => {
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

    test("when there is no waste details quantity", async () => {
      const testForm = {
        ...sealedForm,
        wasteDetailsQuantity: null
      };

      const isValid = await sealedFormSchema.isValid(testForm);
      expect(isValid).toEqual(false);
    });
  });

  describe("form cannot be sealed", () => {
    test("when emitterCompanySiret is not well formatted", async () => {
      const partialForm: Partial<Form> = {
        ...sealedForm,
        emitterCompanySiret: "123"
      };
      const validateFn = () => sealedFormSchema.validate(partialForm);
      await expect(validateFn()).rejects.toThrow(
        "Émetteur: 123 n'est pas un numéro de SIRET valide"
      );
    });

    test("when transporterCompanySiret is not well formatted", async () => {
      const partialForm: Partial<Form> = {
        ...sealedForm,
        transporterCompanySiret: "123"
      };
      const validateFn = () => sealedFormSchema.validate(partialForm);
      await expect(validateFn()).rejects.toThrow(
        "Transporteur: 123 n'est pas un numéro de SIRET valide"
      );
    });

    test("when transporter is not registered in Trackdéchets", async () => {
      const partialForm: Partial<Form> = {
        ...sealedForm,
        transporterCompanySiret: "85001946400021"
      };
      const validateFn = () => sealedFormSchema.validate(partialForm);
      await expect(validateFn()).rejects.toThrow(
        "Transporteur : l'établissement avec le SIRET 85001946400021 n'est pas inscrit sur Trackdéchets"
      );
    });

    test("when foreign transporter is not registered in Trackdéchets", async () => {
      const partialForm: Partial<Form> = {
        ...sealedForm,
        transporterCompanyVatNumber: "IT13029381004"
      };
      const validateFn = () => sealedFormSchema.validate(partialForm);
      await expect(validateFn()).rejects.toThrow(
        "Transporteur : le transporteur avec le n°de TVA IT13029381004 n'est pas inscrit sur Trackdéchets"
      );
    });

    test("when transporter is registered in Trackdéchets with wrong profile", async () => {
      const company = await companyFactory({ companyTypes: ["PRODUCER"] });
      const partialForm: Partial<Form> = {
        ...sealedForm,
        transporterCompanySiret: company.siret
      };
      const validateFn = () => sealedFormSchema.validate(partialForm);
      await expect(validateFn()).rejects.toThrow(
        `Le transporteur saisi sur le bordereau (SIRET: ${company.siret}) n'est pas inscrit sur Trackdéchets` +
          " en tant qu'entreprise de transport. Cette entreprise ne peut donc pas être visée sur le bordereau." +
          " Veuillez vous rapprocher de l'administrateur de cette entreprise pour qu'il modifie le profil de" +
          " l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements"
      );
    });

    test("when foreign transporter is registered in Trackdéchets with wrong profile", async () => {
      const company = await companyFactory({
        companyTypes: ["PRODUCER"],
        orgId: "IT13029381004",
        vatNumber: "IT13029381004"
      });
      const partialForm: Partial<Form> = {
        ...sealedForm,
        transporterCompanyVatNumber: company.vatNumber
      };
      const validateFn = () => sealedFormSchema.validate(partialForm);
      await expect(validateFn()).rejects.toThrow(
        `Le transporteur saisi sur le bordereau (numéro de TVA: ${company.vatNumber}) n'est pas inscrit sur Trackdéchets` +
          " en tant qu'entreprise de transport. Cette entreprise ne peut donc pas être visée sur le bordereau." +
          " Veuillez vous rapprocher de l'administrateur de cette entreprise pour qu'il modifie le profil de" +
          " l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements"
      );
    });

    test("when recipientCompanySiret is not well formatted", async () => {
      const partialForm: Partial<Form> = {
        ...sealedForm,
        recipientCompanySiret: "123"
      };
      const validateFn = () => sealedFormSchema.validate(partialForm);
      await expect(validateFn()).rejects.toThrow(
        "Destinataire: 123 n'est pas un numéro de SIRET valide"
      );
    });

    test("when recipient is not registered in Trackdéchets", async () => {
      const partialForm: Partial<Form> = {
        ...sealedForm,
        recipientCompanySiret: "85001946400021"
      };
      const validateFn = () => sealedFormSchema.validate(partialForm);
      await expect(validateFn()).rejects.toThrow(
        "Destinataire : l'établissement avec le SIRET 85001946400021 n'est pas inscrit sur Trackdéchets"
      );
    });

    test("when recipient is registered in Trackdéchets with wrong profile", async () => {
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
          " de cette installation pour qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements"
      );
    });

    test("when emitterIsForeignShip is true without emitterCompanyOmiNumber", async () => {
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

    test("when emitterIsForeignShip and siret is defined", async () => {
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

    test("when emitterIsForeignShip is true with invalid emitterCompanyOmiNumber", async () => {
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

    test("when emitterIsForeignShip and emitterIsPrivateIndividual both true", async () => {
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

    test("when emitterIsPrivateIndividual and siret is defined", async () => {
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
    test("when there is no receipt exemption and no receipt", async () => {
      const testForm = {
        ...sealedForm,
        transporterIsExemptedOfReceipt: false,
        transporterReceipt: null
      };

      const isValid = await sealedFormSchema.isValid(testForm);
      expect(isValid).toEqual(false);
    });

    test("when there is an eco-organisme but emitter type is not OTHER", async () => {
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

    test("when there is 1 citerne and another packaging", async () => {
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

    test("when there is 1 benne and another packaging", async () => {
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

    test("when is NOT grouped and R0 is selected", async () => {
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

    test("when there is nor transporterCompanySiret nor transporterCompanyVatNumber", async () => {
      const partialForm: Partial<Form> = {
        ...sealedForm,
        transporterCompanySiret: null,
        transporterCompanyVatNumber: null
      };
      const validateFn = () => sealedFormSchema.validate(partialForm);

      await expect(validateFn()).rejects.toThrow(
        "Transporteur : Le n°SIRET ou le numéro de TVA intracommunautaire est obligatoire"
      );
    });

    test("when the transporterCompanyVatNumber is invalid", async () => {
      const partialForm: Partial<Form> = {
        ...sealedForm,
        transporterCompanySiret: null,
        transporterCompanyVatNumber: "invalid"
      };
      const validateFn = () => sealedFormSchema.validate(partialForm);

      await expect(validateFn()).rejects.toThrow(
        "Transporteur: invalid n'est pas un numéro de TVA valide"
      );
    });

    test("when the transporterCompanyVatNumber is FR", async () => {
      const partialForm: Partial<Form> = {
        ...sealedForm,
        transporterCompanySiret: null,
        transporterCompanyVatNumber: "FR35552049447"
      };
      const validateFn = () => sealedFormSchema.validate(partialForm);

      await expect(validateFn()).rejects.toThrow(
        "Transporteur : Impossible d'utiliser le numéro de TVA pour un établissement français, veuillez renseigner son SIRET uniquement"
      );
    });
  });
});

describe("receivedInfosSchema", () => {
  describe("waste is accepted", () => {
    const receivedInfo: ReceivedFormInput = {
      wasteAcceptationStatus: "ACCEPTED",
      quantityReceived: 12.5,
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
      quantityReceived: 0,
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

    it("should be invalid if quantity received is different from 0", async () => {
      const validateFn = () =>
        receivedInfoSchema.validate({ ...receivedInfo, quantityReceived: 1.0 });
      await expect(validateFn()).rejects.toThrow(
        "Réception : le poids doit être égal à 0 lorsque le déchet est refusé"
      );
    });
  });

  describe("waste is partially refused", () => {
    const receivedInfo: ReceivedFormInput = {
      wasteAcceptationStatus: "PARTIALLY_REFUSED",
      quantityReceived: 11,
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

    it("should be invalid when quantity received is 0", async () => {
      const validateFn = () =>
        receivedInfoSchema.validate({ ...receivedInfo, quantityReceived: 0 });
      await expect(validateFn()).rejects.toThrow(
        "Réception : le poids doit être supérieur à 0 lorsque le déchet est accepté ou accepté partiellement"
      );
    });
  });
});

describe("draftFormSchema", () => {
  const form: Partial<Form> = {
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
});

describe("processedInfoSchema", () => {
  test("noTraceability can be true when processing operation is groupement", async () => {
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

  test("noTraceability can be false when processing operation is groupement", async () => {
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

  test("noTraceability can be undefined when processing operation is groupement", async () => {
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

  test("noTraceability can be null when processing operation is groupement", async () => {
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

  test("nextDestinationCompany SIRET is required when no other identification is given", async () => {
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
      "Destination ultérieure prévue : Le siret de l'entreprise est obligatoire"
    );
  });

  test("nextDestinationCompany return an error when SIRET is given and country is not FR", async () => {
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

  test("nextDestinationCompany return an error when a foreign VAT is given and country is FR", async () => {
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

  test("noTraceability cannot be true when processing operation is not groupement", async () => {
    const processedInfo = {
      processedBy: "John Snow",
      processedAt: new Date(),
      processingOperationDone: "D 8",
      processingOperationDescription: "Traitement biologique",
      noTraceability: true
    };
    const validateFn = () => processedInfoSchema.validate(processedInfo);

    await expect(validateFn()).rejects.toThrow(
      "Vous ne pouvez pas indiquer une rupture de traçabilité avec un code de traitement final"
    );
  });

  test("noTraceability can be false when processing operation is not groupement", async () => {
    const processedInfo = {
      processedBy: "John Snow",
      processedAt: new Date(),
      processingOperationDone: "D 8",
      processingOperationDescription: "Traitement biologique",
      noTraceability: false
    };
    expect(await processedInfoSchema.isValid(processedInfo)).toEqual(true);
  });

  test("noTraceability can be undefined when processing operation is not groupement", async () => {
    const processedInfo = {
      processedBy: "John Snow",
      processedAt: new Date(),
      processingOperationDone: "D 8",
      processingOperationDescription: "Traitement biologique"
    };
    expect(await processedInfoSchema.isValid(processedInfo)).toEqual(true);
  });

  test("noTraceability can be null when processing operation is not groupement", async () => {
    const processedInfo = {
      processedBy: "John Snow",
      processedAt: new Date(),
      processingOperationDone: "D 8",
      processingOperationDescription: "Traitement biologique",
      noTraceability: null
    };
    expect(await processedInfoSchema.isValid(processedInfo)).toEqual(true);
  });

  test("transporter SIRET is optional when a valid foreign vatNumber is present", async () => {
    const transporterCompany = await companyFactory({
      orgId: "BE0541696005",
      vatNumber: "BE0541696005"
    });
    const transporter = {
      transporterCompanyName: "Thalys",
      transporterCompanyVatNumber: transporterCompany.vatNumber,
      transporterCompanyAddress: "Bruxelles",
      transporterCompanyContact: "Contact",
      transporterCompanyPhone: "00 00 00 00 00",
      transporterCompanyMail: "contact@thalys.com",
      transporterIsExemptedOfReceipt: null
    };
    expect(await transporterSchemaFn(false).isValid(transporter)).toEqual(true);
  });

  test("transporter vatNumber is optional when a valid SIRET is present", async () => {
    const transporterCompany = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });
    const transporter = {
      transporterCompanyName: "Code en Stock",
      transporterCompanySiret: transporterCompany.siret,
      transporterCompanyAddress: "Marseille",
      transporterCompanyContact: "Contact",
      transporterCompanyPhone: "00 00 00 00 00",
      transporterCompanyMail: "contact@codeenstock.fr",
      transporterIsExemptedOfReceipt: true
    };
    expect(await transporterSchemaFn(false).isValid(transporter)).toEqual(true);
  });

  test("transporter SIRET is required with a french vatNumber", async () => {
    const transporter = {
      transporterCompanyName: "Code en Stock",
      transporterCompanyVatNumber: "FR87850019464",
      transporterCompanyAddress: "Marseille",
      transporterCompanyContact: "Contact",
      transporterCompanyPhone: "00 00 00 00 00",
      transporterCompanyMail: "contact@codeenstock.fr",
      transporterIsExemptedOfReceipt: true
    };
    const validateFn = () => transporterSchemaFn(false).validate(transporter);

    await expect(validateFn()).rejects.toThrow(
      "Transporteur : Impossible d'utiliser le numéro de TVA pour un établissement français, veuillez renseigner son SIRET uniquement"
    );
  });

  test("transporter vatNumber should be valid", async () => {
    const transporter = {
      transporterCompanyName: "Code en Stock",
      transporterCompanyVatNumber: "invalid",
      transporterCompanyAddress: "Marseille",
      transporterCompanyContact: "Contact",
      transporterCompanyPhone: "00 00 00 00 00",
      transporterCompanyMail: "contact@codeenstock.fr",
      transporterIsExemptedOfReceipt: true
    };

    const validateFn = () => transporterSchemaFn(false).validate(transporter);

    await expect(validateFn()).rejects.toThrow(
      "Transporteur: invalid n'est pas un numéro de TVA valide"
    );
  });

  test("transporter SIRET or VAT number is required", async () => {
    const transporter = {
      transporterCompanyName: "Thalys",
      transporterCompanyAddress: "Bruxelles",
      transporterCompanyContact: "Contact",
      transporterCompanyPhone: "00 00 00 00 00",
      transporterCompanyMail: "contact@thalys.com",
      transporterIsExemptedOfReceipt: true
    };
    const validateFn = () => transporterSchemaFn(false).validate(transporter);

    await expect(validateFn()).rejects.toThrow(
      "Transporteur : Le n°SIRET ou le numéro de TVA intracommunautaire est obligatoire"
    );
  });

  test("SIRET for la poste is valid", async () => {
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
      transporterIsExemptedOfReceipt: true
    };
    const validateFn = () => transporterSchemaFn(false).validate(transporter);

    await expect(validateFn()).resolves.toMatchObject({
      transporterCompanyAddress: "paris",
      transporterCompanyContact: "Contact",
      transporterCompanyMail: "contact@laposte.com",
      transporterCompanyName: "la poste",
      transporterCompanyPhone: "00 00 00 00 00",
      transporterCompanySiret: "35600000040773",
      transporterIsExemptedOfReceipt: true
    });
  });

  test("SIRET for any valid SIRET is valid", async () => {
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
      transporterIsExemptedOfReceipt: true
    };
    const validateFn = () => transporterSchemaFn(false).validate(transporter);

    await expect(validateFn()).resolves.toMatchObject({
      transporterCompanyAddress: "paris",
      transporterCompanyContact: "Contact",
      transporterCompanyMail: "contact@laposte.com",
      transporterCompanyName: "la poste siege",
      transporterCompanyPhone: "00 00 00 00 00",
      transporterCompanySiret: transporterCompany.siret,
      transporterIsExemptedOfReceipt: true
    });
  });

  test("nextDestination should be defined when processing operation is groupement and noTraceability is false", async () => {
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
        "Destination ultérieure prévue : Le siret de l'entreprise est obligatoire",
        "Destination ultérieure : L'adresse de l'entreprise est obligatoire",
        "Destination ultérieure : Le contact dans l'entreprise est obligatoire",
        "Destination ultérieure : Le téléphone de l'entreprise est obligatoire",
        "Destination ultérieure : L'email de l'entreprise est obligatoire"
      ]);
    }
  });

  test("nextDestination company info is optional when noTraceability is true", async () => {
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

  test("nextDestination fields can be empty when noTraceability is true", async () => {
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

  test("nextDestination processingOperation is required when noTraceability is true", async () => {
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
});
