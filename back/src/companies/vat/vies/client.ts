import { UserInputError } from "apollo-server-express";
import { ASTNode, GraphQLError } from "graphql";
import { checkVAT } from "jsvat";
import path from "path";
import { createClientAsync, Client, IOptions } from "soap";
import { CompanyVatSearchResult, ViesResult } from "./types";
import {
  countries,
  isVat
} from "../../../common/constants/companySearchHelpers";
import logger from "../../../logging/logger";
import { ErrorCode } from "../../../common/errors";

const viesUrl = path.join(__dirname, "checkVatService.wsdl");

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
      "Le code pays du numéro de TVA n'est pas valide, veuillez utiliser un code pays intra-communautaire ISO à 2 lettres",
      {
        invalidArgs: ["clue"]
      }
    );
  }

  if (!isValid || !isVat(vatNumber)) {
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

    // auto-correct VIES "unknown data"
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
    // log the error to follow VIES service unavailibility
    logger.error(
      `Erreur with VAT search VIES client: ${getReadableErrorMsg(
        err.root?.Enveloppe?.Body?.Fault?.faultstring
      )}`,
      err
    );

    // forward the original exception
    if (err instanceof UserInputError) {
      throw err;
    }
    const faultstring = err.root?.Enveloppe?.Body?.Fault?.faultstring;
    // throws UserInputError when VIES client returns the error "INVALID_INPUT"
    if (faultstring === "INVALID_INPUT") {
      throw new UserInputError(
        "Le numéro de TVA recherché n'est pas reconnu par le service de recherche par TVA de la commission européenne (VIES)",
        {
          invalidArgs: ["clue"]
        }
      );
    }
    // Throws VIES Server unavailability message
    if (
      [
        "SERVICE_UNAVAILABLE",
        "MS_UNAVAILABLE",
        "TIMEOUT",
        "SERVER_BUSY",
        "MS_MAX_CONCURRENT_REQ",
        "ENOTFOUND"
      ].includes(faultstring)
    ) {
      throw new GraphQLError(getReadableErrorMsg(faultstring), {
        extensions: {
          code: ErrorCode.EXTERNAL_SERVICE_ERROR
        }
      } as unknown as ASTNode);
    }

    // Throws a generic VIES Server error
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
      return "Le code pays ou le numéro de TVA est invalide";
    case "SERVICE_UNAVAILABLE":
      return "Le service de recherche par TVA de la commission européenne (VIES) est indisponible, veuillez réessayer dans quelques minutes";
    case "MS_UNAVAILABLE":
      return "Le service de recherche par TVA du pays d'origine est indisponible, veuillez réessayer dans quelques minutes";
    case "MS_MAX_CONCURRENT_REQ":
      return "Le service de recherche par TVA du pays d'origine reçoit un trop grand nombre de requêtes, veuillez réessayer dans quelques minutes";
    case "TIMEOUT":
      return "Le service de recherche par TVA de la commission européenne (VIES) est indisponible, veuillez réessayer dans quelques minutes";
    case "SERVER_BUSY":
      return "Le service de recherche par TVA de la commission européenne (VIES) est indisponible, veuillez réessayer dans quelques minutes";
    case "INVALID_REQUESTER_INFO":
      return "Le service de recherche par TVA de la commission européenne (VIES) est indisponible, veuillez réessayer dans quelques minutes";
    default:
      return "Le service de recherche par TVA de la commission européenne (VIES) est indisponible, veuillez réessayer dans quelques minutes";
  }
};
