import React from "react";
import CompanySelector from "./company/CompanySelector";
import { Field, connect } from "formik";
import RedErrorMessage from "src/common/components/RedErrorMessage";
import DateInput from "./custom-inputs/DateInput";
import TdSwitch from "src/common/components/Switch";

import styles from  "./Transporter.module.scss";
type Values = {
  transporter: { isExemptedOfReceipt: boolean };
}; 
export default connect<{}, Values>(function Transporter(props) {
  return (
    <>
      <h4 className="form__section-heading">Transporteur</h4>
      <CompanySelector
        name="transporter.company"
        onCompanySelected={transporter => {
          if (transporter.transporterReceipt) {
            props.formik.setFieldValue(
              "transporter.receipt",
              transporter.transporterReceipt.receiptNumber
            );
            props.formik.setFieldValue(
              "transporter.validityLimit",
              transporter.transporterReceipt.validityLimit
            );
            props.formik.setFieldValue(
              "transporter.department",
              transporter.transporterReceipt.department
            );
          } else {
            props.formik.setFieldValue("transporter.receipt", "");
            props.formik.setFieldValue("transporter.validityLimit", null);
            props.formik.setFieldValue("transporter.department", "");
          }
        }}
      />

      <h4 className="form__section-heading">Autorisations</h4>
      <div className="form__row">
        <TdSwitch
          checked={!!props.formik.values.transporter.isExemptedOfReceipt}
          onChange={() =>
            props.formik.setFieldValue(
              "transporter.isExemptedOfReceipt",
              !props.formik.values.transporter.isExemptedOfReceipt
            )
          }
          label="Le transporteur déclare être exempté de récépissé conformément aux
          dispositions de l'article R.541-50 du code de l'environnement."
        />
      </div>
      {!props.formik.values.transporter.isExemptedOfReceipt && (
        <div className="form__row">
          <label>
            Numéro de récépissé
            <Field
              type="text"
              name="transporter.receipt"
              className="td-input"
            />
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
              className={`td-input ${styles.transporterDepartment}`}
            />
          </label>

          <RedErrorMessage name="transporter.validityLimit" />

          <label>
            Immatriculation (optionnel)
            <Field
              type="text"
              className={`td-input ${styles.transporterNumberPlate}`}
              name="transporter.numberPlate"
              placeholder="Plaque d'immatriculation du véhicule"
            />
          </label>

          <RedErrorMessage name="transporter.numberPlate" />
        </div>
      )}
    </>
  );
});
