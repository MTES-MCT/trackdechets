import { Form, FormStatus } from "../generated/graphql/types";
import { generateID } from "./generateID";

export function createForm({
  id = generateID("form"),
  ...props
}: Partial<Form>): Form {
  return {
    __typename: "Form",
    id: id,
    readableId: props.readableId || id,
    customId: null,
    emitter: null,
    recipient: null,
    transporter: null,
    wasteDetails: null,
    trader: null,
    createdAt: null,
    updatedAt: null,
    status: FormStatus.Draft,
    signedByTransporter: null,
    sentAt: null,
    sentBy: null,
    wasteAcceptationStatus: null,
    wasteRefusalReason: null,
    receivedBy: null,
    receivedAt: null,
    signedAt: null,
    quantityReceived: null,
    actualQuantity: null,
    processingOperationDone: null,
    processingOperationDescription: null,
    processedBy: null,
    processedAt: null,
    noTraceability: null,
    nextDestination: null,
    appendix2Forms: null,
    ecoOrganisme: null,
    temporaryStorageDetail: null,
    stateSummary: null,
    transportSegments: null,
    currentTransporterSiret: null,
    nextTransporterSiret: null,
    ...props,
  };
}
