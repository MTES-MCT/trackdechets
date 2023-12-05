import { WasteAcceptationStatus, BsffFicheIntervention } from "@prisma/client";
import { resetDatabase } from "../../../integration-tests/helper";
import { companyFactory, siretify } from "../../__tests__/factories";
import {
  receptionSchema,
  emitterSchemaFn,
  transporterSchemaFn,
  destinationSchemaFn,
  wasteDetailsSchemaFn,
  acceptationSchema,
  operationSchema,
  ficheInterventionSchema,
  validateBsff
} from "../validation";

describe("emitterSchema", () => {
  afterAll(resetDatabase);

  let emitterData;

  beforeAll(async () => {
    const emitter = await companyFactory({ companyTypes: ["TRANSPORTER"] });

    emitterData = {
      emitterCompanyName: "Emitter",
      emitterCompanySiret: emitter.siret,
      emitterCompanyAddress: "10 chemin fluide, 13001 Marseille",
      emitterCompanyContact: "John Clim",
      emitterCompanyPhone: "06 67 78 95 88",
      emitterCompanyMail: "john@clim.com"
    };
  });

  const emitterSchema = emitterSchemaFn({ isDraft: false });

  test("valid data", () => {
    emitterSchema.validateSync(emitterData);
    expect(emitterSchema.isValidSync(emitterData)).toEqual(true);
  });

  test("invalid SIRET", async () => {
    const validateFn = () =>
      emitterSchema.validate({ ...emitterData, emitterCompanySiret: "1" });

    await expect(validateFn()).rejects.toThrow(
      "Émetteur: 1 n'est pas un numéro de SIRET valide"
    );
  });

  test("invalid email", async () => {
    const validateFn = () =>
      emitterSchema.validate({ ...emitterData, emitterCompanyMail: "00 00" });

    await expect(validateFn()).rejects.toThrow(
      "Émetteur : l'adresse email est invalide"
    );
  });
});

