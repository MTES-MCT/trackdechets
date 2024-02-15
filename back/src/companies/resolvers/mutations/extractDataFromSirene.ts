import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import pdf from "pdf-parse";
import { UserInputError } from "../../../common/errors";

interface Info {
  PDFFormatVersion: string;
  IsAcroFormPresent: boolean;
  IsXFAPresent: boolean;
  Title: string;
  Author: string;
  Subject: string;
  Keywords: string;
  Producer: string;
  CreationDate: string;
  ModDate: string;
}

interface Metadata {
  "dc:creator": string;
  "dc:subject": string;
  "dc:description": string;
  "dc:title": string;
  "pdfuaid:part": string;
}

interface ParsedPdf {
  text: string;
  info: Info;
  metadata: Metadata;
}

const extractDataFromSireneResolver: MutationResolvers["extractDataFromSirene"] =
  async (parent, { pdfInBase64 }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);

    const buffer = Buffer.from(pdfInBase64, "base64");

    const { text, info, metadata } = await new Promise<ParsedPdf>(
      (resolve, reject) => {
        pdf(buffer)
          .then(function (data) {
            resolve({
              text: data.text,
              info: data.info,
              metadata: data.metadata._metadata
            });
          })
          .catch(error => {
            reject(error);
          });
      }
    );

    try {
      validateInfo(info);
      validateMetadata(metadata);
    } catch (e) {
      throw new UserInputError("PDF non valide");
    }

    try {
      const data = extractData(text);

      return data;
    } catch (e) {
      throw new UserInputError("PDF non valide");
    }
  };

export default extractDataFromSireneResolver;

const validateInfo = (info: any) => {
  if (info.Title !== "Avis de situation au répertoire Sirene") {
    throw new Error("Invalid info title");
  }

  if (
    info.Author !==
    "Institut National de la Statistique et des Etudes Economiques"
  ) {
    throw new Error("Invalid info author");
  }
};

const validateMetadata = (metadata: any) => {
  if (
    metadata["dc:creator"] !==
    "Institut National de la Statistique et des Etudes Economiques"
  ) {
    throw new Error("Invalid metadata creator");
  }

  if (metadata["dc:title"] !== "Avis de situation au répertoire Sirene") {
    throw new Error("Invalid metadata title");
  }
};

const extractLine = (texts: string[], label: string) => {
  return texts
    .find(s => s.includes(label))
    ?.replace(label, "")
    .trim();
};

const extractBetween = (texts: string[], label1: string, label2: string) => {
  let res: string[] = [];

  const startIndex = texts.indexOf(texts.find(s => s.includes(label1)) || "");
  // Careful! There can be multiple lines with the same label. Use the last one
  const endIndex = texts
    .map((t, i) => (t.includes(label2) ? i : undefined))
    .filter(Boolean)
    .pop();

  if (startIndex && endIndex) {
    texts.forEach((text, i) => {
      if (i === startIndex) res.push(text.replace(label1, ""));
      else if (i > startIndex && i < endIndex) res.push(text);
    });
  }

  return res
    .map(r => r.trim())
    .filter(Boolean)
    .join(" ");
};

const toDate = (ddMMyyy: string) => {
  const splitted = ddMMyyy.split("/");

  return new Date(+splitted[2], parseInt(splitted[1]) - 1, +splitted[0]);
};

const extractData = (text: string) => {
  const splitted = text
    .split("\n")
    .filter(s => s !== "\n")
    .filter(Boolean);

  const pdfEmittedAt =
    extractLine(splitted, "À la date du ") ??
    extractLine(splitted, "A la date du ");
  const createdAt =
    extractLine(
      splitted,
      "Description de l'entrepriseEntreprise active depuis le "
    ) ?? extractLine(splitted, "Entreprise active depuis le");
  const siret = extractLine(splitted, "Identifiant SIRET du siège")?.replace(
    / /g,
    ""
  );
  const lastName = extractLine(splitted, "Nom");
  const firstNames = extractLine(splitted, "Prénoms");
  const name =
    extractLine(splitted, "Dénomination") ?? `${firstNames} ${lastName}`;
  const codeNaf = extractLine(splitted, "Activité Principale Exercée (APE)");
  const address = extractBetween(splitted, "Adresse", "Activité Principale");

  return {
    pdfEmittedAt: pdfEmittedAt ? toDate(pdfEmittedAt) : undefined,
    createdAt: createdAt ? toDate(createdAt) : undefined,
    siret,
    name,
    codeNaf,
    address
  };
};
