import { checkIsAuthenticated } from "../../../common/permissions";

import { getDasriOrDasriNotFound } from "../../database";
import { expandDasriFromDb } from "../../dasri-converter";

import {
  MutationDasriSignArgs,
  DasriSignatureType,
  MutationResolvers
} from "../../../generated/graphql/types";
import { ObjectSchema } from "yup";
import { UserInputError } from "apollo-server-express";

import { Dasri, DasriStatus } from "@prisma/client";
import dasriTransition from "../../workflow/dasriTransition";
import { DasriEventType } from "../../workflow/types";
import { checkIsCompanyMember } from "../../../users/permissions";
import {
  okForEmissionSignatureSchema,
  okForReceptionSignatureSchema,
  okForTransportSignatureSchema,
  okForProcessingSignatureSchema
} from "../../validation";
import { getCompanyOrCompanyNotFound } from "../../../companies/database";

const dasriSign: MutationResolvers["dasriSign"] = async (
  _,
  { id, signatureInput }: MutationDasriSignArgs,
  context
) => {
  const user = checkIsAuthenticated(context);
  const dasri = await getDasriOrDasriNotFound({ id });
  const signatureParams = dasriSignatureMapping[signatureInput.type];

  // Which siret is involved in curent signature process ?
  const siretWhoSigns = signatureParams.authorizedSiret(dasri);
  // Is this siret belonging to concrete user ?
  await checkIsCompanyMember({ id: user.id }, { siret: siretWhoSigns });

  await checkEmitterAllowsDirectTakeOver({
    signatureParams,
    dasri
  });
  await checkEmitterAllowsSignatureWithSecretCode({
    signatureParams,
    dasri,
    securityCode: signatureInput?.securityCode
  });

  const data = {
    [signatureParams.by]: signatureInput.signedBy,
    [signatureParams.at]: new Date(),
    [signatureParams.signatoryField]: { connect: { id: user.id } },
    ...getFieldsUpdate({ dasri, signatureInput })
  };

  // Validate required fields are filled

  const updatedDasri = await dasriTransition(
    dasri,
    {
      type: signatureParams.eventType,
      dasriUpdateInput: data
    },
    signatureParams.validator
  );

  return expandDasriFromDb(updatedDasri);
};

export default dasriSign;

type getFieldsUpdateFn = ({
  dasri: Dasri,
  signatureInput: DasriSignatureInput
}) => Partial<Dasri>;
/**
 
 * A few fields obey to a custom logic
 */
const getFieldsUpdate: getFieldsUpdateFn = ({ dasri, signatureInput }) => {
  // on reception signature, fill handedOverToRecipientAt if not already completed
  if (signatureInput.type === "RECEPTION" && !dasri.handedOverToRecipientAt) {
    return {
      handedOverToRecipientAt: dasri.receivedAt
    };
  }
  return {};
};

type DasriSignatureInfos = {
  by:
    | "emissionSignedBy"
    | "transportSignedBy"
    | "receptionSignedBy"
    | "operationSignedBy";
  at:
    | "emissionSignedAt"
    | "transportSignedAt"
    | "receptionSignedAt"
    | "operationSignedAt";
  eventType: DasriEventType;
  authorizedSiret: (dasri: Dasri) => string;
  signatoryField:
    | "emissionSignatory"
    | "transportSignatory"
    | "receptionSignatory"
    | "operationSignatory";
  validator: ObjectSchema;
};

const dasriSignatureMapping: Record<DasriSignatureType, DasriSignatureInfos> = {
  EMISSION: {
    by: "emissionSignedBy",
    at: "emissionSignedAt",
    eventType: DasriEventType.SignEmission,
    validator: okForEmissionSignatureSchema,
    signatoryField: "emissionSignatory",
    authorizedSiret: dasri => dasri.emitterCompanySiret
  },
  EMISSION_WITH_SECRET_CODE: {
    by: "emissionSignedBy",
    at: "emissionSignedAt",
    eventType: DasriEventType.SignEmissionWithSecretCode,
    validator: okForEmissionSignatureSchema,
    signatoryField: "emissionSignatory",
    authorizedSiret: dasri => dasri.transporterCompanySiret // transporter can sign with emitter secret code (trs device)
  },
  TRANSPORT: {
    by: "transportSignedBy",
    at: "transportSignedAt",
    eventType: DasriEventType.SignTransport,
    validator: okForTransportSignatureSchema,
    signatoryField: "transportSignatory",
    authorizedSiret: dasri => dasri.transporterCompanySiret
  },

  RECEPTION: {
    by: "receptionSignedBy",
    at: "receptionSignedAt",
    eventType: DasriEventType.SignReception,
    validator: okForReceptionSignatureSchema,
    signatoryField: "receptionSignatory",
    authorizedSiret: dasri => dasri.recipientCompanySiret
  },
  OPERATION: {
    by: "operationSignedBy", // changeme
    at: "operationSignedAt",
    eventType: DasriEventType.SignOperation,
    validator: okForProcessingSignatureSchema,
    signatoryField: "operationSignatory",
    authorizedSiret: dasri => dasri.recipientCompanySiret
  }
};

type checkEmitterAllowsDirectTakeOverFn = ({
  signatureParams: DasriSignatureInfos,
  dasri: Dasri
}) => Promise<void>;
/**
 * Dasri can be taken over by transporter without signature if emitter explicitly allows this in company preferences
 * Checking this in mutation code needs less code than doing it in the state machine, hence this utils
 */
const checkEmitterAllowsDirectTakeOver: checkEmitterAllowsDirectTakeOverFn = async ({
  signatureParams,
  dasri
}) => {
  if (
    signatureParams.eventType === DasriEventType.SignTransport &&
    dasri.status === DasriStatus.SEALED
  ) {
    const emitterCompany = await getCompanyOrCompanyNotFound({
      siret: dasri.emitterCompanySiret
    });
    if (!emitterCompany.allowDasriTakeOverWithoutSignature) {
      throw new UserInputError(
        "Erreur, l'émetteur n'a pas autorisé l'emport par le transporteur sans l'avoir préalablement signé"
      );
    }
  }
};

type checkEmitterAllowsSignatureWithCodeFn = ({
  signatureParams: DasriSignatureInfos,
  dasri: Dasri,
  securityCode: number
}) => Promise<void>;
/**
 * Dasri takeOver can be processed on the transporter device
 * To perform this, we expect a SEALED -> READY_TO_TAKEOVER signature, then a READY_TO_TAKEOVER -> SENT one
 * This function is intended to perform checks to allow the first aforementionned transition, and verify
 * provided code matches emitter one
 */
const checkEmitterAllowsSignatureWithSecretCode: checkEmitterAllowsSignatureWithCodeFn = async ({
  signatureParams,
  dasri,
  securityCode
}) => {
  if (
    signatureParams.eventType !== DasriEventType.SignEmissionWithSecretCode ||
    dasri.status !== DasriStatus.SEALED
  ) {
    return;
  }
  const emitterCompany = await getCompanyOrCompanyNotFound({
    siret: dasri.emitterCompanySiret
  });

  if (!securityCode || securityCode !== emitterCompany.securityCode) {
    throw new UserInputError(
      "Erreur, le code de sécurité est manquant ou invalide"
    );
  }
};
