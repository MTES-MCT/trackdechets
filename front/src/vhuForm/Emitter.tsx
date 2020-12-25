import { RedErrorMessage } from "common/components";
import CompanySelector from "form/company/CompanySelector";
import DateInput from "form/custom-inputs/DateInput";
import { Field } from "formik";
import React from "react";

export default function Emitter() {
  return (
    <>
      <div className="form__row">
        <label>
          Agréément
          <Field type="text" name="emitter.agreement" className="td-input" />
        </label>

        <RedErrorMessage name="emitter.receipt" />

        <label>
          Limite de validité (optionnel)
          <Field
            component={DateInput}
            name="emitter.validityLimit"
            className={`td-input`}
          />
        </label>

        <RedErrorMessage name="emitter.validityLimit" />
      </div>

      <CompanySelector name="emitter.company" heading="Entreprise émettrice" />
    </>
  );
}
