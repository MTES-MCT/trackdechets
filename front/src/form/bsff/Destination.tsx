import React from "react";
import { Field } from "formik";
import CompanySelector from "form/common/components/company/CompanySelector";

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
          <option value="R2">R2</option>
          <option value="R12">R12</option>
          <option value="D10">D10</option>
          <option value="D13">D13</option>
          <option value="D14">D14</option>
        </Field>
      </div>
    </>
  );
}
