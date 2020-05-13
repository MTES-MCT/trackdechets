import React from "react";
import CompanySelector from "./company/CompanySelector";
import { Field, connect } from "formik";
import DateInput from "../common/DateInput";
import RedErrorMessage from "../common/RedErrorMessage";

type Values = {
  transporter: { isExemptedOfReceipt: boolean };
};
export default connect<{}, Values>(function Transporter(props) {
  return (
    <>
      <h4>Transporteur</h4>
      <CompanySelector
        name="transporter.company"
        onCompanySelected={(transporter) => {
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
            props.formik.setFieldValue("transporter.validityLimit", "");
            props.formik.setFieldValue("transporter.department", "");
          }
        }}
      />

      <h4>Autorisations</h4>
      <div className="form__group">
        <label>
          <Field
            type="checkbox"
            name="transporter.isExemptedOfReceipt"
            checked={props.formik.values.transporter.isExemptedOfReceipt}
          />
          Le transporteur déclare être exempté de récépissé conformément aux
          dispositions de l'article R.541-50 du code de l'environnement.
        </label>
      </div>
      {!props.formik.values.transporter.isExemptedOfReceipt && (
        <div className="form__group">
          <label>
            Numéro de récépissé
            <Field type="text" name="transporter.receipt" />
          </label>

          <RedErrorMessage name="transporter.receipt" />

          <label>
            Département
            <Field
              type="text"
              name="transporter.department"
              placeholder="Ex: 83"
            />
          </label>

          <RedErrorMessage name="transporter.department" />

          <label>
            Limite de validité
            <Field component={DateInput} name="transporter.validityLimit" />
          </label>

          <RedErrorMessage name="transporter.validityLimit" />

          <label>
            Immatriculation
            <Field
              type="text"
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
