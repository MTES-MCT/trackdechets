import { useFormikContext, Field } from "formik";
import React from "react";
import CompanySelector from "../company/CompanySelector";
import { Form } from "../model";
import { Operations } from "../processing-operation/ProcessingOperation";

export default function TemporaryStorage(props) {
  const { values } = useFormikContext<Form>();

  if (!values.recipient?.isTempStorage) {
    return null;
  }

  return (
    <>
      <h4>Installation de destination prévue</h4>
      <CompanySelector name={`${props.name}.destination.company`} />

      <div className="form__group">
        <label>
          Numéro de CAP (le cas échéant)
          <Field type="text" name={`${props.name}.destination.cap`} />
        </label>
      </div>

      <div className="form__group">
        <label>Opération d'élimination / valoristation prévue (code D/R)</label>

        <Field
          component="select"
          name={`${props.name}.destination.processingOperation`}
        >
          <option value="">Choisissez...</option>
          {Operations.map(o => (
            <option key={o.code} value={o.code}>
              {o.code} - {o.description.substr(0, 50)}
              {o.description.length > 50 ? "..." : ""}
            </option>
          ))}
        </Field>
      </div>
    </>
  );
}
