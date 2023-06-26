import { Prisma, Form } from "@prisma/client";
import { safeInput } from "../common/converter";
import { objectDiff } from "../forms/workflow/diff";
import { UpdateFormInput } from "../generated/graphql/types";
import { flattenFormInput } from "./converter";

type EditableBsddFields = Required<
  Omit<
    Prisma.FormCreateInput,
    | "id"
    | "createdAt"
    | "updatedAt"
    | "readableId"
    | "status"
    | "emittedBy"
    | "emittedAt"
    | "emittedByEcoOrganisme"
    | "takenOverBy"
    | "takenOverAt"
    | "sentAt"
    | "sentBy"
    | "isAccepted"
    | "receivedAt"
    | "quantityReceived"
    | "quantityReceivedType"
    | "processingOperationDone"
    | "isDeleted"
    | "receivedBy"
    | "processedBy"
    | "processedAt"
    | "nextDestinationProcessingOperation"
    | "processingOperationDescription"
    | "noTraceability"
    | "signedByTransporter"
    | "nextDestinationCompanyName"
    | "nextDestinationCompanySiret"
    | "nextDestinationCompanyAddress"
    | "nextDestinationCompanyContact"
    | "nextDestinationCompanyPhone"
    | "nextDestinationCompanyMail"
    | "nextDestinationCompanyCountry"
    | "nextDestinationCompanyVatNumber"
    | "nextDestinationNotificationNumber"
    | "nextDestinationProcessingOperation"
    | "wasteAcceptationStatus"
    | "wasteRefusalReason"
    | "signedAt"
    | "currentTransporterOrgId"
    | "nextTransporterOrgId"
    | "isImportedFromPaper"
    | "signedBy"
    | "transportSegments"
    | "groupedIn"
    | "ownerId"
    | "owner"
    | "StatusLog"
    | "bsddRevisionRequests"
    | "intermediaries"
    | "forwardedIn"
    | "recipientsSirets"
    | "transportersSirets"
    | "intermediariesSirets"
    | "forwarding"
  >
>;

// Defines until which signature BSDD fields can be modified
// The test in edition.test.ts ensures that every possible key in UpdateFormInput
// has a corresponding edition rule
export const editionRules: {
  [Key in keyof EditableBsddFields]: BsddSignatureType;
} = {
  customId: "EMISSION",
  emitterType: "EMISSION",
  emitterPickupSite: "EMISSION",
  emitterWorkSiteName: "EMISSION",
  emitterWorkSiteAddress: "EMISSION",
  emitterWorkSiteCity: "EMISSION",
  emitterWorkSitePostalCode: "EMISSION",
  emitterWorkSiteInfos: "EMISSION",
  emitterIsPrivateIndividual: "EMISSION",
  emitterIsForeignShip: "EMISSION",
  emitterCompanyName: "EMISSION",
  emitterCompanySiret: "EMISSION",
  emitterCompanyAddress: "EMISSION",
  emitterCompanyContact: "EMISSION",
  emitterCompanyPhone: "EMISSION",
  emitterCompanyMail: "EMISSION",
  emitterCompanyOmiNumber: "EMISSION",
  recipientCap: "EMISSION",
  recipientProcessingOperation: "EMISSION",
  recipientIsTempStorage: "EMISSION",
  recipientCompanyName: "EMISSION",
  recipientCompanySiret: "EMISSION",
  recipientCompanyAddress: "EMISSION",
  recipientCompanyContact: "EMISSION",
  recipientCompanyPhone: "EMISSION",
  recipientCompanyMail: "EMISSION",
  transporters: "TRANSPORT",
  wasteDetailsCode: "EMISSION",
  wasteDetailsOnuCode: "EMISSION",
  wasteDetailsPackagingInfos: "EMISSION",
  wasteDetailsQuantity: "EMISSION",
  wasteDetailsQuantityType: "EMISSION",
  wasteDetailsName: "EMISSION",
  wasteDetailsConsistence: "EMISSION",
  wasteDetailsPop: "EMISSION",
  wasteDetailsIsDangerous: "EMISSION",
  wasteDetailsParcelNumbers: "EMISSION",
  wasteDetailsAnalysisReferences: "EMISSION",
  wasteDetailsLandIdentifiers: "EMISSION",
  wasteDetailsSampleNumber: "EMISSION",
  traderCompanyName: "EMISSION",
  traderCompanySiret: "EMISSION",
  traderCompanyAddress: "EMISSION",
  traderCompanyContact: "EMISSION",
  traderCompanyPhone: "EMISSION",
  traderCompanyMail: "EMISSION",
  traderReceipt: "EMISSION",
  traderDepartment: "EMISSION",
  traderValidityLimit: "EMISSION",
  brokerCompanyName: "EMISSION",
  brokerCompanySiret: "EMISSION",
  brokerCompanyAddress: "EMISSION",
  brokerCompanyContact: "EMISSION",
  brokerCompanyPhone: "EMISSION",
  brokerCompanyMail: "EMISSION",
  brokerReceipt: "EMISSION",
  brokerDepartment: "EMISSION",
  brokerValidityLimit: "EMISSION",
  ecoOrganismeName: "EMISSION",
  ecoOrganismeSiret: "EMISSION",
  grouping: "EMISSION"
};

/**
 * Computes all the fields that will be updated
 * If a field is present in the input but has the same value as the
 * data present in the DB, we do not return it as we want to
 * allow reposting fields if they are not modified
 */
export async function getUpdatedFields(
  form: Form,
  input: UpdateFormInput
): Promise<string[]> {
  const flatInput = safeInput(flattenFormInput(input));

  // only pick keys present in the input to compute the diff between
  // the input and the data in DB
  const compareTo = Object.keys(flatInput).reduce((acc, field) => {
    return { ...acc, [field]: form[field] };
  }, {});

  const diff = objectDiff(flatInput, compareTo);

  return Object.keys(diff);
}

// BSDD cannot be updated through the mutation `updateForm` after transporter signature
type BsddSignatureType = "EMISSION" | "TRANSPORT";