describe("transporterSchema", () => {
  let transporterData;

  afterAll(resetDatabase);

  beforeAll(async () => {
    const transporter = await companyFactory({ companyTypes: ["TRANSPORTER"] });
    transporterData = {
      transporterCompanyName: "Transporteur",
      transporterCompanySiret: transporter.siret,
      transporterCompanyAddress: "10 chemin fluide, 13001 Marseille",
      transporterCompanyContact: "John Clim",
      transporterCompanyPhone: "06 67 78 95 88",
      transporterCompanyMail: "john@clim.com",
      transporterRecepisseNumber: "receiptNumber",
      transporterRecepisseDepartment: "25",
      transporterRecepisseValidityLimit: new Date()
    };
  });

  const transporterSchema = transporterSchemaFn({
    isDraft: false,
    transporterSignature: true
  });

  test("valid data", async () => {
    expect(await transporterSchema.isValid(transporterData)).toEqual(true);
  });

  test("valid data with foreign vat number", async () => {
    const foreignTransporter = await companyFactory({
      orgId: "IT13029381004",
      vatNumber: "IT13029381004"
    });
    expect(
      await transporterSchema.isValid({
        ...transporterData,
        transporterCompanySiret: null,
        transporterCompanyVatNumber: foreignTransporter.vatNumber
      })
    ).toEqual(true);
  });

  test("missing SIRET", async () => {
    const validateFn = () =>
      transporterSchema.validate({
        ...transporterData,
        transporterCompanySiret: null
      });

    await expect(validateFn()).rejects.toThrow(
      "Transporteur : Le n°SIRET ou le numéro de TVA intracommunautaire est obligatoire"
    );
  });

  test("missing Receipt", async () => {
    expect.assertions(1);
    try {
      await validateBsff(
        {
          ...transporterData,
          transporterRecepisseNumber: null,
          transporterRecepisseDepartment: null,
          transporterRecepisseValidityLimit: null
        },
        {
          isDraft: false,
          transporterSignature: true
        }
      );
    } catch (err) {
      expect(err.message).toEqual(
        "Erreur de validation des données. Des champs sont manquants ou mal formatés : \nDestination : le nom de l'établissement est requis\nDestination : le numéro SIRET est requis\nDestination : l'adresse de l'établissement est requise\nDestination : le nom du contact est requis\nDestination : le numéro de téléphone est requis\nDestination : l'adresse email est requise\nLe code de l'opération de traitement prévu est requis\nTransporteur: le département associé au récépissé est obligatoire - l'établissement doit renseigner son récépissé dans Trackdéchets\nTransporteur: le numéro de récépissé est obligatoire - l'établissement doit renseigner son récépissé dans Trackdéchets\nTransporteur: la date limite de validité du récépissé est obligatoire - l'établissement doit renseigner son récépissé dans Trackdéchets\nLe code déchet est requis\nLa dénomination usuelle du déchet est obligatoire\nLa mention ADR est requise\nLe poids total est requis\nLe type de poids (estimé ou non) est un requis\nÉmetteur : le nom de l'établissement est requis\nÉmetteur : le n°SIRET de l'établissement est requis\nÉmetteur : l'adresse de l'établissement est requise\nÉmetteur : le nom du contact est requis\nÉmetteur : le numéro de téléphone est requis\nÉmetteur : l'adresse email est requise"
      );
    }
  });

  test("valid data with transporter receipt exemption", async () => {
    expect(
      await transporterSchema.isValid({
        ...transporterData,
        transporterRecepisseIsExempted: true,
        transporterRecepisseNumber: null,
        transporterRecepisseDepartment: null,
        transporterRecepisseValidityLimit: null
      })
    ).toEqual(true);
  });

  test("missing SIRET and FR VAT", async () => {
    const validateFn = () =>
      transporterSchema.validate({
        ...transporterData,
        transporterCompanySiret: null,
        transporterCompanyVatNumber: "FR35552049447"
      });

    await expect(validateFn()).rejects.toThrow(
      "Transporteur : Impossible d'utiliser le numéro de TVA pour un établissement français, veuillez renseigner son SIRET uniquement"
    );
  });

  test("company not registered in Trackdéchets", async () => {
    const validateFn = () =>
      transporterSchema.validate({
        ...transporterData,
        transporterCompanySiret: "55204944776279"
      });

    await expect(validateFn()).rejects.toThrow(
      "Transporteur : l'établissement avec le SIRET 55204944776279 n'est pas inscrit sur Trackdéchets"
    );
  });

  test("foreign transporter not registered in Trackdéchets", async () => {
    const validateFn = () =>
      transporterSchema.validate({
        ...transporterData,
        teansporterCompanySiret: null,
        transporterCompanyVatNumber: "ESA15022510"
      });

    await expect(validateFn()).rejects.toThrow(
      "Transporteur : le transporteur avec le n°de TVA ESA15022510 n'est pas inscrit sur Trackdéchets"
    );
  });

  test("company registered in Trackdéchets but with wrong profile", async () => {
    const company = await companyFactory({ companyTypes: ["PRODUCER"] });
    const validateFn = () =>
      transporterSchema.validate({
        ...transporterData,
        transporterCompanySiret: company.siret
      });

    await expect(validateFn()).rejects.toThrow(
      `Le transporteur saisi sur le bordereau (SIRET: ${company.siret}) n'est pas inscrit sur Trackdéchets en tant qu'entreprise de transport.` +
        " Cette entreprise ne peut donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette entreprise pour" +
        " qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements"
    );
  });

  test("foreign transporter registered in Trackdéchets but with wrong profile", async () => {
    const company = await companyFactory({
      companyTypes: ["PRODUCER"],
      orgId: "ESA15022510",
      vatNumber: "ESA15022510"
    });
    const validateFn = () =>
      transporterSchema.validate({
        ...transporterData,
        transporterCompanySiret: null,
        transporterCompanyVatNumber: company.vatNumber
      });

    await expect(validateFn()).rejects.toThrow(
      `Le transporteur saisi sur le bordereau (numéro de TVA: ${company.vatNumber}) n'est pas inscrit sur Trackdéchets en tant qu'entreprise de transport.` +
        " Cette entreprise ne peut donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette entreprise pour" +
        " qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements"
    );
  });

  test("invalid SIRET", async () => {
    const validateFn = () =>
      transporterSchema.validate({
        ...transporterData,
        transporterCompanySiret: "00000000000000"
      });

    await expect(validateFn()).rejects.toThrow(
      "Transporteur: 00000000000000 n'est pas un numéro de SIRET valide"
    );
  });

  test("invalid SIRET length", async () => {
    const validateFn = () =>
      transporterSchema.validate({
        ...transporterData,
        transporterCompanySiret: "1"
      });

    await expect(validateFn()).rejects.toThrow(
      "Transporteur: 1 n'est pas un numéro de SIRET valide"
    );
  });

  test("invalid email", async () => {
    const validateFn = () =>
      transporterSchema.validate({
        ...transporterData,
        transporterCompanyMail: "00 00"
      });

    await expect(validateFn()).rejects.toThrow(
      "Transporteur : l'adresse email est invalide"
    );
  });

  it("transporter plate is required if transporter mode is ROAD", async () => {
    const bsff = {
      ...transporterData,
      transporterTransportMode: "ROAD",
      transporterTransportPlates: undefined
    };
    expect.assertions(1);

    try {
      await transporterSchema.validate(bsff);
    } catch (err) {
      expect(err.errors).toEqual(["La plaque d'immatriculation est requise"]);
    }
  });

  it.each(["", null, [], [""], [null], [undefined]])(
    "transporter plate is required if transporter mode is ROAD - invalid values",
    async invalidValue => {
      const bsff = {
        ...transporterData,
        transporterTransportMode: "ROAD",
        transporterTransportPlates: invalidValue
      };
      expect.assertions(1);

      try {
        await transporterSchema.validate(bsff);
      } catch (err) {
        expect(err.errors.length).toBeTruthy();
      }
    }
  );

  it("transporter plate is not required if transport mode is not ROAD", async () => {
    const bsff = {
      ...transporterData,
      transporterTransportMode: "AIR"
    };

    const validated = await transporterSchema.isValid(bsff);
    expect(validated).toBeDefined();
  });

  it("transporter recepisse is not required if transport mode is ROAD", async () => {
    const bsff = {
      ...transporterData,
      transporterTransportMode: "ROAD",
      transporterRecepisseDepartment: undefined,
      transporterRecepisseNumber: undefined,
      transporterRecepisseValidityLimit: undefined
    };
    const validated = await transporterSchema.isValid(bsff);
    expect(validated).toBeDefined();
  });

  it("should work if transport mode is ROAD & plates are defined", async () => {
    const bsff = {
      ...transporterData,
      transporterTransportMode: "ROAD",
      transporterTransportPlates: ["TRANSPORTER-PLATES"]
    };
    const validated = await transporterSchema.isValid(bsff);
    expect(validated).toBeDefined();
  });

  describe("Emitter transports own waste", () => {
    it("allowed if exemption", async () => {
      const emitterAndTransporter = await companyFactory({
        companyTypes: ["PRODUCER"]
      });

      const bsff = {
        ...transporterData,
        emitterCompanySiret: emitterAndTransporter.siret,
        transporterCompanySiret: emitterAndTransporter.siret,
        wasteDetailsCode: "16 06 01*",
        wasteDetailsQuantity: 10,
        transporterRecepisseIsExempted: true
      };

      expect.assertions(1);

      const isValid = await transporterSchema.isValid(bsff);

      expect(isValid).toBe(true);
    });

    it("NOT allowed if no exemption", async () => {
      const emitterAndTransporter = await companyFactory({
        companyTypes: ["PRODUCER"]
      });

      const bsff = {
        ...transporterData,
        emitterCompanySiret: emitterAndTransporter.siret,
        transporterCompanySiret: emitterAndTransporter.siret,
        wasteDetailsCode: "16 06 01*",
        wasteDetailsQuantity: 10,
        transporterRecepisseIsExempted: false
      };

      expect.assertions(1);

      const isValid = await transporterSchema.isValid(bsff);

      expect(isValid).toBe(false);
    });
  });

  it("should succeed if operation mode is missing because step is not operation", async () => {
    const bsff = {
      ...transporterData,
      operationCode: "R1",
      operationMode: undefined
    };

    expect.assertions(1);

    const isValid = await transporterSchema.isValid(bsff);

    expect(isValid).toBe(true);
  });
});

