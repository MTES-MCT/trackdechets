import RedErrorMessage from "common/components/RedErrorMessage";
import CompanySelector from "form/company/CompanySelector";
import DateInput from "form/custom-inputs/DateInput";
import { Field, useFormikContext } from "formik";
import React from "react";
import styles from "./Transporter.module.scss";

export default function Transporter() {
  const { setFieldValue } = useFormikContext();
  return (
    <>
      <h4 className="form__section-heading">Transporteur</h4>
      <div className="form__row">
        <label>
          Agréément
          <Field
            type="text"
            name="transporter.agreement"
            className="td-input"
          />
        </label>

        <RedErrorMessage name="transporter.receipt" />
      </div>

      <CompanySelector
        name="transporter.company"
        onCompanySelected={transporter => {
          if (transporter.transporterReceipt) {
            setFieldValue(
              "transporter.receipt",
              transporter.transporterReceipt.receiptNumber
            );
            setFieldValue(
              "transporter.validityLimit",
              transporter.transporterReceipt.validityLimit
            );
            setFieldValue(
              "transporter.department",
              transporter.transporterReceipt.department
            );
          } else {
            setFieldValue("transporter.receipt", "");
            setFieldValue("transporter.validityLimit", null);
            setFieldValue("transporter.department", "");
          }
        }}
      />

      <h4 className="form__section-heading">Autorisations</h4>
      <div className="form__row">
        <label>
          Numéro de récépissé
          <Field type="text" name="transporter.receipt" className="td-input" />
        </label>

        <RedErrorMessage name="transporter.receipt" />

        <label>
          Département
          <Field
            type="text"
            name="transporter.department"
            placeholder="Ex: 83"
            className={`td-input ${styles.transporterDepartment}`}
          />
        </label>

        <RedErrorMessage name="transporter.department" />

        <label>
          Limite de validité (optionnel)
          <Field
            component={DateInput}
            name="transporter.validityLimit"
            className={`td-input ${styles.transporterValidityLimit}`}
          />
        </label>

        <RedErrorMessage name="transporter.validityLimit" />
      </div>
    </>
  );
}
