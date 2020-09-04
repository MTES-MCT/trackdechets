import { MutationResolvers } from "../../generated/graphql/types";
import createForm from "./mutations/createForm";
import updateForm from "./mutations/updateForm";
import updateTransporterFields from "./mutations/updateTransporterFields";
import saveForm from "./mutations/saveForm";
import deleteForm from "./mutations/deleteForm";
import duplicateForm from "./mutations/duplicateForm";
import markAsSealed from "./mutations/markAsSealed";
import markAsSent from "./mutations/markAsSent";
import signedByTransporter from "./mutations/signedByTransporter";
import markAsReceived from "./mutations/markAsReceived";
import markAsTempStored from "./mutations/markAsTempStored";
import markAsProcessed from "./mutations/markAsProcessed";
import markAsResealed from "./mutations/markAsResealed";
import markAsResent from "./mutations/markAsResent";
import prepareSegment from "./mutations/prepareSegment";
import editSegment from "./mutations/editSegment";
import takeOverSegment from "./mutations/takeOverSegment";
import markSegmentAsReadyToTakeOver from "./mutations/markSegmentAsReadyToTakeOver";
import importPaperForm from "./mutations/importPaperForm";

const Mutation: MutationResolvers = {
  createForm,
  updateForm,
  updateTransporterFields,
  saveForm,
  deleteForm,
  duplicateForm,
  markAsSealed,
  markAsSent,
  signedByTransporter,
  markAsReceived,
  markAsTempStored,
  markAsResealed,
  markAsResent,
  markAsProcessed,
  prepareSegment,
  editSegment,
  markSegmentAsReadyToTakeOver,
  takeOverSegment,
  importPaperForm
};

export default Mutation;
