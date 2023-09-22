import React from "react";
import { FieldProps } from "formik";
import { transportModeLabels } from "../../dashboard/constants";

export function FieldTransportModeSelect({
  field,
  form,
  ...props
}: FieldProps) {
  return (
    <select {...field} {...props} className="td-select td-input--medium">
      {Object.entries(transportModeLabels).map(([k, v]) => (
        <option value={`${k}`} key={k}>
          {v}
        </option>
      ))}
    </select>
  );
}
