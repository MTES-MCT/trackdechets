import { ApolloError } from "@apollo/client";
import cogoToast from "cogo-toast";

/**
 * Common toaster display for ApolloError on form submission
 */
export const formInputToastError = (err: ApolloError) => {
  err.graphQLErrors.length &&
    err.graphQLErrors.forEach(gqerr => {
      // avoid duplicate error
      if (gqerr.message === err.message) {
        return;
      }
      cogoToast.error(gqerr.message, { hideAfter: 7 });
    });
  err.message && cogoToast.error(err.message, { hideAfter: 7 });
};
