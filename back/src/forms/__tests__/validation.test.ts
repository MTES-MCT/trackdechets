import { Form } from "@prisma/client";
import {
  draftFormSchema,
  sealedFormSchema,
  ecoOrganismeSchema,
  receivedInfoSchema,
  processedInfoSchema,
  transporterSchemaFn
} from "../validation";
import { ReceivedFormInput } from "../../generated/graphql/types";

const form: Partial<Form> = {
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
  emitterCompanySiret: "00000000000002",
  emitterCompanyContact: "Emetteur",
  emitterCompanyPhone: "01",
  emitterCompanyAddress: "8 rue du Général de Gaulle",
  emitterCompanyMail: "e@e.fr",
  recipientCap: "1234",
  recipientProcessingOperation: "D 6",
  recipientCompanyName: "A company 3",
  recipientCompanySiret: "00000000000003",
  recipientCompanyAddress: "8 rue du Général de Gaulle",
  recipientCompanyContact: "Destination",
  recipientCompanyPhone: "02",
  recipientCompanyMail: "d@d.fr",
  transporterReceipt: "sdfg",
  transporterDepartment: "82",
  transporterValidityLimit: new Date("2018-12-11T00:00:00.000Z"),
  transporterCompanyName: "A company 4",
  transporterCompanySiret: "00000000000004",
  transporterCompanyAddress: "8 rue du Général de Gaulle",
  transporterCompanyContact: "Transporteur",
  transporterCompanyPhone: "03",
  transporterCompanyMail: "t@t.fr",
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

describe("sealedFormSchema", () => {
  describe("form can be sealed", () => {
    test("when fully filled", async () => {
      sealedFormSchema.validateSync(form);
      const isValid = await sealedFormSchema.isValid(form);
      expect(isValid).toEqual(true);
    });

    test("with empty strings for optionnal fields", async () => {
      const testForm = {
        ...form,
        transporterNumberPlate: ""
      };
      const isValid = await sealedFormSchema.isValid(testForm);
      expect(isValid).toEqual(true);
    });

    test("with null values for optionnal fields", async () => {
      const testForm = {
        ...form,
        transporterNumberPlate: null
      };
      const isValid = await sealedFormSchema.isValid(testForm);
      expect(isValid).toEqual(true);
    });

    test("with R.541-50 ticked and no transportation infos", async () => {
      const testForm = {
        ...form,
        transporterIsExemptedOfReceipt: true,
        transporterReceipt: null,
        transporterDepartment: null
      };

      const isValid = await sealedFormSchema.isValid(testForm);
      expect(isValid).toEqual(true);
    });

    test("when there is an eco-organisme and emitter type is OTHER", async () => {
      const testForm = {
        ...form,
        emitterType: "OTHER",
        ecoOrganisme: { id: "an_id" }
      };

      const isValid = await sealedFormSchema
        .concat(ecoOrganismeSchema)
        .isValid(testForm);
      expect(isValid).toEqual(true);
    });

    test("when there is no eco-organisme and emitter type is OTHER", async () => {
      const testForm = {
        ...form,
        emitterType: "OTHER",
        ecoOrganisme: null
      };

      const isValid = await sealedFormSchema
        .concat(ecoOrganismeSchema)
        .isValid(testForm);
      expect(isValid).toEqual(true);
    });

    test.each(["PRODUCER", "OTHER", "APPENDIX1", "APPENDIX2"])(
      "when emitterType is (%p)",
      async emitterType => {
        const testForm = {
          ...form,
          emitterType
        };

        const isValid = await sealedFormSchema.isValid(testForm);
        expect(isValid).toEqual(true);
      }
    );
  });

  describe("form cannot be sealed", () => {
    test("when there is no receipt exemption and no receipt", async () => {
      const testForm = {
        ...form,
        transporterIsExemptedOfReceipt: false,
        transporterReceipt: null
      };

      const isValid = await sealedFormSchema.isValid(testForm);
      expect(isValid).toEqual(false);
    });

    test("when there is an eco-organisme but emitter type is not OTHER", async () => {
      const testForm = {
        ...form,
        emitterType: "PRODUCER",
        ecoOrganismeSiret: "12592018234951",
        ecoOrganismeName: "Some eco-organisme"
      };

      const isValid = await sealedFormSchema
        .concat(ecoOrganismeSchema)
        .isValid(testForm);
      expect(isValid).toEqual(false);
    });

    test("when there is 1 citerne and another packaging", async () => {
      const testForm = {
        ...form,
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
        ...form,
        wasteDetailsPackagingInfos: [
          { type: "BENNE", other: null, quantity: 1 },
          { type: "GRV", other: null, quantity: 1 }
        ]
      };

      const isValid = await sealedFormSchema.isValid(testForm);
      expect(isValid).toEqual(false);
    });
  });

  test("when there is 2 bennes", async () => {
    const testForm = {
      ...form,
      wasteDetailsPackagingInfos: [{ type: "BENNE", other: null, quantity: 2 }]
    };

    const isValid = await sealedFormSchema.isValid(testForm);
    expect(isValid).toEqual(true);
  });

  test("when there is 2 citernes", async () => {
    const testForm = {
      ...form,
      wasteDetailsPackagingInfos: [
        { type: "CITERNE", other: null, quantity: 2 }
      ]
    };

    const isValid = await sealedFormSchema.isValid(testForm);
    expect(isValid).toEqual(true);
  });

  test("when there is more than 2 bennes", async () => {
    const testForm = {
      ...form,
      wasteDetailsPackagingInfos: [{ type: "BENNE", other: null, quantity: 3 }]
    };
    const validateFn = () => sealedFormSchema.validate(testForm);
    await expect(validateFn()).rejects.toThrow(
      "Le nombre de benne ou de citerne ne peut être supérieur à 2."
    );
  });

  test("when there is more than 2 citernes", async () => {
    const testForm = {
      ...form,
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
      ...form,
      wasteDetailsQuantity: null
    };

    const isValid = await sealedFormSchema.isValid(testForm);
    expect(isValid).toEqual(false);
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

    it("should be valid when waste is accepted", () => {
      const isValid = receivedInfoSchema.isValidSync(receivedInfo);
      expect(isValid).toEqual(true);
    });

    it("should be invalid when quantity received is 0", async () => {
      const validateFn = () =>
        receivedInfoSchema.validate({
          ...receivedInfo,
          quantityReceived: 0
        });
      await expect(validateFn()).rejects.toThrow(
        "Vous devez saisir une quantité reçue supérieure à 0."
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

    it("should be valid when waste is refused", () => {
      const isValid = receivedInfoSchema.isValidSync(receivedInfo);
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
        "Vous devez saisir une quantité égale à 0 lorsque le déchet est refusé"
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

    it("should be valid when waste is partially refused", () => {
      const isValid = receivedInfoSchema.isValidSync(receivedInfo);
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
        "Vous devez saisir une quantité reçue supérieure à 0."
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

  it("should be valid when passing empty strings", () => {
    const isValid = draftFormSchema.isValidSync(form);
    expect(isValid).toBe(true);
  });

  it("should be valid when passing null values", () => {
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
    const isValid = draftFormSchema.isValidSync(form);

    expect(isValid).toBe(true);
  });

  it("should be valid when passing undefined values", () => {
    const isValid = draftFormSchema.isValidSync({});

    expect(isValid).toBe(true);
  });

  it("should not be valid when passing an invalid siret", async () => {
    const validateFn = () =>
      draftFormSchema.validate({
        ...form,
        emitterCompanySiret: "this is not a siret"
      });

    await expect(validateFn()).rejects.toThrow(
      "Émetteur: Le SIRET doit faire 14 caractères numériques"
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
});

describe("processedInfoSchema", () => {
  test("noTraceability can be true when processing operation is groupement", () => {
    const processedInfo = {
      processedBy: "John Snow",
      processedAt: new Date(),
      processingOperationDone: "D 13",
      processingOperationDescription: "Regroupement",
      noTraceability: true,
      nextDestinationProcessingOperation: "D 8",
      nextDestinationCompanyName: "Exutoire",
      nextDestinationCompanySiret: "11111111111111",
      nextDestinationCompanyAddress: "4 rue du déchet",
      nextDestinationCompanyCountry: "FR",
      nextDestinationCompanyContact: "Arya Stark",
      nextDestinationCompanyPhone: "06 XX XX XX XX",
      nextDestinationCompanyMail: "arya.stark@trackdechets.fr"
    };
    expect(processedInfoSchema.isValidSync(processedInfo)).toEqual(true);
  });

  test("noTraceability can be false when processing operation is groupement", () => {
    const processedInfo = {
      processedBy: "John Snow",
      processedAt: new Date(),
      processingOperationDone: "D 13",
      processingOperationDescription: "Regroupement",
      noTraceability: false,
      nextDestinationProcessingOperation: "D 8",
      nextDestinationCompanyName: "Exutoire",
      nextDestinationCompanySiret: "11111111111111",
      nextDestinationCompanyAddress: "4 rue du déchet",
      nextDestinationCompanyCountry: "FR",
      nextDestinationCompanyContact: "Arya Stark",
      nextDestinationCompanyPhone: "06 XX XX XX XX",
      nextDestinationCompanyMail: "arya.stark@trackdechets.fr"
    };
    expect(processedInfoSchema.isValidSync(processedInfo)).toEqual(true);
  });

  test("noTraceability can be undefined when processing operation is groupement", () => {
    const processedInfo = {
      processedBy: "John Snow",
      processedAt: new Date(),
      processingOperationDone: "D 13",
      processingOperationDescription: "Regroupement",
      nextDestinationProcessingOperation: "D 8",
      nextDestinationCompanyName: "Exutoire",
      nextDestinationCompanySiret: "11111111111111",
      nextDestinationCompanyAddress: "4 rue du déchet",
      nextDestinationCompanyCountry: "FR",
      nextDestinationCompanyContact: "Arya Stark",
      nextDestinationCompanyPhone: "06 XX XX XX XX",
      nextDestinationCompanyMail: "arya.stark@trackdechets.fr"
    };
    expect(processedInfoSchema.isValidSync(processedInfo)).toEqual(true);
  });

  test("noTraceability can be null when processing operation is groupement", () => {
    const processedInfo = {
      processedBy: "John Snow",
      processedAt: new Date(),
      processingOperationDone: "D 13",
      processingOperationDescription: "Regroupement",
      noTraceability: false,
      nextDestinationProcessingOperation: "D 8",
      nextDestinationCompanyName: "Exutoire",
      nextDestinationCompanySiret: "11111111111111",
      nextDestinationCompanyAddress: "4 rue du déchet",
      nextDestinationCompanyCountry: "FR",
      nextDestinationCompanyContact: "Arya Stark",
      nextDestinationCompanyPhone: "06 XX XX XX XX",
      nextDestinationCompanyMail: "arya.stark@trackdechets.fr"
    };
    expect(processedInfoSchema.isValidSync(processedInfo)).toEqual(true);
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

  test("noTraceability can be false when processing operation is not groupement", () => {
    const processedInfo = {
      processedBy: "John Snow",
      processedAt: new Date(),
      processingOperationDone: "D 8",
      processingOperationDescription: "Traitement biologique",
      noTraceability: false
    };
    expect(processedInfoSchema.isValidSync(processedInfo)).toEqual(true);
  });

  test("noTraceability can be undefined when processing operation is not groupement", () => {
    const processedInfo = {
      processedBy: "John Snow",
      processedAt: new Date(),
      processingOperationDone: "D 8",
      processingOperationDescription: "Traitement biologique"
    };
    expect(processedInfoSchema.isValidSync(processedInfo)).toEqual(true);
  });

  test("noTraceability can be null when processing operation is not groupement", () => {
    const processedInfo = {
      processedBy: "John Snow",
      processedAt: new Date(),
      processingOperationDone: "D 8",
      processingOperationDescription: "Traitement biologique",
      noTraceability: null
    };
    expect(processedInfoSchema.isValidSync(processedInfo)).toEqual(true);
  });

  test("transporter SIRET is optional when a valid foreign vatNumber is present", () => {
    const transporter = {
      transporterCompanyName: "Thalys",
      transporterCompanyVatNumber: "BE0541696005",
      transporterCompanyAddress: "Bruxelles",
      transporterCompanyContact: "Contact",
      transporterCompanyPhone: "00 00 00 00 00",
      transporterCompanyMail: "contact@thalys.com",
      transporterIsExemptedOfReceipt: true
    };
    expect(transporterSchemaFn(false).isValidSync(transporter)).toEqual(true);
  });

  test("transporter vatNumber is optional when a valid SIRET is present", () => {
    const transporter = {
      transporterCompanyName: "Code en Stock",
      transporterCompanySiret: "85001946400021",
      transporterCompanyAddress: "Marseille",
      transporterCompanyContact: "Contact",
      transporterCompanyPhone: "00 00 00 00 00",
      transporterCompanyMail: "contact@codeenstock.fr",
      transporterIsExemptedOfReceipt: true
    };
    expect(transporterSchemaFn(false).isValidSync(transporter)).toEqual(true);
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
      "Transporteur : Le numéro SIRET est obligatoire pour un établissement français"
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
      "transporterCompanyVatNumber n'est pas un numéro de TVA intracommunautaire valide"
    );
  });
  test("nextDestination should be defined when processing operation is groupement and noTraceability is false", () => {
    const processedInfo = {
      processedBy: "John Snow",
      processedAt: new Date(),
      processingOperationDone: "D 13",
      processingOperationDescription: "Regroupement",
      noTraceability: false
    };

    expect.assertions(1);

    try {
      processedInfoSchema.validateSync(processedInfo, { abortEarly: false });
    } catch (err) {
      expect(err.errors).toEqual([
        "Destination ultérieure : L'opération de traitement est obligatoire",
        "Destination ultérieure : Le nom de l'entreprise est obligatoire",
        "Destination ultérieure prévue : Le siret de l'entreprise est obligatoire",
        "Destination ultérieure prévue : Le SIRET doit faire 14 caractères numériques",
        "Destination ultérieure : L'adresse de l'entreprise est obligatoire",
        "Destination ultérieure : Le contact dans l'entreprise est obligatoire",
        "Destination ultérieure : Le téléphone de l'entreprise est obligatoire",
        "Destination ultérieure : L'email de l'entreprise est obligatoire"
      ]);
    }
  });

  test("nextDestination company info is optional when noTraceability is true", () => {
    const processedInfo = {
      processedBy: "John Snow",
      processedAt: new Date(),
      processingOperationDone: "R 12",
      processingOperationDescription: "Regroupement",
      nextDestinationProcessingOperation: "R 1",
      noTraceability: true
    };
    expect(processedInfoSchema.isValidSync(processedInfo)).toEqual(true);
  });

  test("nextDestination fields can be empty when noTraceability is true", () => {
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
    expect(processedInfoSchema.isValidSync(processedInfo)).toEqual(true);
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
