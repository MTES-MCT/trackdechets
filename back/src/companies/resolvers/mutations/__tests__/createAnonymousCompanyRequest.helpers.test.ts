import {
  extractAddress,
  extractBetween,
  extractCodeNaf,
  extractData,
  extractEmittedAt,
  extractLine,
  extractName,
  extractSiret,
  toDate,
  validateAndExtractSireneDataFromPDFInBase64,
  validateInfoOrThrow,
  validateMetadataOrThrow
} from "../createAnonymousCompanyRequest.helpers";

import pdfParser from "pdf-parse";
jest.mock("pdf-parse", () => jest.fn());

export const INFO = {
  PDFFormatVersion: "1.7",
  IsAcroFormPresent: false,
  IsXFAPresent: false,
  Title: "Avis de situation au répertoire Sirene",
  Author: "Institut National de la Statistique et des Etudes Economiques",
  Subject: "Situation au répertoire Sirene",
  Keywords: "Insee, Avis de situation, sirene",
  Producer: "iText® Core 8.0.2 (AGPL version) ©2000-2023 Apryse Group NV",
  CreationDate: "D:20240214095131+01'00'",
  ModDate: "D:20240214095131+01'00'"
};

export const METADATA = {
  "dc:creator": "Institut National de la Statistique et des Etudes Economiques",
  "dc:subject": "InseeAvis de situationsirene",
  "dc:description": "Situation au répertoire Sirene",
  "dc:title": "Avis de situation au répertoire Sirene",
  "pdfuaid:part": "1"
};

export const EXTRACTED_STRINGS = [
  "Service Statistique ",
  "Répertoire SIRENE",
  "Service Info Sirene ",
  "09 72 72 6000 ",
  "prix d'un appel local",
  "SITUATION AU REPERTOIRE SIRENE ",
  "À la date du 14/02/2024",
  "Description de l'entrepriseEntreprise active depuis le 02/01/2024",
  "Identifiant SIREN982 549 826",
  "Identifiant SIRET du siège982 549 826 00013",
  "DénominationACME CORP",
  "Catégorie juridique5499 - Société à responsabilité limitée (sans autre ",
  "indication)",
  "Activité Principale Exercée (APE)62.02A - Conseil en systèmes et logiciels informatiques",
  "Appartenance au champ de l’ESS",
  "1",
  "Non",
  "Appartenance au champ des ",
  "sociétés à mission",
  "Description de l'établissementEtablissement actif depuis le 02/01/2024",
  "Identifiant SIRET982 549 826 00013",
  "Adresse4 BD PASTEUR",
  "44100 NANTES",
  "Activité Principale Exercée (APE)62.02A - Conseil en systèmes et logiciels informatiques",
  "1 : Economie Sociale et Solidaire",
  "Important : A l'exception des informations relatives à l'identification de l'entreprise, les renseignements figurant dans ce ",
  "document, en particulier le code APE, n'ont de valeur que pour les applications statistiques (décret n°2007-1888 du 26 ",
  "décembre 2007 portant approbation des nomenclatures d'activités françaises et de produits, paru au JO du 30 décembre ",
  "2007).",
  "Avertissement : Aucune valeur juridique n'est attachée à l'avis de situation.",
  "REPUBLIQUE FRANCAISE"
];

