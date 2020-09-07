import { sealableFormSchema } from "../validation";
import { Form } from "../../../generated/prisma-client";

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
  emitterCompanySiret: "XXX XXX XXX 0002",
  emitterCompanyAddress: "8 rue du Général de Gaulle",
  emitterCompanyContact: "Emetteur",
  emitterCompanyPhone: "01",
  emitterCompanyMail: "e@e.fr",
  recipientCap: "1234",
  recipientProcessingOperation: "D 6",
  recipientCompanyName: "A company 3",
  recipientCompanySiret: "XXX XXX XXX 0003",
  recipientCompanyAddress: "8 rue du Général de Gaulle",
  recipientCompanyContact: "Destination",
  recipientCompanyPhone: "02",
  recipientCompanyMail: "d@d.fr",
  transporterReceipt: "sdfg",
  transporterDepartment: "82",
  transporterValidityLimit: "2018-12-11T00:00:00.000Z",
  transporterNumberPlate: "12345",
  transporterCompanyName: "A company 4",
  transporterCompanySiret: "XXX XXX XXX 0004",
  transporterCompanyAddress: "8 rue du Général de Gaulle",
  transporterCompanyContact: "Transporteur",
  transporterCompanyPhone: "03",
  transporterCompanyMail: "t@t.fr",
  wasteDetailsCode: "01 03 04*",
  wasteDetailsOnuCode: "AAA",
  wasteDetailsPackagings: ["CITERNE", "GRV"],
  wasteDetailsOtherPackaging: "",
  wasteDetailsNumberOfPackages: 2,
  wasteDetailsQuantity: 1.5,
  wasteDetailsQuantityType: "REAL",
  wasteDetailsConsistence: "SOLID"
};

describe("Form is valid", () => {
  test("when fully filled", async () => {
    const isValid = await sealableFormSchema.isValid({ ...form });
    expect(isValid).toEqual(true);
  });

  test("with empty strings for optionnal fields", async () => {
    const testForm = {
      ...form,
      recipientCap: "",
      transporterNumberPlate: ""
    };
    const isValid = await sealableFormSchema.isValid(testForm);
    expect(isValid).toEqual(true);
  });

  test("with null values for optionnal fields", async () => {
    const testForm = {
      ...form,
      recipientCap: null,
      transporterNumberPlate: null
    };
    const isValid = await sealableFormSchema.isValid(testForm);
    expect(isValid).toEqual(true);
  });

  test("with R.541-50 ticked and no transportation infos", async () => {
    const testForm = {
      ...form,
      transporterIsExemptedOfReceipt: true,
      transporterReceipt: null,
      transporterDepartement: null
    };

    const isValid = await sealableFormSchema.isValid(testForm);
    expect(isValid).toEqual(true);
  });

  test("when there is an eco-organisme and emitter type is OTHER", async () => {
    const testForm = {
      ...form,
      emitterType: "OTHER",
      ecoOrganisme: { id: "an_id" }
    };

    const isValid = await sealableFormSchema.isValid(testForm);
    expect(isValid).toEqual(true);
  });

  test("when there is no eco-organisme and emitter type is OTHER", async () => {
    const testForm = {
      ...form,
      emitterType: "OTHER",
      ecoOrganisme: null
    };

    const isValid = await sealableFormSchema.isValid(testForm);
    expect(isValid).toEqual(true);
  });

  test("when there is a temporaryStorageDetail and recipientIsTempStorage === true", async () => {
    const testForm = {
      ...form,
      recipientIsTempStorage: true,
      temporaryStorageDetail: { id: "an_id" }
    };

    const isValid = await sealableFormSchema.isValid(testForm);
    expect(isValid).toEqual(true);
  });

  test.each(["PRODUCER", "OTHER", "APPENDIX1", "APPENDIX2"])(
    "when emitterType is (%p)",
    async emitterType => {
      const testForm = {
        ...form,
        emitterType
      };

      const isValid = await sealableFormSchema.isValid(testForm);
      expect(isValid).toEqual(true);
    }
  );
});

describe("Form is not valid", () => {
  test("when there is no receipt exemption and no receipt", async () => {
    const testForm = {
      ...form,
      transporterIsExemptedOfReceipt: false,
      transporterReceipt: null
    };

    const isValid = await sealableFormSchema.isValid(testForm);
    expect(isValid).toEqual(false);
  });

  test("when there is an eco-organisme but emitter type is not OTHER", async () => {
    const testForm = {
      ...form,
      emitterType: "PRODUCER",
      ecoOrganisme: { id: "an_id" }
    };

    const isValid = await sealableFormSchema.isValid(testForm);
    expect(isValid).toEqual(false);
  });

  test("when there is a temporaryStorageDetail and recipientIsTempstorage === false", () => {
    expect.assertions(1);
    const testForm = {
      ...form,
      recipientIsTempstorage: false,
      temporaryStorageDetail: { id: "an_id" }
    };
    try {
      sealableFormSchema.validateSync(testForm);
    } catch (err) {
      expect(err.message).toEqual(
        "temporaryStorageDetail ne peut avoir une valeur que si recipientIsTempStorage === true"
      );
    }
  });
});
