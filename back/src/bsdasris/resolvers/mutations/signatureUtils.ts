import { getCompanyOrCompanyNotFound } from "../../../companies/database";
import { BsdasriValidationContext } from "../../validation";

import { BsdasriSignatureType } from "../../../generated/graphql/types";
import { UserInputError } from "apollo-server-express";
import { Bsdasri, BsdasriStatus, BsdasriType } from "@prisma/client";

import { BsdasriEventType } from "../../workflow/types";
type checkEmitterAllowsDirectTakeOverFn = ({
  signatureParams: BsdasriSignatureInfos,
  bsdasri: Bsdasri
}) => Promise<boolean>;
/**
 * Dasri can be taken over by transporter without signature if emitter explicitly allows this in company preferences
 * Checking this in mutation code needs less code than doing it in the state machine, hence this util.
 * A boolean is returned to be stored on Bsdasri model iot tell apart which dasris were taken over directly.
 */
export const checkEmitterAllowsDirectTakeOver: checkEmitterAllowsDirectTakeOverFn = async ({
  signatureParams,
  bsdasri
}) => {
  if (
    signatureParams.eventType === BsdasriEventType.SignTransport &&
    bsdasri.status === BsdasriStatus.INITIAL
  ) {
    if (bsdasri.type !== BsdasriType.SIMPLE) {
      throw new UserInputError(
        "L'emport direct est interdit pour les bordereaux dasri de groupement"
      );
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

type checkEmitterAllowsSignatureWithCodeFn = ({
  signatureParams: BsdasriSignatureInfos,
  bsdasri: Dasri,
  securityCode: number
}) => Promise<boolean>;
/**
 * Dasri takeOver can be processed on the transporter device
 * To perform this, we expect a SEALED -> READY_TO_TAKEOVER signature, then a READY_TO_TAKEOVER -> SENT one
 * This function is intended to perform checks to allow the first aforementionned transition, and verify
 * provided code matches emitter's one.
 * A boolean is returned to be stored on Bsdasri model iot tell apart which dasris were taken over with secret code.
 */
export const checkEmitterAllowsSignatureWithSecretCode: checkEmitterAllowsSignatureWithCodeFn = async ({
  signatureParams,
  bsdasri,
  securityCode
}) => {
  if (!securityCode) {
    return false;
  }
  if (
    signatureParams.eventType !== BsdasriEventType.SignEmissionWithSecretCode ||
    bsdasri.status !== BsdasriStatus.INITIAL
  ) {
    return false;
  }
  const emitterCompany = await getCompanyOrCompanyNotFound({
    siret: bsdasri.emitterCompanySiret
  });

  if (!securityCode || securityCode !== emitterCompany.securityCode) {
    throw new UserInputError(
      "Erreur, le code de sécurité est manquant ou invalide"
    );
  }
  return true;
};

// Secret code signature rely on a specific mutation, here we use a common util to sign each dasri step
type InternalBsdasriSignatureType =
  | BsdasriSignatureType
  | "EMISSION_WITH_SECRET_CODE";

/**
 * Parameters to pass to state machine
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
    authorizedSiret: bsdasri => bsdasri.emitterCompanySiret
  },
  EMISSION_WITH_SECRET_CODE: {
    author: "emitterEmissionSignatureAuthor",
    date: "emitterEmissionSignatureDate",
    eventType: BsdasriEventType.SignEmissionWithSecretCode,
    validationContext: { emissionSignature: true },
    signatoryField: "emissionSignatory",
    authorizedSiret: bsdasri => bsdasri.transporterCompanySiret // transporter can sign with emitter secret code (trs device)
  },
  TRANSPORT: {
    author: "transporterTransportSignatureAuthor",
    date: "transporterTransportSignatureDate",
    eventType: BsdasriEventType.SignTransport,
    validationContext: { emissionSignature: true, transportSignature: true }, // validate emission in case of direct takeover

    signatoryField: "transportSignatory",
    authorizedSiret: bsdasri => bsdasri.transporterCompanySiret
  },

  RECEPTION: {
    author: "destinationReceptionSignatureAuthor",
    date: "destinationReceptionSignatureDate",
    eventType: BsdasriEventType.SignReception,
    validationContext: { receptionSignature: true },
    signatoryField: "receptionSignatory",
    authorizedSiret: bsdasri => bsdasri.destinationCompanySiret
  },
  OPERATION: {
    author: "destinationOperationSignatureAuthor",
    date: "destinationOperationSignatureDate",
    eventType: BsdasriEventType.SignOperation,
    validationContext: { operationSignature: true },
    signatoryField: "operationSignatory",
    authorizedSiret: bsdasri => bsdasri.destinationCompanySiret
  }
};

type getFieldsUpdateFn = ({
  bsdasri: Dasri,
  input: BsdasriSignatureInput
}) => Partial<Bsdasri>;

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
  authorizedSiret: (bsdasri: Bsdasri) => string;
  validationContext: BsdasriValidationContext;
  signatoryField:
    | "emissionSignatory"
    | "transportSignatory"
    | "receptionSignatory"
    | "operationSignatory";
};
