import { MutationResolvers } from "../../generated/graphql/types";
import createForm from "./mutations/createForm";
import updateForm from "./mutations/updateForm";
import updateTransporterFields from "./mutations/updateTransporterFields";
import saveForm from "./mutations/saveForm";
import deleteForm from "./mutations/deleteForm";
import duplicateForm from "./mutations/duplicateForm";
import markAsSealed from "./mutations/markAsSealed";
import markAsSent from "./mutations/markAsSent";
import signEmissionForm from "./mutations/signEmissionForm";
import signTransportForm from "./mutations/signTransportForm";
import signedByTransporter from "./mutations/signedByTransporter";
import markAsReceived from "./mutations/markAsReceived";
import markAsAccepted from "./mutations/markAsAccepted";
import markAsTempStored from "./mutations/markAsTempStored";
import markAsTempStorerAccepted from "./mutations/markAsTempStorerAccepted";
import markAsProcessed from "./mutations/markAsProcessed";
import markAsResealed from "./mutations/markAsResealed";
import markAsResent from "./mutations/markAsResent";
import prepareSegment from "./mutations/prepareSegment";
import editSegment from "./mutations/editSegment";
import takeOverSegment from "./mutations/takeOverSegment";
import markSegmentAsReadyToTakeOver from "./mutations/markSegmentAsReadyToTakeOver";
import importPaperForm from "./mutations/importPaperForm";
import createFormRevisionRequest from "./mutations/createFormRevisionRequest";
import submitFormRevisionRequestApproval from "./mutations/submitFormRevisionRequestApproval";
import cancelFormRevisionRequest from "./mutations/cancelFormRevisionRequest";

const Mutation: MutationResolvers = {
  createForm,
  updateForm,
  updateTransporterFields,
  saveForm,
  deleteForm,
  duplicateForm,
  markAsSealed,
  markAsSent,
  signEmissionForm,
  signTransportForm,
  signedByTransporter,
  markAsReceived,
  markAsAccepted,
  markAsTempStored,
  markAsTempStorerAccepted,
  markAsResealed,
  markAsResent,
  markAsProcessed,
  importPaperForm,
  prepareSegment,
  editSegment,
  markSegmentAsReadyToTakeOver,
  takeOverSegment,
  createFormRevisionRequest: createFormRevisionRequest as any, // TODO better typing ?
  cancelFormRevisionRequest,
  submitFormRevisionRequestApproval: submitFormRevisionRequestApproval as any
};

export default Mutation;
