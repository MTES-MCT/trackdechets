import { ForbiddenError } from "apollo-server-express";
import { Prisma, Bsff } from "@prisma/client";
import { BsffSignatureType } from "../generated/graphql/types";

// Fields that can be updated via `updateBsff`
type EditableFields = keyof Omit<
  Prisma.BsffUpdateInput,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "isDeleted"
  | "isDraft"
  | "status"
  | "detenteurCompanySirets"
  | "emitterEmissionSignatureAuthor"
  | "emitterEmissionSignatureDate"
  | "transporterTransportSignatureAuthor"
  | "transporterTransportSignatureDate"
  | "destinationOperationSignatureAuthor"
  | "destinationOperationSignatureDate"
  | "destinationReceptionSignatureAuthor"
  | "destinationReceptionSignatureDate"
  | "grouping"
  | "groupedIn"
  | "repackaging"
  | "repackagedIn"
  | "forwarding"
  | "forwardedIn"
  | "ficheInterventions"
  | "packagings"
  // the below fields has been migrated to BsffPackaging and
  // will be deleted in prisma schema
  | "destinationReceptionWeight"
  | "destinationOperationCode"
  | "destinationReceptionAcceptationStatus"
  | "destinationReceptionRefusalReason"
  | "destinationOperationNextDestinationCompanyName"
  | "destinationOperationNextDestinationCompanySiret"
  | "destinationOperationNextDestinationCompanyVatNumber"
  | "destinationOperationNextDestinationCompanyAddress"
  | "destinationOperationNextDestinationCompanyContact"
  | "destinationOperationNextDestinationCompanyPhone"
  | "destinationOperationNextDestinationCompanyMail"
>;

/**
 * Defines until which signature editable fields can be modified
 * The typing Record<EditableFields, BsffSignatureType> ensure that
 * the typing will break anytime we add a field to the Bsff model so that
 * we think of adding a new edition rule
 */
const editionRules: Record<EditableFields, BsffSignatureType> = {
  type: "EMISSION",
  emitterCompanyName: "EMISSION",
  emitterCompanySiret: "EMISSION",
  emitterCompanyAddress: "EMISSION",
  emitterCompanyContact: "EMISSION",
  emitterCompanyPhone: "EMISSION",
  emitterCompanyMail: "EMISSION",
  emitterCustomInfo: "EMISSION",
  wasteCode: "EMISSION",
  wasteDescription: "EMISSION",
  wasteAdr: "EMISSION",
  weightValue: "EMISSION",
  weightIsEstimate: "EMISSION",
  transporterCompanyName: "TRANSPORT",
  transporterCompanySiret: "TRANSPORT",
  transporterCompanyVatNumber: "TRANSPORT",
  transporterCompanyAddress: "TRANSPORT",
  transporterCompanyContact: "TRANSPORT",
  transporterCompanyPhone: "TRANSPORT",
  transporterCompanyMail: "TRANSPORT",
  transporterCustomInfo: "TRANSPORT",
  transporterRecepisseNumber: "TRANSPORT",
  transporterRecepisseDepartment: "TRANSPORT",
  transporterRecepisseValidityLimit: "TRANSPORT",
  transporterTransportMode: "TRANSPORT",
  transporterTransportPlates: "TRANSPORT",
  transporterTransportTakenOverAt: "TRANSPORT",
  destinationCompanyName: "EMISSION",
  destinationCompanySiret: "EMISSION",
  destinationCompanyAddress: "EMISSION",
  destinationCompanyContact: "EMISSION",
  destinationCompanyPhone: "EMISSION",
  destinationCompanyMail: "EMISSION",
  destinationCap: "EMISSION",
  destinationCustomInfo: "OPERATION",
  destinationReceptionDate: "RECEPTION",
  destinationPlannedOperationCode: "EMISSION"
};

const editableFields = Object.keys(editionRules) as string[];

const editableFieldsAfterEmission = editableFields.filter(
  field => editionRules[field] !== "EMISSION"
);

const editableFieldsAfterTransport = editableFieldsAfterEmission.filter(
  field => editionRules[field] !== "TRANSPORT"
);

export class SealedFieldError extends ForbiddenError {
  constructor(fields: string[]) {
    super(
      `Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : ${fields.join(
        ", "
      )}`
    );
  }
}

// check updated fields are not sealed by signature
export async function checkEditionRules(
  flatInput: Prisma.BsffUpdateInput,
  existingBsff: Bsff
) {
  const sealedFieldErrors: string[] = [];

  if (existingBsff.emitterEmissionSignatureDate) {
    for (const field of Object.keys(flatInput)) {
      if (
        !editableFieldsAfterEmission.includes(field) &&
        existingBsff[field] !== flatInput[field]
      ) {
        sealedFieldErrors.push(field);
      }
    }
  }

  if (existingBsff.transporterTransportSignatureDate) {
    for (const field of Object.keys(flatInput)) {
      if (
        !editableFieldsAfterTransport.includes(field) &&
        existingBsff[field] !== flatInput[field]
      ) {
        sealedFieldErrors.push(field);
      }
    }
  }

  if (existingBsff.destinationReceptionSignatureDate) {
    // do not allow any BSFF fields to be updated after reception
    for (const field of Object.keys(flatInput)) {
      sealedFieldErrors.push(field);
    }
  }

  if (sealedFieldErrors.length > 0) {
    throw new SealedFieldError(sealedFieldErrors);
  }
}
