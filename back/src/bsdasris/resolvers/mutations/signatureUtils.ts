import { getCompanyOrCompanyNotFound } from "../../../companies/database";
import { BsdasriValidationContext } from "../../validation";

import {
  BsdasriSignatureInput,
  BsdasriSignatureType,
  SignatureAuthor
} from "../../../generated/graphql/types";
import { UserInputError } from "apollo-server-express";
import { Bsdasri, BsdasriStatus, BsdasriType } from "@prisma/client";

import { BsdasriEventType } from "../../workflow/types";
import { getTransporterCompanyOrgId } from "../../../common/constants/companySearchHelpers";

interface checkEmitterAllowsDirectTakeOverProps {
  signatureParams: BsdasriSignatureInfos;
  bsdasri: Bsdasri;
}

type checkEmitterAllowsDirectTakeOverFn = (
  input: checkEmitterAllowsDirectTakeOverProps
) => Promise<boolean>;
/**
 * Dasri can be taken over by transporter directly if:
 * - without emitter signature if emitter explicitly allows this in company preferences
 * - always for synthesis dasri, where emitter ans transporter are the same company
 *
 * Checking this in mutation code needs less code than doing it in the state machine, hence this util.
 * A boolean is returned to be stored on Bsdasri model iot tell apart which dasris were taken over directly.
 */
export const checkDirectakeOverIsAllowed: checkEmitterAllowsDirectTakeOverFn =
  async ({ signatureParams, bsdasri }) => {
    if (signatureParams.eventType !== BsdasriEventType.SignTransport) {
      return undefined;
    }
    if (bsdasri.status === BsdasriStatus.INITIAL) {
      if (bsdasri.type == BsdasriType.GROUPING) {
        throw new UserInputError(
          "L'emport direct est interdit pour les bordereaux dasri de groupement"
        );
      }

      // Synthesis Bsdasri are created by the transporter, so  direct `SignTransport` is allowed
      if (bsdasri.type == BsdasriType.SYNTHESIS) {
        return true;
      }

      const emitterCompany = await getCompanyOrCompanyNotFound({
        siret: bsdasri.emitterCompanySiret
      });
      if (!emitterCompany.allowBsdasriTakeOverWithoutSignature) {
        throw new UserInputError(
          "Erreur, l'émetteur n'a pas autorisé l'emport par le transporteur sans l'avoir préalablement signé"
        );
      }
      return true;
    }
    return false;
  };

interface checkEmitterAllowsSignatureWithCodeProps {
  signatureParams: BsdasriSignatureInfos;
  bsdasri: Bsdasri;
  securityCode: number;
  emissionSignatureAuthor: SignatureAuthor;
}
type checkEmitterAllowsSignatureWithCodeFn = (
  input: checkEmitterAllowsSignatureWithCodeProps
) => Promise<boolean>;
/**
 * Dasri takeOver can be processed on the transporter device
 * To perform this, we expect a INITIAL -> SIGNED_BY_PRODUCER signature, then a SIGNED_BY_PRODUCER -> SENT one
 * This function is intended to perform checks to allow the first aforementionned transition, and verify
 * provided code matches emitter's one.
 * We try to match the code with emitter secret code, then ecoorganisme secret code (if ecoorganisme belongs to the dasri)
 * A boolean is returned to be stored on Bsdasri model iot tell apart which dasris were taken over with secret code.
 */

export const checkEmissionSignedWithSecretCode: checkEmitterAllowsSignatureWithCodeFn =
  async ({
    signatureParams,
    bsdasri,
    securityCode,
    emissionSignatureAuthor
  }) => {
    const errMessage = "Erreur, le code de sécurité est invalide";
    // Filter out irrelevant event types
    if (
      signatureParams.eventType !== BsdasriEventType.SignEmissionWithSecretCode
    ) {
      return undefined;
    }
    // security code not provided
    if (!securityCode) {
      throw new UserInputError("Erreur, le code de sécurité est manquant");
    }
    if (bsdasri.status !== BsdasriStatus.INITIAL) {
      return undefined;
    }

    if (emissionSignatureAuthor === "ECO_ORGANISME") {
      const ecoorganismeCompany = await getCompanyOrCompanyNotFound({
        siret: bsdasri.ecoOrganismeSiret
      });

      if (securityCode !== ecoorganismeCompany.securityCode) {
        throw new UserInputError(errMessage, {
          errorCode: "SECRET_CODE_ERROR"
        }); // include more spécific error code for UI
      }
    }
    if (emissionSignatureAuthor === "EMITTER") {
      const emitterCompany = await getCompanyOrCompanyNotFound({
        siret: bsdasri.emitterCompanySiret
      });

      if (securityCode !== emitterCompany.securityCode) {
        throw new UserInputError(errMessage, {
          errorCode: "SECRET_CODE_ERROR"
        }); // include more spécific error code for UI
      }
    }
    return true;
  };
