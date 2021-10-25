import { WasteAcceptationStatus } from ".prisma/client";
import { beforeReceptionSchema } from "../validation";

const destination = {
  destinationCompanyName: "ACME",
  destinationCompanySiret: "11111111111111",
  destinationCompanyAddress: "1 rue du déchet 07100 Annonay",
  destinationCompanyContact: "John Snow",
  destinationCompanyPhone: "00 00 00 00 00",
  destinationCompanyMail: "john.snow@trackdechets.fr",
  transporterTransportSignatureDate: new Date("2021-09-01")
};

describe("beforeReceptionSchema", () => {
  const reception = {
    destinationReceptionSignatureDate: null,
    destinationReceptionDate: new Date("2021-09-02"),
    destinationReceptionAcceptationStatus: WasteAcceptationStatus.ACCEPTED,
    destinationReceptionWeight: 1,
    destinationReceptionRefusalReason: null
  };

  it("should be valid when reception is accepted", async () => {
    const data = { ...destination, ...reception };
    expect(beforeReceptionSchema.isValidSync(data)).toEqual(true);
  });

  it("should be invalid when reception is accepted but weight = 0", async () => {
    const data = {
      ...destination,
      ...reception,
      destinationReceptionWeight: 0
    };
    const validateFn = () => beforeReceptionSchema.validate(data);
    await expect(validateFn()).rejects.toThrow(
      "Vous devez saisir une quantité reçue supérieure à 0"
    );
  });

  it("should be invalid when reception is accepted and refusal reason is set", async () => {
    const data = {
      ...destination,
      ...reception,
      destinationReceptionRefusalReason: "parce que"
    };
    const validateFn = () => beforeReceptionSchema.validate(data);
    await expect(validateFn()).rejects.toThrow(
      "Le motif du refus ne doit pas être renseigné si le déchet est accepté"
    );
  });

  it("should valid when reception is refused", () => {
    const data = {
      ...destination,
      ...reception,
      destinationReceptionAcceptationStatus: WasteAcceptationStatus.REFUSED,
      destinationReceptionWeight: 0,
      destinationReceptionRefusalReason: "parce que"
    };
    expect(beforeReceptionSchema.isValidSync(data)).toEqual(true);
  });

  it("should be invalid when reception is refused and weight > 0", async () => {
    const data = {
      ...destination,
      ...reception,
      destinationReceptionAcceptationStatus: WasteAcceptationStatus.REFUSED,
      destinationReceptionWeight: 1,
      destinationReceptionRefusalReason: "parce que"
    };
    const validateFn = () => beforeReceptionSchema.validate(data);
    await expect(validateFn()).rejects.toThrow(
      "Vous devez saisir une quantité égale à 0 lorsque le déchet est refusé"
    );
  });

  it("should be invalid when reception is refused and refusal reason is not set", async () => {
    const data = {
      ...destination,
      ...reception,
      destinationReceptionAcceptationStatus: WasteAcceptationStatus.REFUSED,
      destinationReceptionWeight: 0,
      destinationReceptionRefusalReason: null
    };
    const validateFn = () => beforeReceptionSchema.validate(data);
    await expect(validateFn()).rejects.toThrow(
      "Vous devez saisir un motif de refus"
    );
  });
});
