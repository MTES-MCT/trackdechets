import {
  BsffSignatureType,
  MutationResolvers
} from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  flattenBsffPackagingInput,
  expandBsffPackagingFromDB
} from "../../converter";
import { getBsffPackagingOrNotFound } from "../../database";
import { getCachedUserSiretOrVat } from "../../../common/redis/users";
import { UserInputError } from "apollo-server-core";
import { getBsffPackagingRepository } from "../../repository";
import { Prisma } from "@prisma/client";
import { SealedFieldError } from "./updateBsff";

const updateBsffPackaging: MutationResolvers["updateBsffPackaging"] = async (
  _,
  { id, input },
  context
) => {
  const user = checkIsAuthenticated(context);
  const existingBsffPackaging = await getBsffPackagingOrNotFound({ id });

  const userCompaniesSiretOrVat = await getCachedUserSiretOrVat(user.id);

  if (
    !userCompaniesSiretOrVat.includes(
      existingBsffPackaging.bsff.destinationCompanySiret
    )
  ) {
    throw new UserInputError(
      "Seul le destinataire du BSFF peut modifier les informations d'acceptation et d'opération sur un contenant"
    );
  }

  const flatInput = flattenBsffPackagingInput(input);

  const sealedFieldErrors: string[] = [];

  if (existingBsffPackaging.acceptationSignatureDate) {
    for (const field of Object.keys(flatInput)) {
      if (
        !editableFieldsAfterAcceptation.includes(field) &&
        existingBsffPackaging[field] !== flatInput[field]
      ) {
        sealedFieldErrors.push(field);
      }
    }
  }

  if (existingBsffPackaging.operationSignatureDate) {
    // do not allow any fields to be updated after operation signature
    for (const field in Object.keys(flatInput)) {
      sealedFieldErrors.push(field);
    }
  }

  if (sealedFieldErrors.length > 0) {
    throw new SealedFieldError(sealedFieldErrors);
  }

  const { update: updateBsffPackaging } = getBsffPackagingRepository(
    context.user
  );

  const updatedBsffPackaging = await updateBsffPackaging({
    where: { id },
    data: flatInput
  });

  return expandBsffPackagingFromDB(updatedBsffPackaging);
};

export default updateBsffPackaging;

// Fields that can be updated via `updateBsffPackaging`
type EditableFields = keyof Omit<
  Prisma.BsffPackagingUpdateInput,
  | "id"
  | "type"
  | "other"
  | "volume"
  | "weight"
  | "numero"
  | "bsff"
  | "nextPackaging"
  | "previousPackagings"
  | "acceptationSignatureAuthor"
  | "acceptationSignatureDate"
  | "operationSignatureAuthor"
  | "operationSignatureDate"
>;

/**
 * Defines until which signature editable fields can be modified
 * The typing Record<EditableFields, BsffSignatureType> ensure that
 * the typing will break anytime we add a field to the BsffPackaging model so that
 * we think of adding ther new field edition rule
 */
const editionRules: Record<EditableFields, BsffSignatureType> = {
  acceptationDate: "ACCEPTATION",
  acceptationStatus: "ACCEPTATION",
  acceptationWeight: "ACCEPTATION",
  acceptationRefusalReason: "ACCEPTATION",
  acceptationWasteCode: "ACCEPTATION",
  acceptationWasteDescription: "ACCEPTATION",
  operationDate: "OPERATION",
  operationCode: "OPERATION",
  operationDescription: "OPERATION",
  operationNoTraceability: "OPERATION",
  operationNextDestinationPlannedOperationCode: "OPERATION",
  operationNextDestinationCap: "OPERATION",
  operationNextDestinationCompanyName: "OPERATION",
  operationNextDestinationCompanySiret: "OPERATION",
  operationNextDestinationCompanyVatNumber: "OPERATION",
  operationNextDestinationCompanyAddress: "OPERATION",
  operationNextDestinationCompanyContact: "OPERATION",
  operationNextDestinationCompanyPhone: "OPERATION",
  operationNextDestinationCompanyMail: "OPERATION"
};

const editableFields = Object.keys(editionRules) as string[];

const editableFieldsAfterAcceptation = editableFields.filter(
  field => editionRules[field] !== "OPERATION"
);
