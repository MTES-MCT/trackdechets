import { or } from "graphql-shield";

import {
  canAccessForm,
  isFormRecipient,
  isFormEmitter,
  isFormTransporter,
  isFormTrader
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
    formPdf: canAccessForm,
    formsRegister: isCompaniesUser,
    forms: isAuthenticated,
    stats: isAuthenticated,
    formsLifeCycle: isAuthenticated,
    appendixForms: or(isCompanyMember, isCompanyAdmin)
  },
  Mutation: {
    saveForm: isAuthenticated,
    deleteForm: canAccessForm,
    duplicateForm: canAccessForm,
    markAsSealed: or(isFormRecipient, isFormEmitter, isFormTrader),
    markAsSent: or(isFormRecipient, isFormEmitter),
    markAsReceived: isFormRecipient,
    markAsProcessed: isFormRecipient,
    signedByTransporter: isFormTransporter,
    updateTransporterFields: isFormTransporter
  }
};
