import { chain, or } from "graphql-shield";
import {
  isAuthenticated,
  isCompaniesUser,
  isCompanyAdmin,
  isCompanyMember
} from "../common/rules";
import {
  canAccessForm,
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
  formsSchema
} from "./rules/schema";

export default {
  Query: {
    form: canAccessForm,
    formPdf: or(canAccessForm, isFormTransporter),
    formsRegister: isCompaniesUser,
    forms: chain(
      formsSchema,
      or(or(isCompanyMember, isCompanyAdmin), canAccessFormsWithoutSiret)
    ),
    stats: isAuthenticated,
    formsLifeCycle: isAuthenticated,
    appendixForms: or(isCompanyMember, isCompanyAdmin)
  },
  Mutation: {
    saveForm: isAuthenticated,
    deleteForm: canAccessForm,
    duplicateForm: canAccessForm,
    markAsSealed: or(
      isFormEcoOrganisme,
      isFormRecipient,
      isFormEmitter,
      isFormTrader,
      isFormTempStorer
    ),
    markAsSent: chain(markAsSentSchema, or(isFormRecipient, isFormEmitter)),
    markAsReceived: chain(markAsReceivedSchema, isFormRecipient),
    markAsProcessed: chain(markAsProcessedSchema, isFormRecipient),
    signedByTransporter: chain(signedByTransporterSchema, isFormTransporter),
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
    )
  }
};