export const checkIsSignedByEcoOrganisme = ({
  signatureParams,
  siretWhoSigns,
  bsdasri
}) => {
  if (signatureParams.eventType !== BsdasriEventType.SignEmission) {
    return undefined;
  }
  if (!bsdasri.ecoOrganismeSiret) {
    return false;
  }
  return bsdasri.ecoOrganismeSiret === siretWhoSigns;
};
// Secret code signature rely on a specific mutation, here we use a common util to sign each dasri step
type InternalBsdasriSignatureType =
  | BsdasriSignatureType
  | "EMISSION_WITH_SECRET_CODE";

/**
 * Signature parameters configuration
 */
export const dasriSignatureMapping: Record<
  InternalBsdasriSignatureType,
  BsdasriSignatureInfos
> = {
  EMISSION: {
    author: "emitterEmissionSignatureAuthor",
    date: "emitterEmissionSignatureDate",
    eventType: BsdasriEventType.SignEmission,
    validationContext: { emissionSignature: true },
    signatoryField: "emissionSignatory",

    authorizedSirets: bsdasri =>
      bsdasri.type === BsdasriType.SIMPLE
        ? [bsdasri.ecoOrganismeSiret, bsdasri.emitterCompanySiret].filter(
            Boolean
          )
        : [bsdasri.emitterCompanySiret]
  },

  EMISSION_WITH_SECRET_CODE: {
    author: "emitterEmissionSignatureAuthor",
    date: "emitterEmissionSignatureDate",
    eventType: BsdasriEventType.SignEmissionWithSecretCode,
    validationContext: { emissionSignature: true },
    signatoryField: "emissionSignatory",
    authorizedSirets: bsdasri => [getTransporterCompanyOrgId(bsdasri)] // transporter can sign with emitter secret code (trs device)
  },
  TRANSPORT: {
    author: "transporterTransportSignatureAuthor",
    date: "transporterTransportSignatureDate",
    eventType: BsdasriEventType.SignTransport,
    validationContext: { emissionSignature: true, transportSignature: true }, // validate emission in case of direct takeover

    signatoryField: "transportSignatory",
    authorizedSirets: bsdasri => [getTransporterCompanyOrgId(bsdasri)]
  },

  RECEPTION: {
    author: "destinationReceptionSignatureAuthor",
    date: "destinationReceptionSignatureDate",
    eventType: BsdasriEventType.SignReception,
    validationContext: { receptionSignature: true },
    signatoryField: "receptionSignatory",
    authorizedSirets: bsdasri => [bsdasri.destinationCompanySiret]
  },
  OPERATION: {
    author: "destinationOperationSignatureAuthor",
    date: "destinationOperationSignatureDate",
    eventType: BsdasriEventType.SignOperation,
    validationContext: { operationSignature: true },
    signatoryField: "operationSignatory",
    authorizedSirets: bsdasri => [bsdasri.destinationCompanySiret]
  }
};

interface getFieldsUpdateProps {
  bsdasri: Bsdasri;
  input: BsdasriSignatureInput;
}

type getFieldsUpdateFn = (input: getFieldsUpdateProps) => Partial<Bsdasri>;

/**
 * A few fields obey to a custom logic
 */
export const getFieldsUpdate: getFieldsUpdateFn = ({ bsdasri, input }) => {
  // on reception signature, fill handedOverToRecipientAt if not already completed
  if (input.type === "RECEPTION" && !bsdasri.handedOverToRecipientAt) {
    return {
      handedOverToRecipientAt: bsdasri.destinationReceptionDate
    };
  }
  return {};
};

type BsdasriSignatureInfos = {
  author:
    | "emitterEmissionSignatureAuthor"
    | "transporterTransportSignatureAuthor"
    | "destinationReceptionSignatureAuthor"
    | "destinationOperationSignatureAuthor";
  date:
    | "emitterEmissionSignatureDate"
    | "transporterTransportSignatureDate"
    | "destinationReceptionSignatureDate"
    | "destinationOperationSignatureDate";
  eventType: BsdasriEventType;

  authorizedSirets: (bsdasri: Bsdasri) => string[];
  validationContext: BsdasriValidationContext;
  signatoryField:
    | "emissionSignatory"
    | "transportSignatory"
    | "receptionSignatory"
    | "operationSignatory";
};
