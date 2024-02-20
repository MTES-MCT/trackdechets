import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import pdf from "pdf-parse";
import { UserInputError } from "../../../common/errors";
import {
  ParsedPdf,
  validateInfo,
  validateMetadata,
  extractData,
  ExtractedData
} from "./extractDataFromSirene.helpers";

const extractDataFromSireneResolver: MutationResolvers["extractDataFromSirene"] =
  async (_, { pdfInBase64 }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    checkIsAuthenticated(context);

    // Convert PDF from base64 to buffer, then parse
    const buffer = Buffer.from(pdfInBase64, "base64");
    const { text, info, metadata } = await new Promise<ParsedPdf>(
      (resolve, reject) => {
        pdf(buffer)
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
      }
    );

    let data: ExtractedData;
    try {
      // Try to validate that the PDF is indeed a SIRENE-emitted "avis de situation"
      validateInfo(info);
      validateMetadata(metadata);

      // Get data
      data = extractData(text);
    } catch (e) {
      throw new UserInputError("PDF non valide");
    }

    // PDF should not be more than 3 months old
    const now = new Date();
    const threeMonthsAgo = new Date(now.setMonth(now.getMonth() - 3));
    if (
      !data.pdfEmittedAt ||
      data.pdfEmittedAt.getTime() < threeMonthsAgo.getTime()
    ) {
      throw new UserInputError("Le PDF doit avoir moins de 3 mois");
    }

    return data;
  };

export default extractDataFromSireneResolver;
