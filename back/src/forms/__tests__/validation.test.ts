import * as Yup from "yup";
import { object } from "yup";
import { validateReceivedInfos, validDatetime } from "../validation";
import { ReceivedFormInput } from "../../generated/graphql/types";
import { ErrorCode } from "../../common/errors";

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
