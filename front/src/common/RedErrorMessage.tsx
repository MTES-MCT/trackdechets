import React from "react";
import { ErrorMessage } from "formik";

export default function RedErrorMessage(props: any) {
  return (
    <ErrorMessage
      {...props}
      render={(msg) => <div className="input-error-message">{msg}</div>}
    />
  );
}
