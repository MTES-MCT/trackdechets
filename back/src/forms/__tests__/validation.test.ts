import { Form } from "@prisma/client";
import {
  sealedFormSchema,
  ecoOrganismeSchema,
  receivedInfoSchema,
  draftFormSchema
} from "../validation";
import { ReceivedFormInput } from "../../generated/graphql/types";

const form: Partial<Form> = {
  id: "cjplbvecc000d0766j32r19am",
  readableId: "TD-xxx",
  status: "DRAFT",
  emitterType: "PRODUCER",
  emitterWorkSiteName: "",
  emitterWorkSiteAddress: "",
  emitterWorkSiteCity: "",
  emitterWorkSitePostalCode: "",
  emitterWorkSiteInfos: "",
  emitterCompanyName: "A company 2",
  emitterCompanySiret: "XXXXXXXXXX0002",
  emitterCompanyContact: "Emetteur",
  emitterCompanyPhone: "01",
  emitterCompanyAddress: "8 rue du Général de Gaulle",
  emitterCompanyMail: "e@e.fr",
  recipientCap: "1234",
  recipientProcessingOperation: "D 6",
  recipientCompanyName: "A company 3",
  recipientCompanySiret: "XXXXXXXXXX0003",
  recipientCompanyAddress: "8 rue du Général de Gaulle",
  recipientCompanyContact: "Destination",
  recipientCompanyPhone: "02",
  recipientCompanyMail: "d@d.fr",
  transporterReceipt: "sdfg",
  transporterDepartment: "82",
  transporterValidityLimit: new Date("2018-12-11T00:00:00.000Z"),
  transporterCompanyName: "A company 4",
  transporterCompanySiret: "XXXXXXXXXX0004",
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
      receivedAt: "2020-01-17T10:12:00+0100",
      signedAt: "2020-01-17T10:12:00+0100"
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
      receivedAt: "2020-01-17T10:12:00+0100",
      signedAt: "2020-01-17T10:12:00+0100"
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
      receivedAt: "2020-01-17T10:12:00+0100",
      signedAt: "2020-01-17T10:12:00+0100"
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
