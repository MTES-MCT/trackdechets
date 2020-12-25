import { RedErrorMessage } from "common/components";
import CompanySelector from "form/company/CompanySelector";
import DateInput from "form/custom-inputs/DateInput";
import { Field } from "formik";
import React from "react";

export default function Recipient() {
  return (
    <>
      <h4 className="form__section-heading">Installation de destination</h4>

      <CompanySelector name="recipient.company" />

      <div className="form__row">
        <label>
          Agréément
          <Field type="text" name="recipient.agreement" className="td-input" />
        </label>

        <RedErrorMessage name="recipient.receipt" />

        <label>
          Limite de validité (optionnel)
          <Field
            component={DateInput}
            name="recipient.validityLimit"
            className={`td-input`}
          />
        </label>

        <RedErrorMessage name="recipient.validityLimit" />
      </div>
    </>
  );
}
