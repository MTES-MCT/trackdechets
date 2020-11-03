import React from "react";
import { ErrorMessage } from "formik";

export default function RedErrorMessage(props: any) {
  return (
    <ErrorMessage
      {...props}
      render={msg => <div className="error-message">{msg}</div>}
    />
  );
}
