import { WasteAcceptationStatus } from "@prisma/client";
import {
  receptionSchema,
  emitterSchemaFn,
  transporterSchemaFn,
  destinationSchemaFn,
  wasteDetailsSchemaFn
} from "../validation";

describe("emitterSchema", () => {
  const emitter = {
    emitterCompanyName: "Emitter",
    emitterCompanySiret: "11111111111111",
    emitterCompanyAddress: "10 chemin fluide, 13001 Marseille",
    emitterCompanyContact: "John Clim",
    emitterCompanyPhone: "06 67 78 95 88",
    emitterCompanyMail: "john@clim.com"
  };

  const emitterSchema = emitterSchemaFn(false);

  test("valid data", () => {
    expect(emitterSchema.isValidSync(emitter)).toEqual(true);
  });

  test("invalid SIRET", async () => {
    const validateFn = () =>
      emitterSchema.validate({ ...emitter, emitterCompanySiret: "1" });

    await expect(validateFn()).rejects.toThrow(
      "Émetteur : le n°SIRET de l'établissement n'est pas au bon format"
    );
  });

  test("invalid email", async () => {
    const validateFn = () =>
      emitterSchema.validate({ ...emitter, emitterCompanyMail: "00 00" });

    await expect(validateFn()).rejects.toThrow(
      "Émetteur : l'adresse email est invalide"
    );
  });
});

describe("transporterSchema", () => {
  const transporter = {
    transporterCompanyName: "Transporteur",
    transporterCompanySiret: "11111111111111",
    transporterCompanyAddress: "10 chemin fluide, 13001 Marseille",
    transporterCompanyContact: "John Clim",
    transporterCompanyPhone: "06 67 78 95 88",
    transporterCompanyMail: "john@clim.com"
  };

  const transporterSchema = transporterSchemaFn(false);

  test("valid data", () => {
    expect(transporterSchema.isValidSync(transporter)).toEqual(true);
  });

  test("invalid SIRET", async () => {
    const validateFn = () =>
      transporterSchema.validate({
        ...transporter,
        transporterCompanySiret: "1"
      });

    await expect(validateFn()).rejects.toThrow(
      "Transporteur : le n° SIRET n'est pas au bon format"
    );
  });

  test("invalid email", async () => {
    const validateFn = () =>
      transporterSchema.validate({
        ...transporter,
        transporterCompanyMail: "00 00"
      });

    await expect(validateFn()).rejects.toThrow(
      "Transporteur : l'adresse email est invalide"
    );
  });
});

describe("destinationSchema", () => {
  const destination = {
    destinationCompanyName: "Transporteur",
    destinationCompanySiret: "11111111111111",
    destinationCompanyAddress: "10 chemin fluide, 13001 Marseille",
    destinationCompanyContact: "John Clim",
    destinationCompanyPhone: "06 67 78 95 88",
    destinationCompanyMail: "john@clim.com",
    destinationPlannedOperationCode: "R2"
  };

  const destinationSchema = destinationSchemaFn(false);

  test("valid data", () => {
    expect(destinationSchema.isValidSync(destination)).toEqual(true);
  });

  test("invalid SIRET", async () => {
    const validateFn = () =>
      destinationSchema.validate({
        ...destination,
        destinationCompanySiret: "1"
      });

    await expect(validateFn()).rejects.toThrow(
      "Destination : le n°SIRET n'est pas au bon format"
    );
  });

  test("invalid email", async () => {
    const validateFn = () =>
      destinationSchema.validate({
        ...destination,
        destinationCompanyMail: "00 00"
      });

    await expect(validateFn()).rejects.toThrow(
      "Destination : l'adresse email est invalide"
    );
  });

  test("invalid planned operation code", async () => {
    const validateFn = () =>
      destinationSchema.validate({
        ...destination,
        destinationPlannedOperationCode: "T2"
      });

    await expect(validateFn()).rejects.toThrow(
      "Le code de l'opération de traitement prévu ne fait pas partie de la liste reconnue : , R2, R3, R12, R13, D10, D13, D14, D15"
    );
  });
});

describe("wasteDetailsSchema", () => {
  const wasteDetails = {
    wasteCode: "14 06 01*",
    wasteAdr: "adr",
    wasteDescription: "R410",
    weightValue: 1,
    weightIsEstimate: true,
    packagings: [
      {
        name: "BOUTEILLE",
        numero: "123",
        weight: 1
      }
    ]
  };

  const wasteDetailsSchema = wasteDetailsSchemaFn(false);

  test("valid data", () => {
    expect(wasteDetailsSchema.isValidSync(wasteDetails)).toEqual(true);
  });

  test("invalid waste code", async () => {
    const validateFn = () =>
      wasteDetailsSchema.validate({
        ...wasteDetails,
        wasteCode: "18 01 03*"
      });

    await expect(validateFn()).rejects.toThrow(
      "Le code déchet ne fait pas partie de la liste reconnue : , 14 06 01*"
    );
  });

  test("negative weight", async () => {
    const validateFn = () =>
      wasteDetailsSchema.validate({
        ...wasteDetails,
        weightValue: -1
      });

    await expect(validateFn()).rejects.toThrow(
      "Le poids doit être supérieur à 0"
    );
  });

  test("packagings", async () => {
    const validateFn = () =>
      wasteDetailsSchema.validate({
        ...wasteDetails,
        packagings: []
      });

    await expect(validateFn()).rejects.toThrow(
      "Conditionnements : le nombre de contenants doit être supérieur ou égal à 1"
    );
  });
});

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

  it("should be valid when reception is refused", () => {
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