describe("createAnonymousCompanyRequest.helpers", () => {
  describe("validateInfoOrThrow", () => {
    it("should return true", async () => {
      // Given

      // When
      const valid = validateInfoOrThrow(INFO);

      // Then
      expect(valid).toBeTruthy();
    });

    it.each([undefined, null, ""])(
      "should throw because of invalid input '%p'",
      async input => {
        // Given

        // When
        expect.assertions(1);
        try {
          validateInfoOrThrow(input);
        } catch (e) {
          // Then
          expect(e.message).toEqual("Invalid info");
        }
      }
    );

    it("should throw because title is not valid", async () => {
      // Given

      // When
      expect.assertions(1);
      try {
        validateInfoOrThrow({
          ...INFO,
          Title: "Avis de situation au répertoire téléphonique"
        });
      } catch (e) {
        // Then
        expect(e.message).toEqual("Invalid info title");
      }
    });

    it("should throw because author is not valid", async () => {
      // Given

      // When
      expect.assertions(1);
      try {
        validateInfoOrThrow({
          ...INFO,
          Author: "Institut National de la Statistique et de la course en sac"
        });
      } catch (e) {
        // Then
        expect(e.message).toEqual("Invalid info author");
      }
    });
  });

  describe("validateMetadataOrThrow", () => {
    it("should return true", async () => {
      // Given

      // When
      const valid = validateMetadataOrThrow(METADATA);

      // Then
      expect(valid).toBeTruthy();
    });

    it.each([undefined, null, ""])(
      "should throw because of invalid input '%p'",
      async input => {
        // Given

        // When
        expect.assertions(1);
        try {
          validateMetadataOrThrow(input);
        } catch (e) {
          // Then
          expect(e.message).toEqual("Invalid metadata");
        }
      }
    );

    it("should throw because dc:creator is not valid", async () => {
      // Given

      // When
      expect.assertions(1);
      try {
        validateMetadataOrThrow({
          ...METADATA,
          "dc:creator": "Institut National du lancer de fromage"
        });
      } catch (e) {
        // Then
        expect(e.message).toEqual("Invalid metadata creator");
      }
    });

    it("should throw because dc:title is not valid", async () => {
      // Given

      // When
      expect.assertions(1);
      try {
        validateMetadataOrThrow({
          ...METADATA,
          "dc:title": "Avis de situation de le répertoire Sirene"
        });
      } catch (e) {
        // Then
        expect(e.message).toEqual("Invalid metadata title");
      }
    });
  });

  describe("extractLine", () => {
    it("should return extracted data", async () => {
      // Given

      // When
      const res = extractLine(EXTRACTED_STRINGS, "Identifiant SIREN");

      // Then
      expect(res).toEqual("982 549 826");
    });

    it("edge-cases", async () => {
      // Given

      // When
      const res = extractLine([], "Identifiant SIREN");

      // Then
      expect(res).toEqual(undefined);
    });

    it("should trim", async () => {
      // Given

      // When
      const res = extractLine(
        ["Identifiant SIREN 982 549 826 "],
        "Identifiant SIREN"
      );

      // Then
      expect(res).toEqual("982 549 826");
    });
  });

  describe("extractBetween", () => {
    it("should return extracted data", async () => {
      // Given

      // When
      const res = extractBetween(
        EXTRACTED_STRINGS,
        "Adresse",
        "Activité Principale Exercée"
      );

      // Then
      expect(res).toEqual("4 BD PASTEUR 44100 NANTES");
    });

    it("edge-cases", async () => {
      // Given

      // When
      const res = extractBetween([], "Adresse", "Activité Principale Exercée");

      // Then
      expect(res).toEqual(undefined);
    });

    it("should trim", async () => {
      // Given

      // When
      const res = extractBetween(
        [
          "Adresse 4 BD PASTEUR ",
          " 44100 NANTES ",
          "Activité Principale Exercée (APE)62.02A - Conseil en systèmes et logiciels informatiques"
        ],
        "Adresse",
        "Activité Principale Exercée"
      );

      // Then
      expect(res).toEqual("4 BD PASTEUR 44100 NANTES");
    });
  });

  describe("toDate", () => {
    it("should return date object", async () => {
      // Given

      // When
      const res = toDate("30/04/2015");

      // Then
      expect(res?.toISOString()).toEqual("2015-04-30T00:00:00.000Z");
    });

    it.each(["", "test", "30-04-1990"])(
      "edge-case %p > should return undefined",
      async input => {
        // Given

        // When
        const res = toDate(input);

        // Then
        expect(res).toEqual(undefined);
      }
    );
  });

  describe("extractEmittedAt", () => {
    it("should return emittedAt", async () => {
      // Given

      // When
      const res = extractEmittedAt(EXTRACTED_STRINGS);

      // Then
      expect(res?.toISOString()).toEqual("2024-02-14T00:00:00.000Z");
    });

    it.each([[["À la date du"]], [["A la date du"]], [[""]], [[]]])(
      "invalid use-case  %p > should throw",
      async input => {
        // Given

        // When
        expect.assertions(1);
        try {
          extractEmittedAt(input);
        } catch (e) {
          // Then
          expect(e.message).toEqual("Invalid emittedAt");
        }
      }
    );

    it.each([[["À la date du 14/02/2024"]], [["A la date du 14/02/2024"]]])(
      "testing wording %p > should return emittedAt",
      async input => {
        // Given

        // When
        const res = extractEmittedAt(input);

        // Then
        expect(res?.toISOString()).toEqual("2024-02-14T00:00:00.000Z");
      }
    );
  });

  describe("extractSiret", () => {
    it("should return siret", async () => {
      // Given

      // When
      const res = extractSiret(EXTRACTED_STRINGS);

      // Then
      expect(res).toEqual("98254982600013");
    });

    it.each([
      [[]],
      [["Identifiant SIRET du siège"]],
      [["Identifiant SIRET du siège921"]],
      [["Identifiant SIRET du siège000 000 000 00000"]]
    ])("invalid use-case %p > should throw", async input => {
      // Given

      // When
      expect.assertions(1);
      try {
        extractSiret(input);
      } catch (e) {
        // Then
        expect(e.message).toEqual("Invalid siret");
      }
    });
  });

  describe("extractName", () => {
    it("should return dénomination", async () => {
      // Given

      // When
      const res = extractName(EXTRACTED_STRINGS);

      // Then
      expect(res).toEqual("ACME CORP");
    });

    it("should return nom + prénom", async () => {
      // Given

      // When
      const res = extractName(["NomLE BLANC", "PrénomsGANDALF"]);

      // Then
      expect(res).toEqual("GANDALF LE BLANC");
    });

    it.each([[[]], [[""]], [["Dénomination"]], [["Nom", "Prénoms"]]])(
      "invalid use-case %p > should throw",
      async input => {
        // Given

        // When
        expect.assertions(1);
        try {
          extractName(input);
        } catch (e) {
          // Then
          expect(e.message).toEqual("Invalid name");
        }
      }
    );
  });

  describe("extractCodeNaf", () => {
    it("should return codeNaf", async () => {
      // Given

      // When
      const res = extractCodeNaf(EXTRACTED_STRINGS);

      // Then
      expect(res).toEqual("6202A");
    });

    it("should format codeNaf", async () => {
      // Given

      // When
      const res = extractCodeNaf([
        "Activité Principale Exercée (APE)62.02a - Conseil en systèmes et logiciels informatiques"
      ]);

      // Then
      expect(res).toEqual("6202A");
    });

    it.each([[[]], [[""]], [["Activité Principale Exercée (APE)"]], [["Nom"]]])(
      "invalid use-case %p > should throw",
      async input => {
        // Given

        // When
        expect.assertions(1);
        try {
          extractCodeNaf(input);
        } catch (e) {
          // Then
          expect(e.message).toEqual("Invalid codeNaf");
        }
      }
    );
  });

  describe("extractAddress", () => {
    it("should return address", async () => {
      // Given

      // When
      const res = extractAddress(EXTRACTED_STRINGS);

      // Then
      expect(res).toEqual("4 BD PASTEUR 44100 NANTES");
    });

    it.each([[[]], [[""]], [["Adresse"]]])(
      "invalid use-case %p > should throw",
      async input => {
        // Given

        // When
        expect.assertions(1);
        try {
          extractAddress(input);
        } catch (e) {
          // Then
          expect(e.message).toEqual("Invalid address");
        }
      }
    );
  });

  describe("extractData", () => {
    it("should return extracted data", async () => {
      // Given

      // When
      const res = extractData(EXTRACTED_STRINGS.join("\n"));

      // Then
      expect(res).toEqual({
        address: "4 BD PASTEUR 44100 NANTES",
        codeNaf: "6202A",
        name: "ACME CORP",
        pdfEmittedAt: new Date("2024-02-14T00:00:00.000Z"),
        siret: "98254982600013"
      });
    });
  });

  describe("validateAndExtractSireneDataFromPDFInBase64", () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should validate & return extracted data", async () => {
      // Given
      pdfParser.mockImplementation(
        () =>
          new Promise(res =>
            res({
              metadata: { _metadata: METADATA },
              info: INFO,
              text: EXTRACTED_STRINGS.join("\n")
            })
          )
      );

      // When
      const res = await validateAndExtractSireneDataFromPDFInBase64("dGVzdAo=");

      // Then
      expect(res).toEqual({
        address: "4 BD PASTEUR 44100 NANTES",
        codeNaf: "6202A",
        name: "ACME CORP",
        siret: "98254982600013"
      });
    });

    it("info is invalid > should throw", async () => {
      // Given
      pdfParser.mockImplementation(
        () =>
          new Promise(res =>
            res({
              metadata: { _metadata: METADATA },
              info: {},
              text: EXTRACTED_STRINGS.join("\n")
            })
          )
      );

      // When
      expect.assertions(1);
      try {
        await validateAndExtractSireneDataFromPDFInBase64("dGVzdAo=");
      } catch (e) {
        // Then
        expect(e.message).toEqual("PDF non valide");
      }
    });

    it("metadata is invalid > should throw", async () => {
      // Given
      pdfParser.mockImplementation(
        () =>
          new Promise(res =>
            res({
              metadata: { _metadata: {} },
              info: INFO,
              text: EXTRACTED_STRINGS.join("\n")
            })
          )
      );

      // When
      expect.assertions(1);
      try {
        await validateAndExtractSireneDataFromPDFInBase64("dGVzdAo=");
      } catch (e) {
        // Then
        expect(e.message).toEqual("PDF non valide");
      }
    });

    it("pdf is too old > should throw", async () => {
      // Given
      pdfParser.mockImplementation(
        () =>
          new Promise(res =>
            res({
              metadata: { _metadata: METADATA },
              info: INFO,
              text: ["À la date du 14/02/2023", ...EXTRACTED_STRINGS].join("\n")
            })
          )
      );

      // When
      expect.assertions(1);
      try {
        await validateAndExtractSireneDataFromPDFInBase64("dGVzdAo=");
      } catch (e) {
        // Then
        expect(e.message).toEqual("Le PDF doit avoir moins de 3 mois");
      }
    });

    it("metadata looks hacky > should throw", async () => {
      // Given
      pdfParser.mockImplementation(
        () =>
          new Promise(res =>
            res({
              metadata: {
                _metadata: {
                  ...METADATA,
                  "dc:description": "Situation au répertoire Sirene${{7*7}}"
                }
              },
              info: INFO,
              text: EXTRACTED_STRINGS.join("\n")
            })
          )
      );

      // When
      expect.assertions(1);
      try {
        await validateAndExtractSireneDataFromPDFInBase64("dGVzdAo=");
      } catch (e) {
        // Then
        expect(e.message).toEqual("PDF non valide");
      }
    });

    it("info looks hacky > should throw", async () => {
      // Given
      pdfParser.mockImplementation(
        () =>
          new Promise(res =>
            res({
              metadata: { _metadata: METADATA },
              info: {
                ...INFO,
                Keywords: "Insee, Avis de situation, sirene${{7*7}}"
              },
              text: EXTRACTED_STRINGS.join("\n")
            })
          )
      );

      // When
      expect.assertions(1);
      try {
        await validateAndExtractSireneDataFromPDFInBase64("dGVzdAo=");
      } catch (e) {
        // Then
        expect(e.message).toEqual("PDF non valide");
      }
    });

    it("text looks hacky > should throw", async () => {
      // Given
      pdfParser.mockImplementation(
        () =>
          new Promise(res =>
            res({
              metadata: { _metadata: METADATA },
              info: INFO,
              text: [...EXTRACTED_STRINGS, "${{7*7}}"].join("\n")
            })
          )
      );

      // When
      expect.assertions(1);
      try {
        await validateAndExtractSireneDataFromPDFInBase64("dGVzdAo=");
      } catch (e) {
        // Then
        expect(e.message).toEqual("PDF non valide");
      }
    });

    it("pdf is not base64 > should throw", async () => {
      // Given

      // When
      expect.assertions(1);
      try {
        await validateAndExtractSireneDataFromPDFInBase64("pdf not in base64");
      } catch (e) {
        // Then
        expect(e.message).toEqual("PDF non valide");
      }
    });
  });
});
