import {
  CompanyType,
  CompanyVerificationStatus,
  WasteAcceptationStatus,
  BsffFicheIntervention
} from "@prisma/client";
import {
  receptionSchema,
  emitterSchemaFn,
  transporterSchemaFn,
  destinationSchemaFn,
  wasteDetailsSchemaFn,
  acceptationSchema,
  operationSchema,
  ficheInterventionSchema
} from "../validation";

jest.mock("../../prisma", () => ({
  company: {
    findUnique: jest.fn(() =>
      Promise.resolve({
        companyTypes: [
          CompanyType.COLLECTOR,
          CompanyType.WASTEPROCESSOR,
          CompanyType.TRANSPORTER
        ],
        verificationStatus: CompanyVerificationStatus.VERIFIED
      })
    )
  }
}));

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

  test("valid data", async () => {
    expect(await transporterSchema.isValid(transporter)).toEqual(true);
  });

  test("invalid SIRET", async () => {
    const validateFn = () =>
      transporterSchema.validate({
        ...transporter,
        transporterCompanySiret: "1"
      });

    await expect(validateFn()).rejects.toThrow(
      "transporterCompanySiret n'est pas un numéro de SIRET valide"
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

  test("valid data", async () => {
    expect(await destinationSchema.isValid(destination)).toEqual(true);
  });

  test("invalid SIRET", async () => {
    const validateFn = () =>
      destinationSchema.validate({
        ...destination,
        destinationCompanySiret: "1"
      });

    await expect(validateFn()).rejects.toThrow(
      "Destinataire: Le SIRET doit faire 14 caractères numériques"
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
        type: "BOUTEILLE",
        numero: "123",
        weight: 1,
        volume: 1
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

  test("packaging weight is 0", async () => {
    const validateFn = () =>
      wasteDetailsSchema.validate({
        ...wasteDetails,
        packagings: [
          { name: "bouteille", numero: "numero", weight: 0, volume: 1 }
        ]
      });

    await expect(validateFn()).rejects.toThrow(
      "Conditionnements : le poids doit être supérieur à 0"
    );
  });

  test("packaging volume is 0", async () => {
    const validateFn = () =>
      wasteDetailsSchema.validate({
        ...wasteDetails,
        packagings: [
          { name: "bouteille", numero: "numero", weight: 1, volume: 0 }
        ]
      });

    await expect(validateFn()).rejects.toThrow(
      "Conditionnements : le volume doit être supérieur à 0"
    );
  });
});

describe("receptionSchema", () => {
  const reception = {
    destinationReceptionSignatureDate: null,
    destinationReceptionDate: new Date("2021-09-02")
  };

  it("should be valid when reception date is set", async () => {
    const data = reception;
    expect(receptionSchema.isValidSync(data)).toEqual(true);
  });

  it("should be invalid when reception date is not set", async () => {
    const data = { ...reception, destinationReceptionDate: null };
    const validateFn = () => receptionSchema.validate(data);
    await expect(validateFn()).rejects.toThrow(
      "La date de réception du déchet est requise"
    );
  });
});

describe("acceptationSchema", () => {
  const acceptation = {
    acceptationDate: new Date("2021-09-02"),
    acceptationWeight: 1,
    acceptationStatus: WasteAcceptationStatus.ACCEPTED,
    acceptationRefusalReason: null,
    acceptationWasteCode: "14 06 01*",
    acceptationWasteDescription: "fluide"
  };

  it("should be valid when packaging is accepted", async () => {
    const data = acceptation;
    expect(acceptationSchema.isValidSync(data)).toEqual(true);
  });

  it("should be invalid when waste code after analysis is not set", async () => {
    const data = { ...acceptation, acceptationWasteCode: null };
    const validateFn = () => acceptationSchema.validate(data);
    await expect(validateFn()).rejects.toThrow(
      "Le code déchet après analyse est requis"
    );
  });

  it("should be invalid when waste code after analysis is not compatible with BSFF", async () => {
    const data = { ...acceptation, acceptationWasteCode: "06 07 01*" };
    const validateFn = () => acceptationSchema.validate(data);
    await expect(validateFn()).rejects.toThrow(
      "Le code déchet ne fait pas partie de la liste reconnue : 14 06 01*, 14 06 02*, 14 06 03*, 16 05 04*, 13 03 10*"
    );
  });

  it("should be invalid when waste description after analysis is not set", async () => {
    const data = { ...acceptation, acceptationWasteDescription: null };
    const validateFn = () => acceptationSchema.validate(data);
    await expect(validateFn()).rejects.toThrow(
      "La description du déchet après analyse est requise"
    );
  });

  it("should be invalid when packaging is accepted but weight = 0", async () => {
    const data = {
      ...acceptation,
      acceptationWeight: 0
    };
    const validateFn = () => acceptationSchema.validate(data);
    await expect(validateFn()).rejects.toThrow(
      "Vous devez saisir une quantité reçue supérieure à 0"
    );
  });

  it("should be invalid when packaging is accepted and refusal reason is set", async () => {
    const data = {
      ...acceptation,
      acceptationRefusalReason: "parce que"
    };
    const validateFn = () => acceptationSchema.validate(data);
    await expect(validateFn()).rejects.toThrow(
      "Le motif du refus ne doit pas être renseigné si le déchet est accepté"
    );
  });

  it("should be valid when packaging is refused", () => {
    const data = {
      ...acceptation,
      acceptationStatus: WasteAcceptationStatus.REFUSED,
      acceptationWeight: 0,
      acceptationRefusalReason: "parce que"
    };
    expect(acceptationSchema.isValidSync(data)).toEqual(true);
  });

  it("should be invalid when packaging is refused and weight > 0", async () => {
    const data = {
      ...acceptation,
      acceptationStatus: WasteAcceptationStatus.REFUSED,
      acceptationWeight: 1,
      acceptationRefusalReason: "parce que"
    };
    const validateFn = () => acceptationSchema.validate(data);
    await expect(validateFn()).rejects.toThrow(
      "Vous devez saisir une quantité égale à 0 lorsque le déchet est refusé"
    );
  });

  it("should be invalid when packaging is refused and refusal reason is not set", async () => {
    const data = {
      ...acceptation,
      acceptationStatus: WasteAcceptationStatus.REFUSED,
      acceptationWeight: 0,
      acceptationRefusalReason: null
    };
    const validateFn = () => acceptationSchema.validate(data);
    await expect(validateFn()).rejects.toThrow(
      "Vous devez saisir un motif de refus"
    );
  });
});

describe("operationSchema", () => {
  const operation = {
    operationDate: new Date("2021-09-02"),
    operationNoTraceability: false,
    operationCode: "R2",
    operationNextDestinationCompanyName: null,
    operationNextDestinationPlannedOperationCode: null,
    operationNextDestinationCap: null,
    operationNextDestinationCompanySiret: null,
    operationNextDestinationCompanyVatNumber: null,
    operationNextDestinationCompanyAddress: null,
    operationNextDestinationCompanyContact: null,
    operationNextDestinationCompanyPhone: null,
    operationNextDestinationCompanyMail: null
  };

  it("should be valid when operation date and operation code are set", () => {
    const data = operation;
    expect(operationSchema.isValidSync(data)).toEqual(true);
  });

  it("should be valid when operation code is groupement and noTraceability is true", () => {
    const data = {
      ...operation,
      operationNoTraceability: true,
      operationCode: "D13"
    };
    expect(operationSchema.isValidSync(data)).toEqual(true);
  });

  it("should be valid when operation code is groupement and next destination is set and has a valid SIRET", () => {
    const data = {
      ...operation,
      operationCode: "D13",
      operationNextDestinationCompanyName: "ACME INC",
      operationNextDestinationPlannedOperationCode: "R2",
      operationNextDestinationCap: "cap",
      operationNextDestinationCompanySiret: "11111111111111",
      operationNextDestinationCompanyVatNumber: null,
      operationNextDestinationCompanyAddress: "Quelque part",
      operationNextDestinationCompanyContact: "Mr Déchet",
      operationNextDestinationCompanyPhone: "01 00 00 00 00",
      operationNextDestinationCompanyMail: "contact@trackdechets.fr"
    };
    expect(operationSchema.isValidSync(data)).toEqual(true);
  });

  it("should be valid when operation code is groupement and next destination is set and has a valid VAT", () => {
    const data = {
      ...operation,
      operationCode: "D13",
      operationNextDestinationCompanyName: "ACME INC",
      operationNextDestinationPlannedOperationCode: "R2",
      operationNextDestinationCap: "cap",
      operationNextDestinationCompanySiret: null,
      operationNextDestinationCompanyVatNumber: "IE9513674T",
      operationNextDestinationCompanyAddress: "Quelque part",
      operationNextDestinationCompanyContact: "Mr Déchet",
      operationNextDestinationCompanyPhone: "01 00 00 00 00",
      operationNextDestinationCompanyMail: "contact@trackdechets.fr"
    };
    expect(operationSchema.isValidSync(data)).toEqual(true);
  });

  it("should be invalid when no SIRET or VAT is provided in next destination", async () => {
    const data = {
      ...operation,
      operationCode: "D13",
      operationNextDestinationCompanyName: "ACME INC",
      operationNextDestinationPlannedOperationCode: "R2",
      operationNextDestinationCap: "cap",
      operationNextDestinationCompanySiret: null,
      operationNextDestinationCompanyVatNumber: null,
      operationNextDestinationCompanyAddress: "Quelque part",
      operationNextDestinationCompanyContact: "Mr Déchet",
      operationNextDestinationCompanyPhone: "01 00 00 00 00",
      operationNextDestinationCompanyMail: "contact@trackdechets.fr"
    };
    const validateFn = () => operationSchema.validate(data);
    await expect(validateFn()).rejects.toThrow("");
  });

  it("should be valid when operation code is groupement, noTraceability is true and nextDestination is set", () => {
    const data = {
      ...operation,
      operationNoTraceability: true,
      operationCode: "D13",
      operationNextDestinationCompanyName: "ACME INC",
      operationNextDestinationPlannedOperationCode: "R2",
      operationNextDestinationCap: "cap",
      operationNextDestinationCompanySiret: "11111111111111",
      operationNextDestinationCompanyVatNumber: null,
      operationNextDestinationCompanyAddress: "Quelque part",
      operationNextDestinationCompanyContact: "Mr Déchet",
      operationNextDestinationCompanyPhone: "01 00 00 00 00",
      operationNextDestinationCompanyMail: "contact@trackdechets.fr"
    };
    expect(operationSchema.isValidSync(data)).toEqual(true);
  });

  it("should be invalid when the processing operation is not set", async () => {
    const data = {
      ...operation,
      operationCode: null
    };
    const validateFn = () => operationSchema.validate(data);
    await expect(validateFn()).rejects.toThrow(
      "Le code de l'opération de traitement est requis"
    );
  });

  it("should be invalid when the operation date is not set", async () => {
    const data = {
      ...operation,
      operationDate: null
    };
    const validateFn = () => operationSchema.validate(data);
    await expect(validateFn()).rejects.toThrow(
      "La date de l'opération est requise"
    );
  });

  it("should be invalid when processing operation is not in the list", async () => {
    const data = {
      ...operation,
      operationCode: "R8"
    };
    const validateFn = () => operationSchema.validate(data);
    await expect(validateFn()).rejects.toThrow(
      "Le code de l'opération de traitement ne fait pas partie de la liste reconnue : R2, R3, R12, R13, D10, D13, D14, D15"
    );
  });
});

describe("ficheInterventionSchema", () => {
  const ficheIntevention: Partial<BsffFicheIntervention> = {
    numero: "FI-1",
    weight: 1,
    postalCode: "13001",

    operateurCompanyName: "Operateur",
    operateurCompanySiret: "22222222222222",
    operateurCompanyAddress: "Quelque part",
    operateurCompanyContact: "Arya Stark",
    operateurCompanyPhone: "01 00 00 00 00",
    operateurCompanyMail: "arya.stark@trackdechets.fr"
  };

  const detenteurCompany: Partial<BsffFicheIntervention> = {
    detenteurCompanyName: "Detenteur",
    detenteurCompanySiret: "11111111111111",
    detenteurCompanyAddress: "Quelque part",
    detenteurCompanyContact: "John Snow",
    detenteurCompanyPhone: "00 00 00 00 00",
    detenteurCompanyMail: "john.snow@trackdechets.fr"
  };

  const privateIndividual: Partial<BsffFicheIntervention> = {
    detenteurIsPrivateIndividual: true,
    detenteurCompanySiret: null,
    detenteurCompanyContact: null,
    detenteurCompanyName: "John Snow",
    detenteurCompanyAddress: "Quelque part",
    detenteurCompanyMail: "john.snow@trackdechets.fr",
    detenteurCompanyPhone: "00 00 00 00 00"
  };

  it("should be valid when company info is complete", () => {
    expect(
      ficheInterventionSchema.isValidSync({
        ...ficheIntevention,
        ...detenteurCompany
      })
    ).toBe(true);
  });

  it("should be invalid when a company field is missing", async () => {
    const data = {
      ...ficheIntevention,
      ...detenteurCompany,
      detenteurCompanyContact: null
    };
    const validateFn = () => ficheInterventionSchema.validate(data);
    await expect(validateFn()).rejects.toThrow(
      "Le nom du contact de l'entreprise détentrice de l'équipement est requis"
    );
  });

  it("should be valid when private individual info is complete", () => {
    expect(
      ficheInterventionSchema.isValidSync({
        ...ficheIntevention,
        ...privateIndividual
      })
    ).toBe(true);
  });

  it("should be invalid when a private individual field is missing", async () => {
    const data = {
      ...ficheIntevention,
      ...privateIndividual,
      detenteurCompanyAddress: null
    };
    const validateFn = () => ficheInterventionSchema.validate(data);
    await expect(validateFn()).rejects.toThrow(
      "L'adresse du détenteur de l'équipement (particulier) est requise"
    );
  });

  it("should not be valid when providing both company and private indivual info", async () => {
    const data = {
      ...ficheIntevention,
      ...privateIndividual,
      ...detenteurCompany
    };
    const validateFn = () => ficheInterventionSchema.validate(data);
    await expect(validateFn()).rejects.toThrow(
      "Vous ne pouvez pas renseigner de n°SIRET lorsque le détenteur est un particulier"
    );
  });
});
