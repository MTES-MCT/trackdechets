import React from "react";
import { connect } from "formik";

/**
 * Retrieve status property from Formik context and display it as an error message if not empty.
 * Used in child components (eg. Wizard Pages) when accessing parent context is not trivial.
 *
 */
const StatusErrorMessage = (props: any) => {
  return props.formik.status ? (
    <div className="form-error-message form-error-message--bold">
      {props.formik.status}
    </div>
  ) : null;
};

export default connect(StatusErrorMessage);
