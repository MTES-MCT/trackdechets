import { or } from "graphql-shield";

import {
  canAccessForm,
  isFormRecipient,
  isFormEmitter,
  isFormTransporter
} from "./rules";
import {
  isAuthenticated,
  isCompanyMember,
  isCompanyAdmin
} from "../common/rules";

export default {
  Query: {
    form: canAccessForm,
    formPdf: canAccessForm,
    forms: isAuthenticated,
    stats: isAuthenticated,
    appendixForms: or(isCompanyMember, isCompanyAdmin)
  },
  Mutation: {
    saveForm: isAuthenticated,
    deleteForm: canAccessForm,
    duplicateForm: canAccessForm,
    markAsSealed: canAccessForm,
    markAsSent: or(isFormRecipient, isFormEmitter),
    markAsReceived: canAccessForm,
    markAsProcessed: canAccessForm,
    signedByTransporter: isFormTransporter
  }
};
