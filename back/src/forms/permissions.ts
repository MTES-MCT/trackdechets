import { and, or } from "graphql-shield";

import { canAccessForm, isFormRecipient, isFormEmitter } from "./rules";
import { isAuthenticated, isCompanyMember } from "../common/rules";

export default {
  Query: {
    form: canAccessForm,
    forms: isAuthenticated,
    stats: isAuthenticated,
    appendixForms: and(isAuthenticated, isCompanyMember) // TODO emitterSiret and not siret
  },
  Mutation: {
    saveForm: isAuthenticated,
    deleteForm: canAccessForm,
    duplicateForm: canAccessForm,
    markAsSealed: canAccessForm,
    markAsSent: or(isFormRecipient, isFormEmitter),
    markAsReceived: canAccessForm,
    markAsProcessed: canAccessForm
  }
};
