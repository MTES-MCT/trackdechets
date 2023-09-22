import { ApolloError } from "@apollo/client";
import toast from "react-hot-toast";

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
      toast.error(gqerr.message, { duration: 7 });
    });
  err.message && toast.error(err.message, { duration: 7 });
};
