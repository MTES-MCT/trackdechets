import React from "react";
import { FieldProps } from "formik";
import { transportModeLabels } from "dashboard/constants";

export default function TransportModeSelect({ field }: FieldProps) {
  return (
    <select
      name={field.name}
      value={field.value}
      onChange={field.onChange}
      className="td-select td-input--medium"
    >
      {Object.entries(transportModeLabels).map(([k, v]) => (
        <option value={`${k}`} key={k}>
          {v}
        </option>
      ))}
    </select>
  );
}
