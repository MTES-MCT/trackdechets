import pdfParser from "pdf-parse";
import { isSiret } from "../../../../../libs/shared/constants/src";

export interface Info {
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

export interface Metadata {
  "dc:creator": string;
  "dc:subject": string;
  "dc:description": string;
  "dc:title": string;
  "pdfuaid:part": string;
}

export interface ParsedPdf {
  text: string;
  info: Info;
  metadata: Metadata;
}

export const validateInfo = (info: any) => {
  if (!info) {
    throw new Error("Invalid info");
  }

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

export const validateMetadata = (metadata: any) => {
  if (!metadata) {
    throw new Error("Invalid metadata");
  }

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

export const extractLine = (texts: string[], label: string) => {
  return texts
    .find(s => s.includes(label))
    ?.replace(label, "")
    .trim();
};

export const extractBetween = (
  texts: string[],
  label1: string,
  label2: string
) => {
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

export const toDate = (ddMMyyy: string) => {
  const splitted = ddMMyyy.split("/");

  return new Date(+splitted[2], parseInt(splitted[1]) - 1, +splitted[0]);
};

export const extractEmittedAt = (texts: string[]) => {
  const emittedAt =
    extractLine(texts, "À la date du ") ?? extractLine(texts, "A la date du ");
  return emittedAt ? toDate(emittedAt) : undefined;
};

export const extractCreatedAt = (texts: string[]) => {
  const createdAt =
    extractLine(
      texts,
      "Description de l'entrepriseEntreprise active depuis le "
    ) ?? extractLine(texts, "Entreprise active depuis le");
  return createdAt ? toDate(createdAt) : undefined;
};

export const extractSiret = (texts: string[]) => {
  const siret = extractLine(texts, "Identifiant SIRET du siège")?.replace(
    / /g,
    ""
  );

  if (!siret || !isSiret(siret)) {
    throw new Error("Invalid siret");
  }

  return siret;
};

export const extractName = (texts: string[]) => {
  const lastName = extractLine(texts, "Nom");
  const firstNames = extractLine(texts, "Prénoms");
  return extractLine(texts, "Dénomination") ?? `${firstNames} ${lastName}`;
};

export const extractCodeNaf = (texts: string[]) => {
  const codeNaf = extractLine(texts, "Activité Principale Exercée (APE)");

  if (!codeNaf) {
    throw new Error("Invalid codeNaf");
  }

  return codeNaf.split("-")[0].replace(".", "").trim();
};

export const extractAddress = (texts: string[]) => {
  const address = extractBetween(texts, "Adresse", "Activité Principale");

  if (!address) throw new Error("Invalid address");

  return address;
};

export interface ExtractedData {
  pdfEmittedAt?: Date;
  siret: string;
  name: string;
  codeNaf: string;
  address: string;
}

export const extractData = (text: string): ExtractedData => {
  const splitted = text
    .split("\n")
    .filter(s => s !== "\n")
    .filter(Boolean);

  return {
    pdfEmittedAt: extractEmittedAt(splitted),
    siret: extractSiret(splitted),
    name: extractName(splitted),
    codeNaf: extractCodeNaf(splitted),
    address: extractAddress(splitted)
  };
};

export const parseBase64 = async (pdf: string): Promise<ParsedPdf> => {
  // Convert PDF from base64 to buffer, then parse
  const buffer = Buffer.from(pdf, "base64");
  const data = await new Promise<ParsedPdf>((resolve, reject) => {
    pdfParser(buffer)
      .then(function (data) {
        resolve({
          text: data.text,
          info: data.info,
          metadata: data.metadata?._metadata
        });
      })
      .catch(error => {
        reject(error);
      });
  });

  return data;
};

export const validateAndExtractSireneDataFromPDFInBase64 = async (
  pdf: string
): Promise<ExtractedData> => {
  const { text, info, metadata } = await parseBase64(pdf);

  let data: ExtractedData;
  try {
    // Try to validate that the PDF is indeed a SIRENE-emitted "avis de situation"
    validateInfo(info);
    validateMetadata(metadata);

    // Get data
    data = extractData(text);
  } catch (e) {
    throw new Error("PDF non valide");
  }

  // PDF should not be more than 3 months old
  const now = new Date();
  const threeMonthsAgo = new Date(now.setMonth(now.getMonth() - 3));
  if (
    !data.pdfEmittedAt ||
    data.pdfEmittedAt.getTime() < threeMonthsAgo.getTime()
  ) {
    throw new Error("Le PDF doit avoir moins de 3 mois");
  }

  return data;
};
