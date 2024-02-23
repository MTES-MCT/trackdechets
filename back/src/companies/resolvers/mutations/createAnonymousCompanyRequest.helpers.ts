import pdfParser from "pdf-parse";
import { isSiret, nafCodes } from "@td/constants";
import { isBase64, looksHacky } from "../../../utils";

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

/**
 * Basic validation on the PDF's info. We can't verify much as there
 * are discrepencies between different "Avis de situation".
 */
export const validateInfoOrThrow = (info: any) => {
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

  return true;
};

export interface Metadata {
  "dc:creator": string;
  "dc:subject": string;
  "dc:description": string;
  "dc:title": string;
  "pdfuaid:part": string;
}

/**
 * Basic validation on the PDF's metadata. We can't verify much as there
 * are discrepencies between different "Avis de situation".
 */
export const validateMetadataOrThrow = (metadata: any) => {
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

  return true;
};

/**
 * Extract data from a line, given its label. For instance if:
 * texts = [
 *   ...
 *   "Siret90000000000000"
 *   ...
 * ];
 * Then extractLine(texts, "Siret") = "90000000000000"
 */
export const extractLine = (texts: string[], label: string) => {
  return texts
    .find(s => s.includes(label))
    ?.replace(label, "")
    .trim();
};

/**
 * Data extraction can sometimes be tricky, because not all line are labelled.
 *
 * For instance:
 * texts = [
 *   ...
 *   "Adresse4 Boulevard Pasteur",
 *   "44100 Nantes",
 *   "Code Naf60.13A",
 *   ...
 * ];
 *
 * Here the address is on 2 separate lines, and the second one isn't labelled.
 * So we can extract it with extractBetween(texts, "Adresse", "Code Naf"),
 * which will return "4 Boulevard Pasteur 44100 Nantes"
 */
export const extractBetween = (
  texts: string[],
  label1: string,
  label2: string
) => {
  const res: string[] = [];

  const startIndex = texts.indexOf(texts.find(s => s.includes(label1)) || "");
  // Careful! There can be multiple lines with the same label. Use the last one
  const endIndex = texts
    .map((t, i) => (t.includes(label2) ? i : undefined))
    .filter(Boolean)
    .pop();

  if (startIndex !== -1 && endIndex && endIndex !== -1) {
    texts.forEach((text, i) => {
      if (i === startIndex) res.push(text.replace(label1, ""));
      else if (i > startIndex && i < endIndex) res.push(text);
    });
  }

  if (!res.length) {
    return undefined;
  }

  return res
    .map(r => r.trim())
    .filter(Boolean)
    .join(" ");
};

/**
 * Converts a french-formatted date string (dd/MM/yyyy) into a JS Date object
 */
export const toDate = (ddMMyyy: string) => {
  if (
    !RegExp(/^(0?[1-9]|[12][0-9]|3[01])\/(0?[1-9]|1[012])[/-]\d{4}$/).test(
      ddMMyyy
    )
  ) {
    return undefined;
  }

  const splitted = ddMMyyy.split("/");

  return new Date(+splitted[2], parseInt(splitted[1]) - 1, +splitted[0]);
};

export const extractEmittedAt = (texts: string[]) => {
  const emittedAt =
    extractLine(texts, "À la date du ") ?? extractLine(texts, "A la date du ");

  if (!emittedAt) {
    throw new Error("Invalid emittedAt");
  }

  return toDate(emittedAt);
};

export const extractSiret = (texts: string[]) => {
  const siret = extractLine(texts, "Identifiant SIRET du siège")?.replace(
    / /g,
    ""
  );

  if (!siret || !siret.length || !isSiret(siret)) {
    throw new Error("Invalid siret");
  }

  return siret;
};

/**
 * Get the name of the company. If the company doesn't have a name
 * (ie: auto-entrepreneurs), then return the name of the founder
 */
export const extractName = (texts: string[]) => {
  const lastName = extractLine(texts, "Nom");
  const firstNames = extractLine(texts, "Prénoms");
  const denomination = extractLine(texts, "Dénomination");

  if (!lastName && !firstNames && !denomination) {
    throw new Error("Invalid name");
  }

  return denomination ?? `${firstNames} ${lastName}`;
};

/**
 * Return the codeNaf, without its label, and in a TD-standardized fashion,
 * ie: 90.3A => 903A
 */
export const extractCodeNaf = (texts: string[]) => {
  const codeNaf = extractLine(texts, "Activité Principale Exercée (APE)");

  if (!codeNaf) {
    throw new Error("Invalid codeNaf");
  }

  const formatted = codeNaf.split("-")[0].replace(".", "").toUpperCase().trim();

  if (!Object.keys(nafCodes).includes(formatted)) {
    throw new Error("Invalid codeNaf");
  }

  return formatted;
};

export const extractAddress = (texts: string[]) => {
  const address = extractBetween(texts, "Adresse", "Activité Principale");

  if (!address || !address.length) {
    throw new Error("Invalid address");
  }

  return address;
};

export interface ExtractedData {
  siret: string;
  name: string;
  codeNaf: string;
  address: string;
  pdfEmittedAt?: Date;
}

/**
 * Make some sense out of the PDF-extracted text. Return only
 * relevant fields.
 */
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

export interface ParsedPdf {
  text: string;
  info: Info;
  metadata: Metadata;
}

/**
 * Parse a base64 PDF into a string[], using the pdf-parse library
 */
export const parseBase64 = async (pdf: string): Promise<ParsedPdf> => {
  if (!isBase64(pdf)) {
    throw new Error(`PDF non valide`);
  }

  try {
    // Convert PDF from base64 to buffer...
    const buffer = Buffer.from(pdf, "base64");

    // ...then parse it
    const data = await new Promise<ParsedPdf>((resolve, reject) => {
      pdfParser(buffer)
        .then(data => {
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
  } catch (e) {
    throw new Error("PDF non valide");
  }
};

/**
 * Extract relevant company info from an "Avis de situation SIRENE"'s PDF,
 * converted to base64. Will make as much assertions as possible to guarantee
 * the legitness of the PDF. PDF must not be older than 3 months.
 */
export const validateAndExtractSireneDataFromPDFInBase64 = async (
  pdf: string
): Promise<Omit<ExtractedData, "pdfEmittedAt">> => {
  const { text, info, metadata } = await parseBase64(pdf);

  // If it looks fishy, don't even go further. Not storing dangerous stuff
  if (looksHacky(JSON.stringify({ text, info, metadata }))) {
    console.log(JSON.stringify({ text, info, metadata }));
    throw new Error("PDF non valide");
  }

  let data: ExtractedData;
  try {
    // Try to validate that the PDF is indeed a SIRENE-emitted "avis de situation"
    validateInfoOrThrow(info);
    validateMetadataOrThrow(metadata);

    // Get data
    data = extractData(text);
  } catch (e) {
    throw new Error("PDF non valide");
  }

  // PDF should not be more than 3 months old
  const now = new Date();
  const threeMonthsAgo = new Date(now.setMonth(now.getMonth() - 3));
  const { pdfEmittedAt, ...rest } = data;
  if (!pdfEmittedAt || pdfEmittedAt.getTime() < threeMonthsAgo.getTime()) {
    throw new Error("Le PDF doit avoir moins de 3 mois");
  }

  return rest;
};
