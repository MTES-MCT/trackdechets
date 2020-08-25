import { chain, or } from "graphql-shield";
import {
  isAuthenticated,
  isCompaniesUser,
  isCompanyAdmin,
  isCompanyMember
} from "../common/rules";
import {
  canAccessForm,
  canCreateForm,
  canUpdateForm,
  canSaveForm,
  isFormEmitter,
  isFormRecipient,
  isFormTempStorer,
  isFormTrader,
  isFormTransporter,
  isFormEcoOrganisme,
  hasFinalDestination,
  canAccessFormsWithoutSiret
} from "./rules/permissions";
import {
  markAsProcessedSchema,
  markAsReceivedSchema,
  markAsResealedSchema,
  markAsResentSchema,
  markAsSentSchema,
  markAsTempStoredSchema,
  signedByTransporterSchema,
  temporaryStorageDestinationSchema,
  formsSchema,
  formsRegisterSchema
} from "./rules/schema";

export default {
  Query: {
    //form: or(canAccessForm, isFormTransporter),
    // formPdf: or(canAccessForm, isFormTransporter)
    // forms: chain(
    //   formsSchema,
    //   or(or(isCompanyMember, isCompanyAdmin), canAccessFormsWithoutSiret)
    // ),
    //formsRegister: chain(formsRegisterSchema, isCompaniesUser),
    //stats: isAuthenticated
    //formsLifeCycle: isAuthenticated
    // appendixForms: or(isCompanyMember, isCompanyAdmin)
  },
  Mutation: {
    //createForm: chain(isAuthenticated, canCreateForm),
    //updateForm: chain(isAuthenticated, canUpdateForm),
    //saveForm: chain(isAuthenticated, canSaveForm),
    // deleteForm: canAccessForm,
    // duplicateForm: canAccessForm,
    // markAsSealed: or(
    //   isFormEcoOrganisme,
    //   isFormRecipient,
    //   isFormEmitter,
    //   isFormTrader,
    //   isFormTempStorer
    // ),
    //markAsSent: chain(markAsSentSchema, or(isFormRecipient, isFormEmitter)),
    //markAsReceived: chain(markAsReceivedSchema, isFormRecipient),
    //markAsProcessed: chain(markAsProcessedSchema, isFormRecipient),
    //signedByTransporter: chain(signedByTransporterSchema, isFormTransporter),
    updateTransporterFields: isFormTransporter,
    markAsTempStored: chain(markAsTempStoredSchema, isFormTempStorer),
    markAsResealed: chain(
      markAsResealedSchema,
      or(temporaryStorageDestinationSchema, hasFinalDestination),
      isFormTempStorer
    ),
    markAsResent: chain(
      markAsResentSchema,
      or(temporaryStorageDestinationSchema, hasFinalDestination),
      isFormTempStorer
    ),
    prepareSegment: isAuthenticated,
    markSegmentAsReadyToTakeOver: isAuthenticated,
    takeOverSegment: isAuthenticated,
    editSegment: isAuthenticated
  }
};
