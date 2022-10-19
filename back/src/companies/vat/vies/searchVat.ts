import { UserInputError } from "apollo-server-express";
import { ASTNode, GraphQLError } from "graphql";
import { checkVAT } from "jsvat";
import { createClientAsync, Client, IOptions } from "soap";
import { CompanyVatSearchResult, ViesResult } from "./types";
import { countries } from "../../../common/constants/companySearchHelpers";
import logger from "../../../logging/logger";
import { ErrorCode } from "../../../common/errors";

const viesUrl =
  "http://ec.europa.eu/taxation_customs/vies/checkVatService.wsdl";

/**
 * Dependency injection
 */
export const makeSoapClient =
  (
    createClientAsyncFn: (
      url: string,
      options?: IOptions,
      endpoint?: string
    ) => Promise<Client>
  ) =>
  (viesUrl: string) =>
    createClientAsyncFn(viesUrl);

const createClient = makeSoapClient(createClientAsync);

/**
 * Search and validate a TVA number using EU-EC VIES service
 * https://ec.europa.eu/taxation_customs/vies/
 */
export const client = async (
  vatNumber: string,
  createClientAsync = createClient
): Promise<CompanyVatSearchResult> => {
  const { value, isValid, country, isSupportedCountry } = checkVAT(
    vatNumber,
    countries
  );
  if (!isSupportedCountry) {
    throw new UserInputError(
      "Le code pays du numéro de TVA intracommunautaire n'est pas valide, veuillez utiliser un code pays ISO à 2 lettres",
      {
        invalidArgs: ["clue"]
      }
    );
  }
  if (!isValid || !vatNumber) {
    throw new UserInputError(
      "Le numéro de TVA intracommunautaire n'est pas valide",
      {
        invalidArgs: ["clue"]
      }
    );
  }

  const payload = {
    vatNumber: value.slice(2),
    countryCode: country.isoCode.short
  };

  const soapClient = await createClientAsync(viesUrl);
  try {
    const [viesResult]: [ViesResult] = await soapClient.checkVatAsync(payload);
    if (viesResult.valid === false) {
      // 404 "no results found"
      throw new UserInputError(
        "Aucun établissement trouvé avec ce numéro TVA intracommunautaire",
        {
          invalidArgs: ["clue"]
        }
      );
    }

    const address = viesResult.address === "---" ? "" : viesResult.address;
    const name = viesResult.name === "---" ? "" : viesResult.name;

    return {
      vatNumber: vatNumber,
      address: address,
      name: name,
      // Compat mapping avec SireneSearchResult
      codePaysEtrangerEtablissement: country.isoCode.short,
      statutDiffusionEtablissement: "O",
      etatAdministratif: "A"
    };
  } catch (err) {
    logger.error(
      `Erreur de requete au serveur de recherche de TVA VIES EC ${getReadableErrorMsg(
        err.root?.Enveloppe?.Body?.Fault?.faultstring
      )}`,
      err
    );

    // request is invalid
    if (
      err instanceof UserInputError ||
      err.root?.Enveloppe?.Body?.Fault?.faultstring === "INVALID_INPUT"
    ) {
      throw new UserInputError(
        `Echec de la recherche du numéro de TVA, le service externe de la commission européenne renvoit une erreur INVALID_INPUT ${vatNumber}`
      );
    }

    // VIES Server unavailable
    if (
      [
        "SERVICE_UNAVAILABLE",
        "MS_UNAVAILABLE",
        "TIMEOUT",
        "SERVER_BUSY",
        "MS_MAX_CONCURRENT_REQ",
        "ENOTFOUND"
      ].includes(err.root?.Enveloppe?.Body?.Fault?.faultstring)
    ) {
      throw new GraphQLError(
        "Erreur serveur externe de recherche par numéro de TVA de la commission européenne (VIES), veuillez réessayer dans quelques minutes ou si l'erreur persiste, envoyez un mail à contact@trackdechets.beta.gouv.fr avec le contexte de votre erreur",
        {
          extensions: {
            code: ErrorCode.EXTERNAL_SERVICE_ERROR
          }
        } as unknown as ASTNode
      );
    }

     // any VIES Server error
    throw new GraphQLError(err.message, {
      extensions: {
        code: ErrorCode.EXTERNAL_SERVICE_ERROR
      }
    } as unknown as ASTNode);
  }
};

/**
 * VIES server error code to readable string
 */
export const getReadableErrorMsg = (faultstring: string): string => {
  switch (faultstring) {
    case "INVALID_INPUT":
      return "The provided CountryCode is invalid or the VAT number is empty";
    case "SERVICE_UNAVAILABLE":
      return "The VIES VAT service is unavailable, please try again later";
    case "MS_UNAVAILABLE":
      return "The VAT database of the requested member country is unavailable, please try again later";
    case "MS_MAX_CONCURRENT_REQ":
      return "The VAT database of the requested member country has had too many requests, please try again later";
    case "TIMEOUT":
      return "The request to VAT database of the requested member country has timed out, please try again later";
    case "SERVER_BUSY":
      return "The service cannot process your request, please try again later";
    case "INVALID_REQUESTER_INFO":
      return "The requester info is invalid";
    default:
      return "Unknown error";
  }
};
