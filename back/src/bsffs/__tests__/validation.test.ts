import { WasteAcceptationStatus } from "@prisma/client";
import { receptionSchema } from "../validation";

describe("receptionSchema", () => {
  const reception = {
    destinationReceptionSignatureDate: null,
    destinationReceptionDate: new Date("2021-09-02"),
    destinationReceptionAcceptationStatus: WasteAcceptationStatus.ACCEPTED,
    destinationReceptionWeight: 1,
    destinationReceptionRefusalReason: null
  };

  it("should be valid when reception is accepted", async () => {
    const data = reception;
    expect(receptionSchema.isValidSync(data)).toEqual(true);
  });

  it("should be invalid when reception is accepted but weight = 0", async () => {
    const data = {
      ...reception,
      destinationReceptionWeight: 0
    };
    const validateFn = () => receptionSchema.validate(data);
    await expect(validateFn()).rejects.toThrow(
      "Vous devez saisir une quantité reçue supérieure à 0"
    );
  });

  it("should be invalid when reception is accepted and refusal reason is set", async () => {
    const data = {
      ...reception,
      destinationReceptionRefusalReason: "parce que"
    };
    const validateFn = () => receptionSchema.validate(data);
    await expect(validateFn()).rejects.toThrow(
      "Le motif du refus ne doit pas être renseigné si le déchet est accepté"
    );
  });

  it("should valid when reception is refused", () => {
    const data = {
      ...reception,
      destinationReceptionAcceptationStatus: WasteAcceptationStatus.REFUSED,
      destinationReceptionWeight: 0,
      destinationReceptionRefusalReason: "parce que"
    };
    expect(receptionSchema.isValidSync(data)).toEqual(true);
  });

  it("should be invalid when reception is refused and weight > 0", async () => {
    const data = {
      ...reception,
      destinationReceptionAcceptationStatus: WasteAcceptationStatus.REFUSED,
      destinationReceptionWeight: 1,
      destinationReceptionRefusalReason: "parce que"
    };
    const validateFn = () => receptionSchema.validate(data);
    await expect(validateFn()).rejects.toThrow(
      "Vous devez saisir une quantité égale à 0 lorsque le déchet est refusé"
    );
  });

  it("should be invalid when reception is refused and refusal reason is not set", async () => {
    const data = {
      ...reception,
      destinationReceptionAcceptationStatus: WasteAcceptationStatus.REFUSED,
      destinationReceptionWeight: 0,
      destinationReceptionRefusalReason: null
    };
    const validateFn = () => receptionSchema.validate(data);
    await expect(validateFn()).rejects.toThrow(
      "Vous devez saisir un motif de refus"
    );
  });
});
