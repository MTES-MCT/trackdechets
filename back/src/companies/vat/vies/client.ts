import { checkVAT } from "jsvat";
import path from "path";
import { createClientAsync, Client, IOptions } from "soap";
import { CompanyVatSearchResult, ViesResult } from "./types";
import { countries, isVat } from "shared/constants";
import logger from "../../../logging/logger";
import { ErrorCode, UserInputError } from "../../../common/errors";
import { GraphQLError } from "graphql";

const viesUrl = path.join(__dirname, "checkVatService.wsdl");

export class ViesClientError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: {
        code: ErrorCode.EXTERNAL_SERVICE_ERROR
      }
    });
  }
}

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
    vatNumber: value!.slice(2),
    countryCode: country!.isoCode.short
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
    const address = viesResult.address === "---" ? "" : viesResult.address!;
    const name = viesResult.name === "---" ? "" : viesResult.name!;

    return {
      vatNumber: vatNumber,
      address: address,
      name: name,
      // Compat mapping avec SireneSearchResult
      codePaysEtrangerEtablissement: country!.isoCode.short,
      statutDiffusionEtablissement: "O",
      etatAdministratif: "A"
    };
  } catch (err) {
    // forward the original UserInputError
    if (err instanceof UserInputError) {
      throw err;
    }

    const fault = err.root?.Envelope?.Body?.Fault;
    const faultMessage = getReadableErrorMsg(
      fault ?? { faultstring: null, faultcode: null }
    );
    // log the error to follow VIES service unavailibility
    logger.error(`VIES client error: ${faultMessage}`, err);

    // throws UserInputError when VIES client returns the error "INVALID_INPUT"
    if (fault?.faultstring === "INVALID_INPUT") {
      throw new UserInputError(faultMessage, {
        invalidArgs: ["clue"]
      });
    }
    // Throws VIES Server unavailability message
    throw new ViesClientError(faultMessage);
  }
};

/**
 * VIES server error code to readable string
 */
export const getReadableErrorMsg = ({
  faultstring,
  faultcode
}: {
  faultstring: string;
  faultcode: string;
}): string => {
  const defaultMsg = `Le service de recherche par TVA de la commission européenne (VIES) est indisponible, veuillez réessayer dans quelques minutes (code erreur VIES: ${faultcode} ${faultstring})`;
  switch (faultstring) {
    case "INVALID_INPUT":
      return "Le service de recherche par TVA de la commission européenne (VIES) ne reconnait pas le numéro de TVA ou celui-ci est invalide";
    case "MS_UNAVAILABLE":
      return "Le service de recherche par TVA du pays d'origine est indisponible, veuillez réessayer dans quelques minutes";
    case "MS_MAX_CONCURRENT_REQ":
      return "Le service de recherche par TVA du pays d'origine reçoit un trop grand nombre de requêtes, veuillez réessayer dans quelques minutes";
    case "SERVICE_UNAVAILABLE":
      return defaultMsg;
    case "TIMEOUT":
      return defaultMsg;
    case "SERVER_BUSY":
      return defaultMsg;
    case "INVALID_REQUESTER_INFO":
      return defaultMsg;
    default:
      return defaultMsg;
  }
};
