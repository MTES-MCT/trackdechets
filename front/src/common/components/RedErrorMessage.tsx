import React from "react";
import { ErrorMessage, ErrorMessageProps } from "formik";

export default function RedErrorMessage(props: ErrorMessageProps) {
  return (
    <ErrorMessage
      {...props}
      render={msg => <div className="error-message">{msg}</div>}
    />
  );
}
