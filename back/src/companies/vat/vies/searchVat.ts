import { UserInputError } from "apollo-server-express";
import { createClientAsync, Client, IOptions } from "soap";
import { checkVAT } from "jsvat";
import { CompanyVatSearchResult, ViesResult } from "./types";
import { countries } from "../../../common/constants/companySearchHelpers";
import logger from "../../../logging/logger";

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
        invalidArgs: ["vat"]
      }
    );
  }
  if (!isValid) {
    throw new UserInputError(
      "Le numéro de TVA intracommunautaire n'est pas valide",
      {
        invalidArgs: ["vat"]
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

    return {
      vatNumber: vatNumber,
      address: viesResult.address,
      name: viesResult.name,
      codePaysEtrangerEtablissement: country.isoCode.short,
      statutDiffusionEtablissement: "O"
    };
  } catch (err) {
    if (err instanceof UserInputError) {
      throw err;
    }
    logger.error(
      `Error requesting VIES Server ${getReadableErrorMsg(err.message)}`,
      err
    );
    throw Error(err.message);
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
