import { ApolloError } from "@apollo/client";
import toast from "react-hot-toast";
import { TOAST_DURATION } from "../../../common/config";

/**
 * Common toaster display for ApolloError on form submission
 */
export const toastApolloError = (err: ApolloError) => {
  err.graphQLErrors.length &&
    err.graphQLErrors.forEach(gqerr => {
      // avoid duplicate error
      if (gqerr.message === err.message) {
        return;
      }
      toast.error(gqerr.message, { duration: TOAST_DURATION });
    });
  err.message && toast.error(err.message, { duration: TOAST_DURATION });
};
