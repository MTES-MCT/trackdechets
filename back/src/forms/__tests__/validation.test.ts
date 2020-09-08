import * as Yup from "yup";
import { object } from "yup";
import {
  validateReceivedInfos,
  validDatetime,
  sealableFormSchema
} from "../validation";
import { ReceivedFormInput } from "../../generated/graphql/types";
import { ErrorCode } from "../../common/errors";
import { Form } from "../../generated/prisma-client";

describe("validDateTime", () => {
  const dummySchema = object({
    someDate: validDatetime(
      { verboseFieldName: "date de test", required: true },
      Yup
    )
  });

  test.each([
    "2020-12-30",
    "2020-12-30T23:45:55",
    "2020-12-30T23:45:55Z",
    "2020-12-30T23:45:55+08",
    "2020-12-30T23:45:55.987"
  ])("validDatetime is valid with date formatted as %p", async dateStr => {
    const isValid = await dummySchema.isValid({ someDate: dateStr });
    expect(isValid).toEqual(true);
  });

  test.each([
    "20201230",
    "2020-12-30 23:45:55",
    "2020-12-30T23 45 55",
    33,
    "junk"
  ])("validDatetime is invalid with date formatted as %p", async dateStr => {
    const isValid = await dummySchema.isValid({ someDate: dateStr });
    expect(isValid).toEqual(false);
  });

  test.each([{ someDate: null }, {}])(
    "validDatetime is invalid with empty or null value",
    async params => {
      const isValid = await dummySchema.isValid(params);
      expect(isValid).toEqual(false);
    }
  );
});

describe("validateReceivedInfos", () => {
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
      const validReceivedInfos = validateReceivedInfos(receivedInfo);
      expect(validReceivedInfos).toEqual(receivedInfo);
    });

    it("should be invalid when quantity received is 0", () => {
      expect.assertions(2);
      try {
        validateReceivedInfos({
          ...receivedInfo,
          quantityReceived: 0
        });
      } catch (err) {
        expect(err.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
        expect(err.message).toEqual(
          "Vous devez saisir une quantité reçue supérieure à 0."
        );
      }
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
      const validReceivedInfos = validateReceivedInfos(receivedInfo);
      expect(validReceivedInfos).toEqual(receivedInfo);
    });

    it("should be invalid if wasteRefusalReason is missing", () => {
      expect.assertions(2);
      try {
        validateReceivedInfos({ ...receivedInfo, wasteRefusalReason: null });
      } catch (err) {
        expect(err.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
        expect(err.message).toEqual("Vous devez saisir un motif de refus");
      }
    });

    it("should be invalid if quantity received is different from 0", () => {
      expect.assertions(2);
      try {
        validateReceivedInfos({ ...receivedInfo, quantityReceived: 1.0 });
      } catch (err) {
        expect(err.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
        expect(err.message).toEqual(
          "Vous devez saisir une quantité égale à 0 lorsque le déchet est refusé"
        );
      }
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
      const validReceivedInfos = validateReceivedInfos(receivedInfo);
      expect(validReceivedInfos).toEqual(receivedInfo);
    });

    it("should be invalid if wasteRefusalReason is missing", () => {
      expect.assertions(2);
      try {
        validateReceivedInfos({ ...receivedInfo, wasteRefusalReason: null });
      } catch (err) {
        expect(err.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
        expect(err.message).toEqual(
          "Vous devez saisir un motif de refus partiel"
        );
      }
    });

    it("should be invalid when quantity received is 0", () => {
      expect.assertions(2);
      try {
        validateReceivedInfos({
          ...receivedInfo,
          quantityReceived: 0
        });
      } catch (err) {
        expect(err.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
        expect(err.message).toEqual(
          "Vous devez saisir une quantité reçue supérieure à 0."
        );
      }
    });
  });
});

describe("sealableFormSchema", () => {
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

  describe("Form can be sealed", () => {
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

  describe("Form cannot be sealed", () => {
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
});