describe("destinationSchema", () => {
  let destinationData;

  afterAll(resetDatabase);

  beforeAll(async () => {
    const destination = await companyFactory({
      companyTypes: ["WASTEPROCESSOR"]
    });
    destinationData = {
      destinationCompanyName: "Transporteur",
      destinationCompanySiret: destination.siret,
      destinationCompanyAddress: "10 chemin fluide, 13001 Marseille",
      destinationCompanyContact: "John Clim",
      destinationCompanyPhone: "06 67 78 95 88",
      destinationCompanyMail: "john@clim.com",
      destinationPlannedOperationCode: "R2"
    };
  });

  const destinationSchema = destinationSchemaFn({ isDraft: false });

  test("valid data", async () => {
    expect(await destinationSchema.isValid(destinationData)).toEqual(true);
  });

  test("invalid SIRET", async () => {
    const validateFn = () =>
      destinationSchema.validate({
        ...destinationData,
        destinationCompanySiret: "11111111111111"
      });

    await expect(validateFn()).rejects.toThrow(
      "Destination: 11111111111111 n'est pas un numéro de SIRET valide"
    );
  });

  test("invalid SIRET length", async () => {
    const validateFn = () =>
      destinationSchema.validate({
        ...destinationData,
        destinationCompanySiret: "1"
      });

    await expect(validateFn()).rejects.toThrow(
      "Destination: 1 n'est pas un numéro de SIRET valide"
    );
  });

  test("company not registered in Trackdéchets", async () => {
    const validateFn = () =>
      destinationSchema.validate({
        ...destinationData,
        destinationCompanySiret: "85001946400021"
      });

    await expect(validateFn()).rejects.toThrow(
      "Destination : l'établissement avec le SIRET 85001946400021 n'est pas inscrit sur Trackdéchets"
    );
  });

  test("company registered in Trackdéchets but with wrong profile", async () => {
    const company = await companyFactory({ companyTypes: ["PRODUCER"] });
    const validateFn = () =>
      destinationSchema.validate({
        ...destinationData,
        destinationCompanySiret: company.siret
      });

    await expect(validateFn()).rejects.toThrow(
      `L'installation de destination ou d’entreposage ou de reconditionnement avec le SIRET \"${company.siret}\" n'est pas inscrite sur` +
        " Trackdéchets en tant qu'installation de traitement ou de tri transit regroupement. Cette installation ne peut donc pas être" +
        " visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette installation pour qu'il modifie le profil de" +
        " l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements"
    );
  });

  test("invalid email", async () => {
    const validateFn = () =>
      destinationSchema.validate({
        ...destinationData,
        destinationCompanyMail: "00 00"
      });

    await expect(validateFn()).rejects.toThrow(
      "Destination : l'adresse email est invalide"
    );
  });

  test("invalid planned operation code", async () => {
    const validateFn = () =>
      destinationSchema.validate({
        ...destinationData,
        destinationPlannedOperationCode: "T2"
      });

    await expect(validateFn()).rejects.toThrow(
      "Le code de l'opération de traitement prévu ne fait pas partie de la liste reconnue : R1, R2, R3, R5, R12, R13, D10, D13, D14, D15"
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

  const wasteDetailsSchema = wasteDetailsSchemaFn({ isDraft: false });

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
          { type: "BOUTEILLE", numero: "numero", weight: 0, volume: 1 }
        ]
      });

    await expect(validateFn()).rejects.toThrow(
      "Conditionnement : le poids doit être supérieur à 0"
    );
  });

  test("packaging volume is 0", async () => {
    const validateFn = () =>
      wasteDetailsSchema.validate({
        ...wasteDetails,
        packagings: [
          { type: "BOUTEILLE", numero: "numero", weight: 1, volume: 0 }
        ]
      });

    await expect(validateFn()).rejects.toThrow(
      "Conditionnements : le volume doit être supérieur à 0"
    );
  });

  test("packaging volume can be null", async () => {
    const isValid = await wasteDetailsSchema.isValid({
      ...wasteDetails,
      packagings: [
        { type: "BOUTEILLE", numero: "numero", weight: 1, volume: null }
      ]
    });

    expect(isValid).toEqual(true);
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

  it("should be invalid when waste code after analysis is not compatible with BSFF", async () => {
    const data = { ...acceptation, acceptationWasteCode: "06 07 01*" };
    const validateFn = () => acceptationSchema.validate(data);
    await expect(validateFn()).rejects.toThrow(
      "Le code déchet ne fait pas partie de la liste reconnue : 14 06 01*, 14 06 02*, 14 06 03*, 16 05 04*, 13 03 10*"
    );
  });

  it("should be invalid when packaging is accepted but weight = 0", async () => {
    const data = {
      ...acceptation,
      acceptationWeight: 0
    };
    const validateFn = () => acceptationSchema.validate(data);
    await expect(validateFn()).rejects.toThrow(
      "Acceptation : le poids doit être supérieur à 0 lorsque le déchet est accepté ou accepté partiellement"
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
      "Acceptation : le poids doit être égal à 0 lorsque le déchet est refusé"
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
    operationMode: "REUTILISATION",
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
      operationCode: "D13",
      operationMode: undefined
    };
    expect(operationSchema.isValidSync(data)).toEqual(true);
  });

  it("should be valid when operation code is groupement and next destination is set and has a valid SIRET", () => {
    const data = {
      ...operation,
      operationCode: "D13",
      operationMode: undefined,
      operationNextDestinationCompanyName: "ACME INC",
      operationNextDestinationPlannedOperationCode: "R2",
      operationNextDestinationCap: "cap",
      operationNextDestinationCompanySiret: siretify(1),
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
      operationMode: undefined,
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
      operationMode: undefined,
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
    await expect(validateFn()).rejects.toThrow(
      "Destination ultérieure : Le n° SIRET ou le n°TVA intracommunautaire est obligatoire"
    );
  });

  it("should not be valid when a french VAT is provided", async () => {
    const data = {
      ...operation,
      operationCode: "D13",
      operationMode: undefined,
      operationNextDestinationCompanyName: "ACME INC",
      operationNextDestinationPlannedOperationCode: "R2",
      operationNextDestinationCap: "cap",
      operationNextDestinationCompanySiret: null,
      operationNextDestinationCompanyVatNumber: "FR35552049447",
      operationNextDestinationCompanyAddress: "Quelque part",
      operationNextDestinationCompanyContact: "Mr Déchet",
      operationNextDestinationCompanyPhone: "01 00 00 00 00",
      operationNextDestinationCompanyMail: "contact@trackdechets.fr"
    };
    const validateFn = () => operationSchema.validate(data);
    await expect(validateFn()).rejects.toThrow(
      "Destination ultérieure : Impossible d'utiliser le numéro de TVA pour un établissement français, veuillez renseigner son SIRET uniquement"
    );
  });

  it("should be valid when operation code is groupement, noTraceability is true and nextDestination is set", () => {
    const data = {
      ...operation,
      operationNoTraceability: true,
      operationCode: "D13",
      operationMode: undefined,
      operationNextDestinationCompanyName: "ACME INC",
      operationNextDestinationPlannedOperationCode: "R2",
      operationNextDestinationCap: "cap",
      operationNextDestinationCompanySiret: siretify(1),
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
      operationCode: "R8",
      operationMode: "RECYCLAGE"
    };
    const validateFn = () => operationSchema.validate(data);
    await expect(validateFn()).rejects.toThrow(
      "Le code de l'opération de traitement ne fait pas partie de la liste reconnue : R1, R2, R3, R5, R12, R13, D10, D13, D14, D15"
    );
  });

  describe("Operation mode", () => {
    it("should succeed if operation code and operation mode are compatible", async () => {
      const data = {
        ...operation,
        operationCode: "R1",
        operationMode: "VALORISATION_ENERGETIQUE"
      };
      expect(operationSchema.isValidSync(data)).toEqual(true);
    });

    test.each([
      ["R 5", "VALORISATION_ENERGETIQUE"], // Correct modes are REUTILISATION or RECYCLAGE
      ["R 13", "VALORISATION_ENERGETIQUE"] // R 13 has no associated mode
    ])(
      "should fail if operation mode is not compatible with operation code",
      async (code, mode) => {
        const data = {
          ...operation,
          operationCode: code,
          operationMode: mode
        };

        const validateFn = () => operationSchema.validate(data);
        await expect(validateFn()).rejects.toThrow(
          "Le mode de traitement n'est pas compatible avec l'opération de traitement choisie"
        );
      }
    );

    test("should fail if operation code has associated operation modes but none is specified", async () => {
      const data = {
        ...operation,
        operationCode: "R1",
        operationMode: undefined
      };

      const validateFn = () => operationSchema.validate(data);
      await expect(validateFn()).rejects.toThrow(
        "Vous devez préciser un mode de traitement"
      );
    });
  });
});

describe("ficheInterventionSchema", () => {
  let ficheInteventionData: Partial<BsffFicheIntervention>,
    detenteurCompanyData: Partial<BsffFicheIntervention>,
    privateIndividualData: Partial<BsffFicheIntervention>;

  afterAll(resetDatabase);

  beforeAll(async () => {
    const operateurCompany = await companyFactory({
      companyTypes: ["PRODUCER"]
    });

    const detenteurCompany = await companyFactory({
      companyTypes: ["PRODUCER"]
    });

    ficheInteventionData = {
      numero: "FI-1",
      weight: 1,
      postalCode: "13001",

      operateurCompanyName: "Operateur",
      operateurCompanySiret: operateurCompany.siret!,
      operateurCompanyAddress: "Quelque part",
      operateurCompanyContact: "Arya Stark",
      operateurCompanyPhone: "01 00 00 00 00",
      operateurCompanyMail: "arya.stark@trackdechets.fr"
    };

    detenteurCompanyData = {
      detenteurCompanyName: "Detenteur",
      detenteurCompanySiret: detenteurCompany.siret,
      detenteurCompanyAddress: "Quelque part",
      detenteurCompanyContact: "John Snow",
      detenteurCompanyPhone: "00 00 00 00 00",
      detenteurCompanyMail: "john.snow@trackdechets.fr"
    };

    privateIndividualData = {
      detenteurIsPrivateIndividual: true,
      detenteurCompanySiret: null,
      detenteurCompanyContact: null,
      detenteurCompanyName: "John Snow",
      detenteurCompanyAddress: "Quelque part",
      detenteurCompanyMail: "john.snow@trackdechets.fr",
      detenteurCompanyPhone: "00 00 00 00 00"
    };
  });

  it("should be valid when company info is complete", () => {
    expect(
      ficheInterventionSchema.isValidSync({
        ...ficheInteventionData,
        ...detenteurCompanyData
      })
    ).toBe(true);
  });

  it("should be invalid when a company field is missing", async () => {
    const data = {
      ...ficheInteventionData,
      ...detenteurCompanyData,
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
        ...ficheInteventionData,
        ...privateIndividualData
      })
    ).toBe(true);
  });

  it("should be invalid when a private individual field is missing", async () => {
    const data = {
      ...ficheInteventionData,
      ...privateIndividualData,
      detenteurCompanyAddress: null
    };
    const validateFn = () => ficheInterventionSchema.validate(data);
    await expect(validateFn()).rejects.toThrow(
      "L'adresse du détenteur de l'équipement (particulier) est requise"
    );
  });

  it("should not be valid when providing both company and private indivual info", async () => {
    const data = {
      ...ficheInteventionData,
      ...privateIndividualData,
      ...detenteurCompanyData
    };
    const validateFn = () => ficheInterventionSchema.validate(data);
    await expect(validateFn()).rejects.toThrow(
      "Détenteur : vous ne pouvez pas renseigner de n°SIRET lorsque l'émetteur ou le détenteur est un particulier"
    );
  });
});
