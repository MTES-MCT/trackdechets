import React from "react";
import { ErrorMessage, ErrorMessageProps } from "formik";

function RedErrorMessage(props: ErrorMessageProps) {
  return (
    <ErrorMessage
      {...props}
      render={msg => <div className="error-message">{msg}</div>}
    />
  );
}
export default React.memo(RedErrorMessage);
