import { or, and } from "graphql-shield";

import {
  canAccessForm,
  isFormRecipient,
  isFormEmitter,
  isFormTransporter,
  isFormTrader,
  isFormTempStorer,
  isAllowedToUseAppendix2Forms
} from "./rules";
import {
  isAuthenticated,
  isCompanyMember,
  isCompanyAdmin,
  isCompaniesUser
} from "../common/rules";

export default {
  Query: {
    form: canAccessForm,
    formPdf: or(canAccessForm, isFormTransporter),
    formsRegister: isCompaniesUser,
    forms: isAuthenticated,
    stats: isAuthenticated,
    formsLifeCycle: isAuthenticated,
    appendixForms: or(isCompanyMember, isCompanyAdmin)
  },
  Mutation: {
    saveForm: and(isAuthenticated, isAllowedToUseAppendix2Forms),
    deleteForm: canAccessForm,
    duplicateForm: canAccessForm,
    markAsSealed: or(isFormRecipient, isFormEmitter, isFormTrader),
    markAsSent: or(isFormRecipient, isFormEmitter),
    markAsReceived: isFormRecipient,
    markAsProcessed: isFormRecipient,
    signedByTransporter: isFormTransporter,
    updateTransporterFields: isFormTransporter,
    markAsTempStored: isFormTempStorer,
    markAsResealed: isFormTempStorer,
    markAsResent: isFormTempStorer
  }
};
