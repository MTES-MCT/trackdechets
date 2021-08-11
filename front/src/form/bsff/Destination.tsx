import React from "react";
import { Field } from "formik";
import CompanySelector from "form/common/components/company/CompanySelector";
import { OPERATION_CODES } from "./utils/constants";

export default function Destination({ disabled }) {
  return (
    <>
      {disabled && (
        <div className="notification notification--error">
          Les champs ci-dessous ont été scellés via signature et ne sont plus
          modifiables.
        </div>
      )}

      <CompanySelector
        disabled={disabled}
        name="destination.company"
        heading="Installation de destination"
      />

      <div className="form__row">
        <label>Opération d’élimination / valorisation prévue (code D/R)</label>
        <Field
          as="select"
          name="destination.plannedOperation.code"
          className="td-select"
          disabled={disabled}
        >
          <option />
          {OPERATION_CODES.map(operation => (
            <option key={operation.value} value={operation.value}>
              {operation.value} - {operation.description}
            </option>
          ))}
        </Field>
      </div>
    </>
  );
}
